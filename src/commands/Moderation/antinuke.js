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
  async execute(message, args) {
    const guild = message.guild;
    if (!guild) {
      return message.reply(
        'This command can only be used in a server.'
      );
    }
    if (
      !message.member?.permissions.has(
        PermissionFlagsBits.ManageGuild
      )
    ) {
      return message.reply(
        'You need **Manage Server** permission to use Anti-Nuke.'
      );
    }
    const subcommand = args[0]?.toLowerCase();
    if (!subcommand) {
      return message.reply(
        [
          '**Anti-Nuke**',
          '',
          '` ,antinuke enable` — Enable Anti-Nuke',
          '` ,antinuke disable` — Disable Anti-Nuke',
          '` ,antinuke status` — View Anti-Nuke status',
          '` ,antinuke log #channel` — Set the Anti-Nuke log channel',
        ].join('\n').replace(/` ,/g, '`,')
      );
    }
    try {
      if (subcommand === 'enable') {
        const botMember = guild.members.me;
        if (
          !botMember?.permissions.has(
            PermissionFlagsBits.ViewAuditLog
          )
        ) {
          return message.reply(
            'I need **View Audit Log** permission before Anti-Nuke can be enabled.'
          );
        }
        const config = await getGuildConfig(
          guild.client,
          guild.id
        );
        const current = config?.antinuke ?? {};
        await patchGuildConfig(
          guild.client,
          guild.id,
          {
            antinuke: {
              ...current,
              enabled: true,
            },
          },
          {
            source: 'antinuke.enable',
            userId: message.author.id,
          }
        );
        return message.reply(
          '<:approve:1562121487165558947> Anti-Nuke protection has been **enabled**.'
        );
      }
      if (subcommand === 'disable') {
        const config = await getGuildConfig(
          guild.client,
          guild.id
        );
        const current = config?.antinuke ?? {};
        await patchGuildConfig(
          guild.client,
          guild.id,
          {
            antinuke: {
              ...current,
              enabled: false,
            },
          },
          {
            source: 'antinuke.disable',
            userId: message.author.id,
          }
        );
        return message.reply(
          '<:warning:1562130172004540439> Anti-Nuke protection has been **disabled**.'
        );
      }
      if (subcommand === 'log') {
        const channel =
          message.mentions.channels.first() ||
          guild.channels.cache.get(args[1]);
        if (!channel) {
          return message.reply(
            '<:deny:1562121610813513871> Please mention a text channel.\nExample: `,antinuke log #anti-nuke-logs`'
          );
        }
        if (channel.type !== ChannelType.GuildText) {
          return message.reply(
            '<:deny:1562121610813513871> Anti-Nuke logs must use a text channel.'
          );
        }
        const config = await getGuildConfig(
          guild.client,
          guild.id
        );
        const current = config?.antinuke ?? {};
        await patchGuildConfig(
          guild.client,
          guild.id,
          {
            antinuke: {
              ...current,
              logChannelId: channel.id,
            },
          },
          {
            source: 'antinuke.log',
            userId: message.author.id,
          }
        );
        return message.reply(
          `<:approve:1562121487165558947> Anti-Nuke logs will now be sent to ${channel}.`
        );
      }
      if (subcommand === 'status') {
        const config = await getGuildConfig(
          guild.client,
          guild.id
        );
        const antinuke = config?.antinuke ?? {};
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
            return `${enabled ? '<:approve:1562121487165558947>' : '<:deny:1562121610813513871>'} ${name}`;
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
        return message.reply({
          embeds: [embed],
        });
      }
      return message.reply(
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
        `Anti-Nuke command error in guild ${guild.id}:`,
        error
      );
      return message.reply(
        '<:deny:1562121610813513871> Anti-Nuke could not update the server configuration.'
      );
    }
  },
};
