
import { Events } from 'discord.js';

import { logger } from '../utils/logger.js';

import { getAuditLogExecutor } from '../services/antinuke/auditLog.js';
import { checkAntiNuke } from '../services/antinuke/antinukeService.js';

// Prevent the same audit-log entry from being processed repeatedly.
const processedAuditEntries = new Map();

const DEDUPLICATION_WINDOW = 15_000;

function markAuditEntryProcessed(entryId) {
    const now = Date.now();

    // Remove expired entries to prevent unbounded memory growth.
    for (const [id, timestamp] of processedAuditEntries) {
        if (now - timestamp > DEDUPLICATION_WINDOW) {
            processedAuditEntries.delete(id);
        }
    }

    if (processedAuditEntries.has(entryId)) {
        return false;
    }

    processedAuditEntries.set(entryId, now);

    return true;
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
            const executor = await getAuditLogExecutor(
                guild,
                'webhook'
            );

            if (!executor?.userId || !executor.entry?.id) {
                return;
            }

            // Don't count the same audit-log entry twice.
            if (!markAuditEntryProcessed(executor.entry.id)) {
                return;
            }

            await checkAntiNuke(
                guild,
                executor.userId,
                'webhook'
            );
        } catch (error) {
            logger.warn(
                `Anti-Nuke webhook check failed in guild ${guild.id}:`,
                error
            );
        }
    },
};
