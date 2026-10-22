
import { Events } from 'discord.js';
import { AuditLogEvent } from 'discord.js';

import { logger } from '../utils/logger.js';
import { checkAntiNuke } from '../services/antinuke/antinukeService.js';

const ACTION_TYPES = [
    AuditLogEvent.WebhookCreate,
    AuditLogEvent.WebhookUpdate,
    AuditLogEvent.WebhookDelete,
];

const processedEntries = new Map();

const MAX_ENTRY_AGE_MS = 10_000;
const DEDUPLICATION_WINDOW_MS = 60_000;

function cleanupProcessedEntries(now) {
    for (const [entryId, timestamp] of processedEntries) {
        if (now - timestamp > DEDUPLICATION_WINDOW_MS) {
            processedEntries.delete(entryId);
        }
    }
}

async function findWebhookAuditEntry(guild) {
    const now = Date.now();
    const matches = [];

    for (const type of ACTION_TYPES) {
        const logs = await guild.fetchAuditLogs({
            type,
            limit: 10,
        }).catch(() => null);

        if (!logs) {
            continue;
        }

        for (const entry of logs.entries.values()) {
            if (!entry.id || !entry.executorId) {
                continue;
            }

            const age = now - entry.createdTimestamp;

            if (age < 0 || age > MAX_ENTRY_AGE_MS) {
                continue;
            }

            matches.push({
                entry,
                type,
            });
        }
    }

    cleanupProcessedEntries(now);

    matches.sort(
        (a, b) =>
            b.entry.createdTimestamp - a.entry.createdTimestamp
    );

    const match = matches.find(
        ({ entry }) => !processedEntries.has(entry.id)
    );

    if (!match) {
        return null;
    }

    processedEntries.set(match.entry.id, now);

    return match;
}

export default {
    name: Events.WebhooksUpdate,
    once: false,

    async execute(channel) {
        if (!channel?.guild) {
            return;
        }

        const guild = channel.guild;

        try {
            const match = await findWebhookAuditEntry(guild);

            if (!match?.entry?.executorId) {
                return;
            }

            await checkAntiNuke(
                guild,
                match.entry.executorId,
                'webhook',
            );
        } catch (error) {
            logger.warn(
                `Anti-Nuke webhook check failed in guild ${guild.id}:`,
                error,
            );
        }
    },
};
