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
    .setName('botclear')
    .setDescription('Delete messages sent by bots')
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('Number of bot messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  category: 'moderation',

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
      const fetched = await channel.messages.fetch({ limit: 100 });

      const botMessages = fetched
        .filter((message) => message.author?.bot)
        .first(amount);

      if (botMessages.length === 0) {
        await InteractionHelper.safeDefer(interaction, {
          flags: MessageFlags.Ephemeral,
        });

        await InteractionHelper.safeEditReply(interaction, {
          embeds: [
            successEmbed(
              'Bot Clear',
              'There were no recent bot messages to delete.'
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      const deleted = await channel.bulkDelete(botMessages, true);
      const deletedCount = deleted.size;

      await logEvent({
        client,
        guild: interaction.guild,
        event: {
          action: 'Bot Messages Cleared',
          target: `${channel} (${deletedCount} messages)`,
          executor: `${interaction.user.tag} (${interaction.user.id})`,
          reason: `Deleted ${deletedCount} bot messages`,
          metadata: {
            channelId: channel.id,
            messageCount: deletedCount,
            requestedAmount: amount,
            moderatorId: interaction.user.id,
          },
        },
      });

      await InteractionHelper.safeDefer(interaction, {
        flags: MessageFlags.Ephemeral,
      });

      await InteractionHelper.safeEditReply(interaction, {
        embeds: [
          successEmbed(
            'Bot Messages Cleared',
            `Deleted ${deletedCount} bot message${deletedCount === 1 ? '' : 's'}.`
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });

      setTimeout(() => {
        interaction.deleteReply().catch(() => {});
      }, 3000);

    } catch (error) {
      logger.error('Bot clear command error:', error);

      await replyUserError(interaction, {
        type: ErrorTypes.UNKNOWN,
        message:
          'I could not delete the bot messages. Make sure I have Manage Messages permission.',
      });
    }
  },
};
