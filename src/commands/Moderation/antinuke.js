import {
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';

import {
  getGuildConfig,
  patchGuildConfig,
} from '../../services/config/guildConfig.js';

const APPROVE_EMOJI = '<:approve:1562121487165558947>';
const WARNING_EMOJI = '<:warning:1562130172004540439>';
const DENY_EMOJI = '<:deny:1562121610813513871>';

const PROTECTION_NAMES = [
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

function successEmbed(description) {
  return new EmbedBuilder()
    .setColor(0x57F287)
    .setDescription(`${APPROVE_EMOJI} ${description}`);
}

function warningEmbed(description) {
  return new EmbedBuilder()
    .setColor(0xFEE75C)
    .setDescription(`${WARNING_EMOJI} ${description}`);
}

function denyEmbed(description) {
  return new EmbedBuilder()
    .setColor(0xED4245)
    .setDescription(`${DENY_EMOJI} ${description}`);
}

function helpEmbed() {
  return new EmbedBuilder()
    .setColor(0xFEE75C)
    .setTitle('LOVEL♡RN Anti-Nuke')
    .setDescription(
      [
        '**Anti-Nuke Commands**',
        '',
        '`,antinuke enable` — Enable Anti-Nuke',
        '`,antinuke disable` — Disable Anti-Nuke',
        '`,antinuke status` — View Anti-Nuke status',
        '`,antinuke log #channel` — Set the log channel',
      ].join('\n')
    );
}

export default {
  name: 'antinuke',
  aliases: ['anti-nuke'],
  prefixOnly: true,
  category: 'Moderation',
  description: 'Configure LOVEL♡RN Anti-Nuke protection.',
  usage: ',antinuke <enable|disable|status|log #channel>',

  async execute(message, args, client) {
    if (!message.guild) {
      return message.channel.send({
        embeds: [
          denyEmbed('This command can only be used inside a server.'),
        ],
      });
    }

    if (
      !message.member?.permissions?.has(
        PermissionFlagsBits.ManageGuild
      )
    ) {
      return message.channel.send({
        embeds: [
          denyEmbed(
            'You need **Manage Server** permission to use Anti-Nuke.'
          ),
        ],
      });
    }

    const guild = message.guild;
    const subcommand = args[0]?.toLowerCase();

    if (!subcommand) {
      return message.channel.send({
        embeds: [helpEmbed()],
      });
    }

    try {
      if (subcommand === 'enable') {
        const botMember =
          guild.members.me ??
          await guild.members.fetch(client.user.id).catch(() => null);

        if (
          !botMember?.permissions?.has(
            PermissionFlagsBits.ViewAuditLog
          )
        ) {
          return message.channel.send({
            embeds: [
              denyEmbed(
                'I need **View Audit Log** permission before Anti-Nuke can be enabled.'
              ),
            ],
          });
        }

        const config = await getGuildConfig(client, guild.id);
        const current = config?.antinuke ?? {};

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
            userId: message.author.id,
          }
        );

        return message.channel.send({
          embeds: [
            successEmbed(
              'Anti-Nuke protection has been **enabled**.'
            ),
          ],
        });
      }

      if (subcommand === 'disable') {
        const config = await getGuildConfig(client, guild.id);
        const current = config?.antinuke ?? {};

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
            userId: message.author.id,
          }
        );

        return message.channel.send({
          embeds: [
            successEmbed(
              'Anti-Nuke protection has been **disabled**.'
            ),
          ],
        });
      }

      if (subcommand === 'log') {
        let channel = message.mentions.channels.first();

        if (!channel && args[1]) {
          channel =
            guild.channels.cache.get(args[1]) ??
            guild.channels.cache.find(
              (cachedChannel) =>
                cachedChannel.id === args[1].replace(/[<#>]/g, '')
            );
        }

        if (!channel) {
          return message.channel.send({
            embeds: [
              warningEmbed(
                'Please mention a text channel.\n\nExample: `,antinuke log #message-log`'
              ),
            ],
          });
        }

        if (channel.type !== ChannelType.GuildText) {
          return message.channel.send({
            embeds: [
              warningEmbed(
                'The Anti-Nuke log channel must be a text channel.'
              ),
            ],
          });
        }

        const config = await getGuildConfig(client, guild.id);
        const current = config?.antinuke ?? {};

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
            userId: message.author.id,
          }
        );

        return message.channel.send({
          embeds: [
            successEmbed(
              `Anti-Nuke logs will now be sent to ${channel}.`
            ),
          ],
        });
      }

      if (subcommand === 'status') {
        const config = await getGuildConfig(client, guild.id);
        const antinuke = config?.antinuke ?? {};

        const protections = PROTECTION_NAMES
          .map(([key, name]) => {
            const enabled = Boolean(
              antinuke.protections?.[key]
            );

            return `${enabled ? 'ON' : 'OFF'} — ${name}`;
          })
          .join('\n');

        const statusEmoji = antinuke.enabled
          ? APPROVE_EMOJI
          : DENY_EMOJI;

        const embed = new EmbedBuilder()
          .setColor(
            antinuke.enabled
              ? 0x57F287
              : 0xED4245
          )
          .setTitle('LOVEL♡RN Anti-Nuke')
          .setDescription(
            [
              `${statusEmoji} **Status:** ${
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
            ].join('\n')
          )
          .setTimestamp();

        return message.channel.send({
          embeds: [embed],
        });
      }

      return message.channel.send({
        embeds: [helpEmbed()],
      });
    } catch (error) {
      console.error(
        `Anti-Nuke command error in guild ${guild.id}:`,
        error
      );

      return message.channel.send({
        embeds: [
          denyEmbed(
            'Anti-Nuke could not update the server configuration. Check the bot logs for the error.'
          ),
        ],
      });
    }
  },
};
