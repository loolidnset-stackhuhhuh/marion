import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';

import { successEmbed } from '../../utils/embeds.js';
import { logEvent } from '../../utils/moderation.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { replyUserError, ErrorTypes } from '../../utils/errorHandler.js';

export default {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete a specific amount of messages')
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('Number of messages (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  category: 'moderation',

  abuseProtection: {
    maxAttempts: 5,
    windowMs: 60_000,
  },

  async execute(interaction, config, client) {
    const amount = interaction.options.getInteger('amount');
    const channel = interaction.channel;

    if (!channel?.messages || !channel?.bulkDelete) {
      return await replyUserError(interaction, {
        type: ErrorTypes.VALIDATION,
        message: 'This command cannot be used in this channel.',
      });
    }

    if (amount < 1 || amount > 100) {
      return await replyUserError(interaction, {
        type: ErrorTypes.VALIDATION,
        message: 'Please specify a number between 1 and 100.',
      });
    }

    try {
      const fetched = await channel.messages.fetch({
        limit: amount,
      });

      const deleted = await channel.bulkDelete(fetched, true);
      const deletedCount = deleted.size;

      await logEvent({
        client,
        guild: interaction.guild,
        event: {
          action: 'Messages Purged',
          target: `${channel} (${deletedCount} messages)`,
          executor: `${interaction.user.tag} (${interaction.user.id})`,
          reason: `Deleted ${deletedCount} messages`,
          metadata: {
            channelId: channel.id,
            messageCount: deletedCount,
            requestedAmount: amount,
            moderatorId: interaction.user.id,
          },
        },
      });

      await InteractionHelper.safeReply(interaction, {
        embeds: [
          successEmbed(
            'Messages Purged',
            `Deleted **${deletedCount}** message${deletedCount === 1 ? '' : 's'} in ${channel}.`
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });

      setTimeout(() => {
        interaction.deleteReply().catch(() => {});
      }, 3000);
    } catch (error) {
      logger.error('Purge command error:', error);

      await replyUserError(interaction, {
        type: ErrorTypes.UNKNOWN,
        message:
          'I could not delete those messages. Make sure I have **Manage Messages** permission. Messages older than 14 days cannot be bulk deleted.',
      });
    }
  },
};
