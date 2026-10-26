import {
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} from 'discord.js';

import {
  getGuildConfig,
  patchGuildConfig,
} from '../../services/config/guildConfig.js';

export default {
  name: 'antinuke',
  aliases: ['anti-nuke'],
  prefixOnly: true,

  category: 'Moderation',

  description: 'Configure Lovelorn Anti-Nuke protection.',

  usage: ',antinuke <enable|disable|status|log> [channel]',

  async execute(interaction, guildConfig, client) {
    const guild = interaction.guild;

    if (!guild) {
      return interaction.reply(
        'This command can only be used in a server.'
      );
    }

    const member = interaction.member;

    if (
      !member?.permissions?.has(
        PermissionFlagsBits.ManageGuild
      )
    ) {
      return interaction.reply(
        '<:deny:1562121610813513871> You need **Manage Server** permission to use Anti-Nuke.'
      );
    }

    const args = interaction._hoistedOptions?.map(
      option => option.value
    ) ?? [];

    const subcommand = String(
      args[0] ?? ''
    ).toLowerCase();

    if (!subcommand) {
      return interaction.reply(
        [
          '**LOVEL♡RN Anti-Nuke**',
          '',
          '`,antinuke enable` — Enable Anti-Nuke',
          '`,antinuke disable` — Disable Anti-Nuke',
          '`,antinuke status` — View Anti-Nuke status',
          '`,antinuke log #channel` — Set the log channel',
        ].join('\n')
      );
    }

    try {
      const config =
        guildConfig ??
        await getGuildConfig(client, guild.id);

      const current = config?.antinuke ?? {};

      if (subcommand === 'enable') {
        const botMember = guild.members.me;

        if (
          !botMember?.permissions?.has(
            PermissionFlagsBits.ViewAuditLog
          )
        ) {
          return interaction.reply(
            '<:deny:1562121610813513871> I need **View Audit Log** permission before Anti-Nuke can be enabled.'
          );
        }

        await patchGuildConfig(
          client,
          guild.id,
          {
            antinuke: {
              ...current,
              enabled: true,
            },
          },
          {
            source: 'antinuke.enable',
            userId: interaction.user.id,
          }
        );

        return interaction.reply(
          '<:approve:1562121487165558947> Anti-Nuke protection has been **enabled**.'
        );
      }

      if (subcommand === 'disable') {
        await patchGuildConfig(
          client,
          guild.id,
          {
            antinuke: {
              ...current,
              enabled: false,
            },
          },
          {
            source: 'antinuke.disable',
            userId: interaction.user.id,
          }
        );

        return interaction.reply(
          '<:warning:1562130172004540439> Anti-Nuke protection has been **disabled**.'
        );
      }

      if (subcommand === 'log') {
        const channelArg = args[1];

        let channel = null;

        if (channelArg) {
          const mentionMatch =
            String(channelArg).match(/^<#(\d+)>$/);

          const channelId =
            mentionMatch?.[1] ??
            String(channelArg).replace(/\D/g, '');

          if (channelId) {
            channel =
              guild.channels.cache.get(channelId) ??
              await guild.channels.fetch(channelId).catch(() => null);
          }
        }

        if (!channel) {
          return interaction.reply(
            '<:deny:1562121610813513871> Please mention a text channel.\nExample: `,antinuke log #anti-nuke-logs`'
          );
        }

        if (channel.type !== ChannelType.GuildText) {
          return interaction.reply(
            '<:deny:1562121610813513871> Anti-Nuke logs must use a text channel.'
          );
        }

        await patchGuildConfig(
          client,
          guild.id,
          {
            antinuke: {
              ...current,
              logChannelId: channel.id,
            },
          },
          {
            source: 'antinuke.log',
            userId: interaction.user.id,
          }
        );

        return interaction.reply(
          `<:approve:1562121487165558947> Anti-Nuke logs will now be sent to ${channel}.`
        );
      }

      if (subcommand === 'status') {
        const antinuke = current;

        const protectionNames = [
          ['ban', 'Mass Ban'],
          ['kick', 'Mass Kick'],
          ['channelDelete', 'Channel Delete'],
          ['channelCreate', 'Channel Create'],
          ['roleDelete', 'Role Delete'],
          ['roleCreate', 'Role Create'],
          ['webhook', 'Webhook'],
          ['botAdd', 'Bot Add'],
          ['guildUpdate', 'Server Update'],
        ];

        const protections = protectionNames
          .map(([key, name]) => {
            const enabled =
              antinuke.protections?.[key] === true;

            return `${
              enabled
                ? '<:approve:1562121487165558947>'
                : '<:deny:1562121610813513871>'
            } ${name}`;
          })
          .join('\n');

        const embed = new EmbedBuilder()
          .setTitle('LOVEL♡RN Anti-Nuke')
          .setDescription(
            [
              `**Status:** ${
                antinuke.enabled
                  ? '<:approve:1562121487165558947> Enabled'
                  : '<:deny:1562121610813513871> Disabled'
              }`,
              `**Punishment:** ${antinuke.punishment ?? 'ban'}`,
              `**Log Channel:** ${
                antinuke.logChannelId
                  ? `<#${antinuke.logChannelId}>`
                  : 'Not configured'
              }`,
              '',
              '**Protections**',
              protections,
            ].join('\n')
          )
          .setTimestamp();

        return interaction.reply({
          embeds: [embed],
        });
      }

      return interaction.reply(
        [
          '<:deny:1562121610813513871> Unknown Anti-Nuke option.',
          '',
          'Use:',
          '`,antinuke enable`',
          '`,antinuke disable`',
          '`,antinuke status`',
          '`,antinuke log #channel`',
        ].join('\n')
      );
    } catch (error) {
      console.error(
        `[Anti-Nuke] Error in guild ${guild.id}:`,
        error
      );

      return interaction.reply(
        '<:deny:1562121610813513871> Anti-Nuke encountered an error while updating the server.'
      );
    }
  },
};
