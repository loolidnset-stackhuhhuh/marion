import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
} from 'discord.js';

import {
    TitanBotError,
    ErrorTypes,
} from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('jail')
        .setDescription('Jail a member in the server')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('Member to jail')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the jail')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    category: 'moderation',

    async execute(interaction, config, client) {
        const guild = interaction.guild;
        const user = interaction.options.getUser('target');
        const member = interaction.options.getMember('target');
        const reason =
            interaction.options.getString('reason') ||
            'No reason provided';

        if (!guild || !member || !user) {
            throw new TitanBotError(
                'Invalid target',
                ErrorTypes.USER_INPUT,
                'The target member could not be found.'
            );
        }

        if (user.id === interaction.user.id) {
            throw new TitanBotError(
                'Cannot jail yourself',
                ErrorTypes.VALIDATION,
                'You cannot jail yourself.'
            );
        }

        if (user.id === client.user.id) {
            throw new TitanBotError(
                'Cannot jail the bot',
                ErrorTypes.VALIDATION,
                'You cannot jail the bot.'
            );
        }

        const botMember = guild.members.me;

        if (
            !botMember?.permissions.has(
                PermissionFlagsBits.ManageRoles
            ) ||
            !botMember.permissions.has(
                PermissionFlagsBits.ManageChannels
            )
        ) {
            throw new TitanBotError(
                'Missing permissions',
                ErrorTypes.PERMISSION,
                'I need Manage Roles and Manage Channels permissions.'
            );
        }

        const jailRole = guild.roles.cache.find(
            role => role.name.toLowerCase() === 'jail'
        );

        const jailChannel = guild.channels.cache.find(
            channel =>
                channel.type === ChannelType.GuildText &&
                channel.name.toLowerCase() === 'jail'
        );

        if (!jailRole || !jailChannel) {
            throw new TitanBotError(
                'Jail setup missing',
                ErrorTypes.VALIDATION,
                'Run /setup first to create the Jail role and #jail channel.'
            );
        }

        if (
            jailRole.position >= botMember.roles.highest.position ||
            jailRole.position >= interaction.guild.members.me.roles.highest.position
        ) {
            throw new TitanBotError(
                'Role hierarchy issue',
                ErrorTypes.PERMISSION,
                'Move the Jail role below Lovelorn’s highest role.'
            );
        }

        if (
            member.roles.highest.position >=
            botMember.roles.highest.position
        ) {
            throw new TitanBotError(
                'Role hierarchy issue',
                ErrorTypes.PERMISSION,
                'I cannot jail a member whose highest role is equal to or above mine.'
            );
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const channels = await guild.channels.fetch();

            for (const channel of channels.values()) {
                if (
                    !channel ||
                    !channel.permissionOverwrites ||
                    channel.id === jailChannel.id
                ) {
                    continue;
                }

                await channel.permissionOverwrites.edit(
                    jailRole,
                    {
                        ViewChannel: false,
                    },
                    {
                        reason: `Jail restrictions for ${user.tag}: ${reason}`,
                    }
                );
            }

            await jailChannel.permissionOverwrites.edit(
                jailRole,
                {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    AddReactions: false,
                    SendMessagesInThreads: false,
                    CreatePublicThreads: false,
                    CreatePrivateThreads: false,
                },
                {
                    reason: 'Allow jailed members into #jail',
                }
            );

            await member.roles.add(jailRole, reason);

            await interaction.editReply({
                content: '👍',
            });
        } catch (error) {
            console.error('Jail command failed:', error);

            await interaction.editReply({
                content:
                    'I could not finish jailing this member. Check my permissions and the Railway logs.',
            }).catch(() => {});
        }
    },
};
