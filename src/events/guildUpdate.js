
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

        // Ignore updates where the server's relevant settings haven't changed.
        const relevantChanges = [
            oldGuild.name !== newGuild.name,
            oldGuild.icon !== newGuild.icon,
            oldGuild.banner !== newGuild.banner,
            oldGuild.vanityURLCode !== newGuild.vanityURLCode,
            oldGuild.verificationLevel !== newGuild.verificationLevel,
            oldGuild.explicitContentFilter !== newGuild.explicitContentFilter,
            oldGuild.defaultMessageNotifications !==
                newGuild.defaultMessageNotifications,
            oldGuild.afkChannelId !== newGuild.afkChannelId,
            oldGuild.systemChannelId !== newGuild.systemChannelId,
            oldGuild.rulesChannelId !== newGuild.rulesChannelId,
            oldGuild.publicUpdatesChannelId !==
                newGuild.publicUpdatesChannelId,
        ].some(Boolean);

        if (!relevantChanges) {
            return;
        }

        try {
            const executor = await getAuditLogExecutor(
                newGuild,
                'guildUpdate',
                newGuild.id,
            );

            if (!executor?.userId) {
                return;
            }

            await checkAntiNuke(
                newGuild,
                executor.userId,
                'guildUpdate',
            );
        } catch (error) {
            logger.warn(
                `Anti-Nuke server update check failed in guild ${newGuild.id}:`,
                error,
            );
        }
    },
};
