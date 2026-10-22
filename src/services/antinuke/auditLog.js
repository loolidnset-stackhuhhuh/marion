
import { AuditLogEvent } from 'discord.js';

const AUDIT_LOG_TYPES = {
    ban: [AuditLogEvent.MemberBanAdd],
    kick: [AuditLogEvent.MemberKick],

    channelDelete: [AuditLogEvent.ChannelDelete],
    channelCreate: [AuditLogEvent.ChannelCreate],

    roleDelete: [AuditLogEvent.RoleDelete],
    roleCreate: [AuditLogEvent.RoleCreate],

    webhook: [
        AuditLogEvent.WebhookCreate,
        AuditLogEvent.WebhookUpdate,
        AuditLogEvent.WebhookDelete,
    ],

    botAdd: [AuditLogEvent.BotAdd],
    guildUpdate: [AuditLogEvent.GuildUpdate],
};

const processedEntries = new Map();

const MAX_ENTRY_AGE_MS = 10_000;
const ENTRY_RETENTION_MS = 60_000;

function cleanupProcessedEntries(now) {
    for (const [entryId, timestamp] of processedEntries) {
        if (now - timestamp > ENTRY_RETENTION_MS) {
            processedEntries.delete(entryId);
        }
    }
}

export async function getAuditLogExecutor(
    guild,
    action,
    targetId = null,
) {
    const types = AUDIT_LOG_TYPES[action];

    if (!guild || !types) {
        return null;
    }

    try {
        const now = Date.now();
        const matches = [];

        for (const type of types) {
            const auditLogs = await guild.fetchAuditLogs({
                type,
                limit: 10,
            }).catch(() => null);

            if (!auditLogs) {
                continue;
            }

            for (const entry of auditLogs.entries.values()) {
                if (!entry.executorId || !entry.target?.id) {
                    continue;
                }

                const age = now - entry.createdTimestamp;

                if (age < 0 || age > MAX_ENTRY_AGE_MS) {
                    continue;
                }

                if (
                    targetId &&
                    entry.target.id !== targetId
                ) {
                    continue;
                }

                matches.push(entry);
            }
        }

        if (!matches.length) {
            return null;
        }

        matches.sort(
            (a, b) => b.createdTimestamp - a.createdTimestamp
        );

        cleanupProcessedEntries(now);

        // Prefer the newest matching entry that hasn't been used.
        const entry = matches.find(
            (candidate) =>
                !processedEntries.has(candidate.id)
        );

        if (!entry) {
            return null;
        }

        processedEntries.set(entry.id, now);

        return {
            userId: entry.executorId,
            entry,
        };
    } catch {
        return null;
    }
}
