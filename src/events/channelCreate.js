
import { Events } from 'discord.js';

import { logger } from '../utils/logger.js';

import { getAuditLogExecutor } from '../services/antinuke/auditLog.js';
import { checkAntiNuke } from '../services/antinuke/antinukeService.js';

export default {
    name: Events.ChannelCreate,

    once: false,

    async execute(channel) {
        if (!channel?.guild) {
            return;
        }

        const guild = channel.guild;

        try {
            const executor = await getAuditLogExecutor(
                guild,
                'channelCreate',
                channel.id
            );

            if (!executor?.userId) {
                return;
            }

            await checkAntiNuke(
                guild,
                executor.userId,
                'channelCreate'
            );
        } catch (error) {
            logger.warn(
                `Anti-Nuke channel creation check failed in guild ${guild.id}:`,
                error
            );
        }
    },
};
