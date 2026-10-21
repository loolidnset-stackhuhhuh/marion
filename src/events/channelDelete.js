import {
    getJoinToCreateConfig,
    removeJoinToCreateTrigger,
    unregisterTemporaryChannel,
    getTicketData,
    saveTicketData
} from '../utils/database.js';
import { getServerCounters, saveServerCounters } from '../services/serverstatsService.js';
import { logger } from '../utils/logger.js';

import { getAuditLogExecutor } from '../services/antinuke/auditLog.js';
import { checkAntiNuke } from '../services/antinuke/antinukeService.js';

export default {
    name: 'channelDelete',

    async execute(channel, client) {
        if (!channel.guild) {
            return;
        }

        const guild = channel.guild;
        const guildId = guild.id;

        /*
         * ============================
         * ANTI-NUKE
         * ============================
         *
         * Find the person who deleted the channel
         * through Discord's audit log and pass the
         * action to the Anti-Nuke engine.
         */
        try {
            const executor = await getAuditLogExecutor(
                guild,
                'channelDelete',
                channel.id
            );

            if (executor?.userId) {
                await checkAntiNuke(
                    guild,
                    executor.userId,
                    'channelDelete'
                );
            }
        } catch (error) {
            logger.warn(
                `Anti-Nuke channel deletion check failed in guild ${guildId}:`,
                error
            );
        }

        /*
         * ============================
         * TICKET CLEANUP
         * ============================
         */

        if (channel.type === 0) {
            try {
                const ticketData = await getTicketData(
                    guildId,
                    channel.id
                );

                if (ticketData && ticketData.status === 'open') {
                    ticketData.status = 'deleted';
                    ticketData.closedAt = new Date().toISOString();

                    await saveTicketData(
                        guildId,
                        channel.id,
                        ticketData
                    );

                    logger.info(
                        `Ticket channel ${channel.id} was manually deleted in guild ${guildId}, marked as deleted`
                    );
                }
            } catch (err) {
                logger.warn(
                    `Could not clean up ticket record for deleted channel ${channel.id}:`,
                    err
                );
            }
        }

        /*
         * ============================
         * SERVER COUNTERS / JOIN TO CREATE
         * ============================
         */

        if (channel.type !== 2 && channel.type !== 4) {
            return;
        }

        try {
            const counters = await getServerCounters(
                client,
                guildId
            );

            const orphanedCounter = counters.find(
                c => c.channelId === channel.id
            );

            if (orphanedCounter) {
                logger.info(
                    `Counter channel ${channel.name} (${channel.id}) was deleted, removing counter ${orphanedCounter.id} from database`
                );

                const updatedCounters = counters.filter(
                    c => c.channelId !== channel.id
                );

                const success = await saveServerCounters(
                    client,
                    guildId,
                    updatedCounters
                );

                if (success) {
                    logger.info(
                        `Successfully removed orphaned counter ${orphanedCounter.id} (type: ${orphanedCounter.type}) from guild ${guildId}`
                    );
                } else {
                    logger.warn(
                        `Failed to remove orphaned counter ${orphanedCounter.id} from guild ${guildId}`
                    );
                }
            }

            const config = await getJoinToCreateConfig(
                client,
                guildId
            );

            if (!config.enabled) {
                return;
            }

            if (config.triggerChannels.includes(channel.id)) {
                logger.info(
                    `Join to Create trigger channel ${channel.name} (${channel.id}) was deleted, removing from configuration`
                );

                const success = await removeJoinToCreateTrigger(
                    client,
                    guildId,
                    channel.id
                );

                if (success) {
                    logger.info(
                        `Successfully removed trigger channel ${channel.id} from Join to Create configuration`
                    );
                } else {
                    logger.warn(
                        `Failed to remove trigger channel ${channel.id} from Join to Create configuration`
                    );
                }
            }

            if (config.temporaryChannels[channel.id]) {
                logger.info(
                    `Join to Create temporary channel ${channel.name} (${channel.id}) was deleted, cleaning up database`
                );

                const success = await unregisterTemporaryChannel(
                    client,
                    guildId,
                    channel.id
                );

                if (success) {
                    logger.info(
                        `Successfully cleaned up temporary channel ${channel.id} from database`
                    );
                } else {
                    logger.warn(
                        `Failed to cleanup temporary channel ${channel.id} from database`
                    );
                }
            }

            if (config.categoryId === channel.id) {
                logger.warn(
                    `Category ${channel.name} (${channel.id}) used for Join to Create temporary channels was deleted. Join to Create will be disabled.`
                );

                config.categoryId = null;
                config.enabled = false;

                try {
                    await client.db.set(
                        `guild:${guildId}:jointocreate`,
                        config
                    );

                    logger.info(
                        `Disabled Join to Create for guild ${guildId} due to category deletion`
                    );
                } catch (error) {
                    logger.error(
                        `Failed to disable Join to Create for guild ${guildId}:`,
                        error
                    );
                }
            }
        } catch (error) {
            logger.error(
                `Error in channelDelete event for guild ${guildId}:`,
                error
            );
        }
    }
};
