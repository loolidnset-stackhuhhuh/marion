
import { PermissionFlagsBits } from 'discord.js';

import { getGuildConfig } from '../config/guildConfig.js';

const actionBuckets = new Map();
const punishmentCooldowns = new Map();

const PUNISHMENT_COOLDOWN_MS = 15_000;

const ACTION_LABELS = {
    ban: 'ban',
    kick: 'kick',
    channelDelete: 'channel deletion',
    channelCreate: 'channel creation',
    roleDelete: 'role deletion',
    roleCreate: 'role creation',
    webhook: 'webhook changes',
    botAdd: 'bot addition',
    guildUpdate: 'server changes',
};

function getBucketKey(guildId, userId, action) {
    return `${guildId}:${userId}:${action}`;
}

function getActionBucket(guildId, userId, action) {
    const key = getBucketKey(guildId, userId, action);

    if (!actionBuckets.has(key)) {
        actionBuckets.set(key, []);
    }

    return actionBuckets.get(key);
}

function cleanupBucket(bucket, windowMs) {
    const cutoff = Date.now() - windowMs;

    while (bucket.length && bucket[0] < cutoff) {
        bucket.shift();
    }
}

function isWhitelisted(guild, userId, config) {
    if (userId === guild.ownerId) {
        return true;
    }

    if (config?.whitelist?.users?.includes(userId)) {
        return true;
    }

    const member = guild.members.cache.get(userId);

    if (!member) {
        return false;
    }

    return member.roles.cache.some((role) =>
        config?.whitelist?.roles?.includes(role.id)
    );
}

function getRequiredPermission(action, punishment) {
    switch (action) {
        case 'ban':
        case 'kick':
            return PermissionFlagsBits.ViewAuditLog;

        case 'botAdd':
            if (punishment === 'kick') {
                return PermissionFlagsBits.KickMembers;
            }

            if (punishment === 'strip') {
                return PermissionFlagsBits.ManageRoles;
            }

            return PermissionFlagsBits.BanMembers;

        case 'channelDelete':
        case 'channelCreate':
            return PermissionFlagsBits.ManageChannels;

        case 'roleDelete':
        case 'roleCreate':
            return PermissionFlagsBits.ManageRoles;

        case 'webhook':
            return PermissionFlagsBits.ManageWebhooks;

        case 'guildUpdate':
            return PermissionFlagsBits.ManageGuild;

        default:
            return null;
    }
}

function hasRequiredPermissions(guild, action, punishment) {
    const me = guild.members.me;

    if (!me) {
        return false;
    }

    const requiredPermission = getRequiredPermission(
        action,
        punishment,
    );

    if (!requiredPermission) {
        return false;
    }

    return me.permissions.has(requiredPermission);
}

async function punish(guild, userId, punishment) {
    if (!guild.members.me) {
        return false;
    }

    const member = await guild.members.fetch(userId).catch(() => null);

    if (!member || member.id === guild.ownerId || !member.manageable) {
        return false;
    }

    try {
        switch (punishment) {
            case 'ban':
                if (!guild.members.me.permissions.has(
                    PermissionFlagsBits.BanMembers
                )) {
                    return false;
                }

                await member.ban({
                    reason: 'Marion Anti-Nuke protection',
                });

                return true;

            case 'kick':
                if (!guild.members.me.permissions.has(
                    PermissionFlagsBits.KickMembers
                )) {
                    return false;
                }

                await member.kick(
                    'Marion Anti-Nuke protection'
                );

                return true;

            case 'strip':
                if (!guild.members.me.permissions.has(
                    PermissionFlagsBits.ManageRoles
                )) {
                    return false;
                }

                await member.roles.set(
                    [],
                    'Marion Anti-Nuke protection'
                );

                return true;

            case 'none':
                return false;

            default:
                return false;
        }
    } catch {
        return false;
    }
}

async function sendLog(guild, {
    action,
    userId,
    count,
    threshold,
    punishment,
    punished,
}) {
    const config = await getGuildConfig(guild.id);
    const channelId = config?.antinuke?.logChannelId;

    if (!channelId) {
        return;
    }

    const channel = guild.channels.cache.get(channelId);

    if (!channel?.isTextBased()) {
        return;
    }

    const embed = {
        title: 'Anti-Nuke Triggered',
        description: [
            `**User:** <@${userId}>`,
            `**Action:** ${ACTION_LABELS[action] ?? action}`,
            `**Threshold:** ${count}/${threshold}`,
            `**Punishment:** ${punishment}`,
            `**Result:** ${punished ? 'Punishment applied' : 'Punishment failed'}`,
        ].join('\n'),
        timestamp: new Date().toISOString(),
    };

    await channel.send({
        embeds: [embed],
        allowedMentions: { parse: [] },
    }).catch(() => {});
}

export async function checkAntiNuke(guild, userId, action) {
    if (!guild || !userId || !action) {
        return {
            triggered: false,
            reason: 'invalid_data',
        };
    }

    const config = await getGuildConfig(guild.id);
    const antinuke = config?.antinuke;

    if (!antinuke?.enabled) {
        return {
            triggered: false,
            reason: 'disabled',
        };
    }

    if (!antinuke.protections?.[action]) {
        return {
            triggered: false,
            reason: 'protection_disabled',
        };
    }

    if (isWhitelisted(guild, userId, antinuke)) {
        return {
            triggered: false,
            reason: 'whitelisted',
        };
    }

    const thresholdConfig = antinuke.thresholds?.[action];

    if (
        !thresholdConfig ||
        !Number.isInteger(thresholdConfig.amount) ||
        thresholdConfig.amount < 1 ||
        !Number.isFinite(thresholdConfig.window) ||
        thresholdConfig.window < 1
    ) {
        return {
            triggered: false,
            reason: 'invalid_threshold',
        };
    }

    const punishment = antinuke.punishment ?? 'ban';

    if (punishment !== 'none' &&
        !hasRequiredPermissions(guild, action, punishment)) {
        return {
            triggered: false,
            reason: 'missing_permissions',
        };
    }

    const key = getBucketKey(guild.id, userId, action);
    const now = Date.now();
    const cooldownUntil = punishmentCooldowns.get(key) ?? 0;

    if (now < cooldownUntil) {
        return {
            triggered: false,
            reason: 'punishment_cooldown',
        };
    }

    const bucket = getActionBucket(guild.id, userId, action);

    bucket.push(now);
    cleanupBucket(bucket, thresholdConfig.window);

    const count = bucket.length;
    const threshold = thresholdConfig.amount;

    if (count < threshold) {
        return {
            triggered: false,
            count,
            threshold,
        };
    }

    punishmentCooldowns.set(
        key,
        now + PUNISHMENT_COOLDOWN_MS
    );

    try {
        const punished = punishment === 'none'
            ? false
            : await punish(guild, userId, punishment);

        await sendLog(guild, {
            action,
            userId,
            count,
            threshold,
            punishment,
            punished,
        });

        return {
            triggered: true,
            count,
            threshold,
            punishment,
            punished,
        };
    } finally {
        bucket.length = 0;
    }
}

export function clearAntiNukeBuckets(guildId) {
    for (const key of actionBuckets.keys()) {
        if (key.startsWith(`${guildId}:`)) {
            actionBuckets.delete(key);
        }
    }

    for (const key of punishmentCooldowns.keys()) {
        if (key.startsWith(`${guildId}:`)) {
            punishmentCooldowns.delete(key);
        }
    }
}
