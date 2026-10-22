
import { Events } from 'discord.js';

import { logger } from '../utils/logger.js';

import { getAuditLogExecutor } from '../services/antinuke/auditLog.js';
import { checkAntiNuke } from '../services/antinuke/antinukeService.js';

export default {
    name: Events.GuildUpdate,

    once: false,

    async execute(oldGuild, newGuild) {
        if (!newGuild) {
            return;
        }

        try {
            const executor = await getAuditLogExecutor(
                newGuild,
                'guildUpdate'
            );

            if (!executor?.userId) {
                return;
            }

            await checkAntiNuke(
                newGuild,
                executor.userId,
                'guildUpdate'
            );
        } catch (error) {
            logger.warn(
                `Anti-Nuke server update check failed in guild ${newGuild.id}:`,
                error
            );
        }
    },
};
