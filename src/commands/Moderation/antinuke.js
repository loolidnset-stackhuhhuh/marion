import { PermissionFlagsBits, ChannelType } from 'discord.js';
import {
  getGuildConfig,
  patchGuildConfig,
} from '../../services/config/guildConfig.js';
export default {
  name: 'antinuke',
  aliases: ['anti-nuke'],
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
      !message.member?.permissions?.has(
        PermissionFlagsBits.ManageGuild
      )
    ) {
      return message.reply(
        'You need **Manage Server** permission to use Anti-Nuke.'
      );
    }
    const subcommand = args?.[0]?.toLowerCase();
    if (!subcommand) {
      return message.reply(
        [
          '**Anti-Nuke**',
          '',
          '` ,antinuke enable` — Enable Anti-Nuke',
          '` ,antinuke disable` — Disable Anti-Nuke',
          '` ,antinuke status` — View Anti-Nuke status',
          '` ,antinuke log #channel` — Set the Anti-Nuke log channel',
        ]
          .join('\n')
          .replace(/` ,/g, '`,')
      );
    }
    try {
      // =========================
      // ENABLE
      // =========================
      if (subcommand === 'enable') {
        const botMember = guild.members.me;
        if (
          !botMember?.permissions?.has(
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
          'Anti-Nuke protection has been **enabled**.'
        );
      }
      // =========================
      // DISABLE
      // =========================
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
          'Anti-Nuke protection has been **disabled**.'
        );
      }
      // =========================
      // LOG
      // =========================
      if (subcommand === 'log') {
        const channel =
          message.mentions.channels.first() ||
          guild.channels.cache.get(args?.[1]);
        if (!channel) {
          return message.reply(
            'Please provide a valid text channel.\nExample: `,antinuke log #antinuke-logs`'
          );
        }
        if (channel.type !== ChannelType.GuildText) {
          return message.reply(
            'The Anti-Nuke log channel must be a **text channel**.'
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
          `Anti-Nuke logs will now be sent to ${channel}.`
        );
      }
      // =========================
      // STATUS
      // =========================
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
            return `${enabled ? 'ON' : 'OFF'} — ${name}`;
          })
          .join('\n');
        return message.reply({
          embeds: [
            {
              title: 'Lovelorn Anti-Nuke',
              description: [
                `**Status:** ${
                  antinuke.enabled
                    ? 'Enabled'
                    : 'Disabled'
                }`,
                `**Punishment:** ${
                  antinuke.punishment ?? 'ban'
                }`,
                `**Log Channel:** ${
                  antinuke.logChannelId
                    ? `<#${antinuke.logChannelId}>`
                    : 'Not configured'
                }`,
                '',
                '**Protections**',
                protections,
              ].join('\n'),
              timestamp: new Date().toISOString(),
            },
          ],
        });
      }
      // =========================
      // UNKNOWN SUBCOMMAND
      // =========================
      return message.reply(
        [
          `Unknown Anti-Nuke subcommand: \`${subcommand}\``,
          '',
          '**Available subcommands:**',
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
        'Anti-Nuke could not update the server configuration. Check the bot logs for the error.'
      );
    }
  },
};
