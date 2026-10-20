
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('hardban')
    .setDescription('Permanently ban a user by their Discord user ID')
    .addStringOption((option) =>
      option
        .setName('userid')
        .setDescription('The Discord user ID to ban')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Why this user is being banned')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

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
        PermissionFlagsBits.BanMembers
      )
    ) {
      return interaction.reply({
        content: 'You need the Ban Members permission to use this command.',
      });
    }

    const botMember = guild.members.me;

    if (!botMember?.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({
        content: 'I need the Ban Members permission to do that.',
      });
    }

    const userId = interaction.options.getString('userid', true).trim();
    const reason =
      interaction.options.getString('reason')?.trim() ||
      `Hardban issued by ${interaction.user.tag}`;

    // Validate the Discord user ID.
    if (!/^\d{17,20}$/.test(userId)) {
      return interaction.reply({
        content: 'That does not look like a valid Discord user ID.',
      });
    }

    await interaction.deferReply();

    try {
      // Check whether this user is already banned.
      const existingBan = await guild.bans.fetch(userId).catch(() => null);

      if (existingBan) {
        return interaction.editReply({
          content: `That user is already banned from **${guild.name}**.`,
        });
      }

      // Ban by ID, including users who have already left the server.
      await guild.members.ban(userId, {
        reason: `${reason} | Moderator: ${interaction.user.tag} (${interaction.user.id})`,
      });

      await interaction.editReply({
        content: [
          '**User hardbanned successfully.**',
          `**User ID:** \`${userId}\``,
          `**Reason:** ${reason}`,
          `**Moderator:** ${interaction.user.tag}`,
        ].join('\n'),
      });
    } catch (error) {
      console.error('Marion hardban error:', error);

      await interaction.editReply({
        content:
          'I could not ban that user. Check my permissions, the user ID, and the Railway logs.',
      }).catch(() => {});
    }
  },
};
