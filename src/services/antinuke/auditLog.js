
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
                if (!entry.executorId) {
                    continue;
                }

                // Ignore old audit-log entries.
                if (now - entry.createdTimestamp > 10_000) {
                    continue;
                }

                // If a target was provided, require an exact match.
                if (
                    targetId &&
                    entry.target?.id !== targetId
                ) {
                    continue;
                }

                matches.push(entry);
            }
        }

        if (!matches.length) {
            return null;
        }

        // Use the newest matching audit-log entry.
        matches.sort(
            (a, b) => b.createdTimestamp - a.createdTimestamp
        );

        const entry = matches[0];

        return {
            userId: entry.executorId,
            entry,
        };
    } catch {
        return null;
    }
}
