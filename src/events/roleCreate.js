import { Events } from 'discord.js';

import { logEvent, EVENT_TYPES } from '../services/loggingService.js';
import { logger } from '../utils/logger.js';
import { buildRoleAuditLines } from '../utils/logging/logEmbeds.js';

import { getAuditLogExecutor } from '../services/antinuke/auditLog.js';
import { checkAntiNuke } from '../services/antinuke/antinukeService.js';

export default {
    name: Events.GuildRoleCreate,

    once: false,

    async execute(role) {
        try {
            if (!role.guild) return;

            // ============================
            // ANTI-NUKE
            // ============================

            try {
                const executor = await getAuditLogExecutor(
                    role.guild,
                    'roleCreate',
                    role.id
                );

                if (executor?.userId) {
                    await checkAntiNuke(
                        role.guild,
                        executor.userId,
                        'roleCreate'
                    );
                }
            } catch (error) {
                logger.warn(
                    `Anti-Nuke role creation check failed in guild ${role.guild.id}:`,
                    error
                );
            }

            // ============================
            // EXISTING ROLE CREATE LOGGING
            // ============================

            const lines = buildRoleAuditLines(role);

            await logEvent({
                client: role.client,

                guildId: role.guild.id,

                eventType: EVENT_TYPES.ROLE_CREATE,

                data: {
                    title: 'Role Created',
                    headline: `${role.toString()} was created`,
                    lines,
                },
            });

        } catch (error) {
            logger.error(
                'Error in roleCreate event:',
                error
            );
        }
    },
};
