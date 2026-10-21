import {
    SlashCommandBuilder,
    PermissionFlagsBits,
} from 'discord.js';
import {
    TitanBotError,
    ErrorTypes,
} from '../../utils/errorHandler.js';
export default {
    data: new SlashCommandBuilder()
        .setName('unjail')
        .setDescription('Release a member from jail')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('Member to release')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),
    category: 'moderation',
    async execute(interaction, config, client) {
        const guild = interaction.guild;
        const user = interaction.options.getUser('target');
        const member = interaction.options.getMember('target');
        if (!guild || !user || !member) {
            throw new TitanBotError(
                'Invalid target',
                ErrorTypes.USER_INPUT,
                'The target member could not be found in this server.'
            );
        }
        const botMember = guild.members.me;
        if (!botMember?.permissions.has(PermissionFlagsBits.ManageRoles)) {
            throw new TitanBotError(
                'Missing permissions',
                ErrorTypes.PERMISSION,
                'I need Manage Roles permission to release jailed members.'
            );
        }
        const jailRole = guild.roles.cache.find(
            role => role.name.toLowerCase() === 'jail'
        );
        if (!jailRole) {
            throw new TitanBotError(
                'Jail role not found',
                ErrorTypes.VALIDATION,
                'I could not find the Jail role. Run /setup first.'
            );
        }
        if (!member.roles.cache.has(jailRole.id)) {
            return interaction.reply({
                content: 'This member is not jailed.',
                ephemeral: true,
            });
        }
        if (jailRole.position >= botMember.roles.highest.position) {
            throw new TitanBotError(
                'Role hierarchy issue',
                ErrorTypes.PERMISSION,
                'Move the Jail role below Lovelorn’s highest role.'
            );
        }
        await interaction.deferReply({ ephemeral: true });
        try {
            await member.roles.remove(
                jailRole,
                `Released from jail by ${interaction.user.tag}`
            );
            await interaction.editReply({
                content: '👍',
            });
        } catch (error) {
            console.error('Unjail command failed:', error);
            await interaction.editReply({
                content:
                    'I could not release this member. Check my permissions and the Railway logs.',
            }).catch(() => {});
        }
    },
};
