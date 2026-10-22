
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

function hasDetectionPermissions(guild) {
    return Boolean(
        guild.members.me?.permissions.has(
            PermissionFlagsBits.ViewAuditLog
        )
    );
}

function hasPunishmentPermission(guild, punishment) {
    const me = guild.members.me;

    if (!me) {
        return false;
    }

    switch (punishment) {
        case 'ban':
            return me.permissions.has(
                PermissionFlagsBits.BanMembers
            );

        case 'kick':
            return me.permissions.has(
                PermissionFlagsBits.KickMembers
            );

        case 'strip':
            return me.permissions.has(
                PermissionFlagsBits.ManageRoles
            );

        case 'none':
            return true;

        default:
            return false;
    }
}

async function punish(guild, userId, punishment) {
    const me = guild.members.me;

    if (!me) {
        return false;
    }

    const member = await guild.members.fetch(userId).catch(() => null);

    if (!member || member.id === guild.ownerId) {
        return false;
    }

    try {
        switch (punishment) {
            case 'ban':
                if (
                    !hasPunishmentPermission(guild, 'ban') ||
                    !member.bannable
                ) {
                    return false;
                }

                await member.ban({
                    reason: 'Marion Anti-Nuke protection',
                });

                return true;

            case 'kick':
                if (
                    !hasPunishmentPermission(guild, 'kick') ||
                    !member.kickable
                ) {
                    return false;
                }

                await member.kick(
                    'Marion Anti-Nuke protection'
                );

                return true;

            case 'strip':
                if (
                    !hasPunishmentPermission(guild, 'strip') ||
                    !member.manageable
                ) {
                    return false;
                }

                await member.roles.set(
                    [],
                    'Marion Anti-Nuke protection'
                );

                return true;

            case 'none':
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
    const config = await getGuildConfig(
        guild.client,
        guild.id
    );

    const channelId = config?.antinuke?.logChannelId;

    if (!channelId) {
        return;
    }

    const channel = guild.channels.cache.get(channelId);

    if (!channel?.isTextBased()) {
        return;
    }

    const permissions = channel.permissionsFor(guild.members.me);

    if (!permissions?.has(PermissionFlagsBits.SendMessages)) {
        return;
    }

    const result = punishment === 'none'
        ? 'Detection only'
        : punished
            ? 'Punishment applied'
            : 'Punishment failed';

    await channel.send({
        embeds: [{
            title: 'Anti-Nuke Triggered',
            description: [
                `**User:** <@${userId}>`,
                `**Action:** ${ACTION_LABELS[action] ?? action}`,
                `**Threshold:** ${count}/${threshold}`,
                `**Punishment:** ${punishment}`,
                `**Result:** ${result}`,
            ].join('\n'),
            timestamp: new Date().toISOString(),
        }],
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

    const config = await getGuildConfig(
        guild.client,
        guild.id
    );

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

    if (!hasDetectionPermissions(guild)) {
        return {
            triggered: false,
            reason: 'missing_audit_log_permission',
        };
    }

    const punishment = antinuke.punishment ?? 'ban';

    if (!['ban', 'kick', 'strip', 'none'].includes(punishment)) {
        return {
            triggered: false,
            reason: 'invalid_punishment',
        };
    }

    if (!hasPunishmentPermission(guild, punishment)) {
        return {
            triggered: false,
            reason: 'missing_punishment_permissions',
        };
    }

    const key = getBucketKey(guild.id, userId, action);
    const now = Date.now();

    if (now < (punishmentCooldowns.get(key) ?? 0)) {
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

    // Set cooldown before awaiting punishment to prevent concurrent triggers.
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
