
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Set up moderation roles, channels, and categories')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  category: 'Moderation',

  async execute(interaction) {
    const guild = interaction.guild;

    if (!guild) {
      return interaction.reply({
        content: 'This command can only be used in a server.',
      });
    }

    if (
      !interaction.memberPermissions?.has(
        PermissionFlagsBits.ManageGuild
      )
    ) {
      return interaction.reply({
        content: 'You need Manage Server permission to use this command.',
      });
    }

    const botMember = guild.members.me;

    if (
      !botMember?.permissions.has([
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.ManageChannels,
      ])
    ) {
      return interaction.reply({
        content:
          'I need Manage Roles and Manage Channels permissions to run setup.',
      });
    }

    await interaction.deferReply();

    try {
      const createdRoles = [];
      const createdChannels = [];
      const createdCategories = [];

      // Create or reuse moderation roles.
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

      // Create or reuse the Moderation category.
      let moderationCategory = guild.channels.cache.find(
        (c) =>
          c.type === ChannelType.GuildCategory &&
          c.name.toLowerCase() === 'moderation'
      );

      if (!moderationCategory) {
        moderationCategory = await guild.channels.create({
          name: 'Moderation',
          type: ChannelType.GuildCategory,
          reason: 'Marion server setup',
        });

        createdCategories.push('Moderation');
      }

      // Create or reuse the Moderation Logs category.
      let logsCategory = guild.channels.cache.find(
        (c) =>
          c.type === ChannelType.GuildCategory &&
          c.name.toLowerCase() === 'moderation logs'
      );

      if (!logsCategory) {
        logsCategory = await guild.channels.create({
          name: 'Moderation Logs',
          type: ChannelType.GuildCategory,
          reason: 'Marion server setup',
        });

        createdCategories.push('Moderation Logs');
      }

      // Find staff roles that can view moderation channels.
      const everyone = guild.roles.everyone;

      const staffRoles = guild.roles.cache.filter(
        (role) =>
          role.id !== everyone.id &&
          (
            role.permissions.has(
              PermissionFlagsBits.ManageMessages
            ) ||
            role.permissions.has(
              PermissionFlagsBits.Administrator
            )
          )
      );

      const logPermissions = [
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

      // Create or reuse the jail channel.
      let jailChannel = guild.channels.cache.find(
        (c) =>
          c.type === ChannelType.GuildText &&
          c.name.toLowerCase() === 'jail'
      );

      const jailPermissions = [
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

      if (!jailChannel) {
        jailChannel = await guild.channels.create({
          name: 'jail',
          type: ChannelType.GuildText,
          parent: moderationCategory.id,
          permissionOverwrites: jailPermissions,
          reason: 'Marion server setup',
        });

        createdChannels.push('#jail');
      } else if (jailChannel.parentId !== moderationCategory.id) {
        await jailChannel.setParent(moderationCategory.id, {
          lockPermissions: false,
          reason: 'Organize Marion jail channel',
        });
      }

      // Create or reuse the moderation log channels.
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
            parent: logsCategory.id,
            permissionOverwrites: logPermissions,
            reason: 'Marion server setup',
          });

          createdChannels.push(`#${name}`);
        } else if (channel.parentId !== logsCategory.id) {
          await channel.setParent(logsCategory.id, {
            lockPermissions: false,
            reason: 'Organize Marion moderation logs',
          });
        }
      }

      // Send setup results.
      const roleList = ['Jail', 'RMute', 'IMute']
        .map((name) => {
          const role = guild.roles.cache.find(
            (r) => r.name.toLowerCase() === name.toLowerCase()
          );

          return `${role}`;
        })
        .join(', ');

      const jail = guild.channels.cache.find(
        (c) =>
          c.type === ChannelType.GuildText &&
          c.name.toLowerCase() === 'jail'
      );

      const modLog = guild.channels.cache.find(
        (c) =>
          c.type === ChannelType.GuildText &&
          c.name.toLowerCase() === 'mod-log'
      );

      const messageLog = guild.channels.cache.find(
        (c) =>
          c.type === ChannelType.GuildText &&
          c.name.toLowerCase() === 'message-log'
      );

      await interaction.editReply({
        content: [
          '**Marion setup complete!**',
          '',
          `**Roles:** ${roleList}`,
          `**Moderation category:** ${moderationCategory}`,
          `**Jail channel:** ${jail}`,
          `**Logs category:** ${logsCategory}`,
          `**Mod log:** ${modLog}`,
          `**Message log:** ${messageLog}`,
          '',
          `**New roles:** ${createdRoles.join(', ') || 'None needed'}`,
          `**New categories:** ${createdCategories.join(', ') || 'None needed'}`,
          `**New channels:** ${createdChannels.join(', ') || 'None needed'}`,
        ].join('\n'),
      });
    } catch (error) {
      console.error('Marion setup command error:', error);

      await interaction.editReply({
        content:
          'Setup could not finish. Check Marion’s permissions and role hierarchy, then check the Railway logs for the error.',
      }).catch(() => {});
    }
  },
};
