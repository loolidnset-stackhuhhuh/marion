import { Events } from 'discord.js';

import { logger } from '../utils/logger.js';

import { getAuditLogExecutor } from '../services/antinuke/auditLog.js';
import { checkAntiNuke } from '../services/antinuke/antinukeService.js';

export default {
    name: Events.WebhooksUpdate,

    once: false,

    async execute(channel) {
        try {
            if (!channel?.guild) {
                return;
            }

            const guild = channel.guild;

            /*
             * Discord's WebhooksUpdate event does not tell us
             * whether a webhook was created, updated, or deleted.
             *
             * We therefore check the audit log for each supported
             * webhook action and let Anti-Nuke handle the threshold.
             */

            const actions = [
                'webhook',
            ];

            for (const action of actions) {
                try {
                    const executor = await getAuditLogExecutor(
                        guild,
                        action
                    );

                    if (!executor?.userId) {
                        continue;
                    }

                    await checkAntiNuke(
                        guild,
                        executor.userId,
                        action
                    );

                } catch (error) {
                    logger.warn(
                        `Anti-Nuke webhook check failed in guild ${guild.id}:`,
                        error
                    );
                }
            }

        } catch (error) {
            logger.error(
                `Error in webhooksUpdate event for guild ${channel?.guild?.id ?? 'unknown'}:`,
                error
            );
        }
    },
};
