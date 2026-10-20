
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Create the basic moderation roles and log channels')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  category: 'Moderation',

  async execute(interaction) {
    const guild = interaction.guild;

    if (!guild) {
      return interaction.reply({
        content: 'This command can only be used in a server.',
      });
    }

    if (!interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageGuild
    )) {
      return interaction.reply({
        content: 'You need Manage Server permission to use this command.',
      });
    }

    const botMember = guild.members.me;

    if (!botMember?.permissions.has([
      PermissionFlagsBits.ManageRoles,
      PermissionFlagsBits.ManageChannels,
    ])) {
      return interaction.reply({
        content:
          'I need Manage Roles and Manage Channels permissions to run setup.',
      });
    }

    await interaction.deferReply();

    try {
      const createdRoles = [];
      const createdChannels = [];

      // Create missing roles without duplicating existing ones.
      for (const name of ['Jail', 'RMute', 'IMute']) {
        let role = guild.roles.cache.find(
          (r) => r.name.toLowerCase() === name.toLowerCase()
        );

        if (!role) {
          role = await guild.roles.create({
            name,
            reason: 'Marion server setup',
          });

          createdRoles.push(name);
        }
      }

      // Make log channels private to moderators.
      const everyone = guild.roles.everyone;

      const staffRoles = guild.roles.cache.filter(
        (role) =>
          role.id !== everyone.id &&
          (
            role.permissions.has(PermissionFlagsBits.ManageMessages) ||
            role.permissions.has(PermissionFlagsBits.Administrator)
          )
      );

      const permissionOverwrites = [
        {
          id: everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: botMember.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels,
          ],
        },
        ...staffRoles.map((role) => ({
          id: role.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        })),
      ];

      for (const name of ['mod-log', 'message-log']) {
        let channel = guild.channels.cache.find(
          (c) =>
            c.type === ChannelType.GuildText &&
            c.name.toLowerCase() === name
        );

        if (!channel) {
          channel = await guild.channels.create({
            name,
            type: ChannelType.GuildText,
            permissionOverwrites,
            reason: 'Marion server setup',
          });

          createdChannels.push(`#${name}`);
        }
      }

      const roleList = ['Jail', 'RMute', 'IMute']
        .map((name) => {
          const role = guild.roles.cache.find(
            (r) => r.name.toLowerCase() === name.toLowerCase()
          );

          return `${role}`;
        })
        .join(', ');

      const channelList = ['mod-log', 'message-log']
        .map((name) => {
          const channel = guild.channels.cache.find(
            (c) =>
              c.type === ChannelType.GuildText &&
              c.name.toLowerCase() === name
          );

          return `${channel}`;
        })
        .join(', ');

      await interaction.editReply({
        content: [
          '**Server setup complete.**',
          '',
          `**Roles:** ${roleList}`,
          `**Log channels:** ${channelList}`,
          '',
          `**New roles:** ${createdRoles.join(', ') || 'None needed'}`,
          `**New channels:** ${createdChannels.join(', ') || 'None needed'}`,
        ].join('\n'),
      });
    } catch (error) {
      console.error('Marion setup command error:', error);

      const reply = {
        content:
          'Setup could not finish. Check my role hierarchy, permissions, and server audit log.',
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    }
  },
};
