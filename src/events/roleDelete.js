import { Events } from 'discord.js';

import { logEvent, EVENT_TYPES } from '../services/loggingService.js';
import { logger } from '../utils/logger.js';
import { buildRoleAuditLines } from '../utils/logging/logEmbeds.js';

import { getAuditLogExecutor } from '../services/antinuke/auditLog.js';
import { checkAntiNuke } from '../services/antinuke/antinukeService.js';

export default {
    name: Events.GuildRoleDelete,

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
                    'roleDelete',
                    role.id
                );

                if (executor?.userId) {
                    await checkAntiNuke(
                        role.guild,
                        executor.userId,
                        'roleDelete'
                    );
                }
            } catch (error) {
                logger.warn(
                    `Anti-Nuke role deletion check failed in guild ${role.guild.id}:`,
                    error
                );
            }

            // ============================
            // EXISTING ROLE DELETE LOGGING
            // ============================

            const lines = buildRoleAuditLines(role, {
                includeMemberCount: true
            });

            await logEvent({
                client: role.client,

                guildId: role.guild.id,

                eventType: EVENT_TYPES.ROLE_DELETE,

                data: {
                    title: 'Role Deleted',
                    headline: `**${role.name}** was deleted`,
                    lines,
                },
            });

        } catch (error) {
            logger.error(
                'Error in roleDelete event:',
                error
            );
        }
    }
};
