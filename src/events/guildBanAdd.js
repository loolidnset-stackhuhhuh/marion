
import { Events } from 'discord.js';

import { logger } from '../utils/logger.js';

import { getAuditLogExecutor } from '../services/antinuke/auditLog.js';
import { checkAntiNuke } from '../services/antinuke/antinukeService.js';

export default {
    name: Events.GuildBanAdd,

    once: false,

    async execute(ban) {
        if (!ban?.guild || !ban?.user) {
            return;
        }

        const guild = ban.guild;

        try {
            const executor = await getAuditLogExecutor(
                guild,
                'ban',
                ban.user.id
            );

            if (!executor?.userId) {
                return;
            }

            await checkAntiNuke(
                guild,
                executor.userId,
                'ban'
            );
        } catch (error) {
            logger.warn(
                `Anti-Nuke ban check failed in guild ${guild.id}:`,
                error
            );
        }
    },
};
