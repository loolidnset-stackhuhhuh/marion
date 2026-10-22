import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
} from 'discord.js';

import {
    getGuildConfig,
    patchGuildConfig,
} from '../../services/config/guildConfig.js';

export default {
    data: new SlashCommandBuilder()
        .setName('antinuke')
        .setDescription('Configure Marion Anti-Nuke protection')
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('enable')
                .setDescription('Enable Anti-Nuke protection')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('disable')
                .setDescription('Disable Anti-Nuke protection')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('status')
                .setDescription('View Anti-Nuke configuration')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('log')
                .setDescription('Set the Anti-Nuke log channel')
                .addChannelOption((option) =>
                    option
                        .setName('channel')
                        .setDescription('Channel for Anti-Nuke alerts')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        ),

    category: 'Moderation',

    async execute(interaction) {
        const guild = interaction.guild;

        if (!guild) {
            return interaction.reply({
                content: 'This command can only be used in a server.',
                ephemeral: true,
            });
        }

        if (
            !interaction.memberPermissions?.has(
                PermissionFlagsBits.ManageGuild
            )
        ) {
            return interaction.reply({
                content:
                    'You need **Manage Server** permission to use Anti-Nuke.',
                ephemeral: true,
            });
        }

        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'enable') {
                const botMember = guild.members.me;

                if (
                    !botMember?.permissions.has(
                        PermissionFlagsBits.ViewAuditLog
                    )
                ) {
                    return interaction.reply({
                        content:
                            'I need **View Audit Log** permission before Anti-Nuke can be enabled.',
                        ephemeral: true,
                    });
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
                        userId: interaction.user.id,
                    }
                );

                return interaction.reply({
                    content:
                        'Anti-Nuke protection has been **enabled**.',
                });
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
                        userId: interaction.user.id,
                    }
                );

                return interaction.reply({
                    content:
                        'Anti-Nuke protection has been **disabled**.',
                });
            }

            if (subcommand === 'log') {
                const channel = interaction.options.getChannel(
                    'channel',
                    true
                );

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
                        userId: interaction.user.id,
                    }
                );

                return interaction.reply({
                    content:
                        `Anti-Nuke logs will now be sent to ${channel}.`,
                });
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
                    .map(([key, name]) =>
                        `${antinuke.protections?.[key] ? 'ON' : 'OFF'} — ${name}`
                    )
                    .join('\n');

                return interaction.reply({
                    embeds: [{
                        title: 'Marion Anti-Nuke',
                        description: [
                            `**Status:** ${antinuke.enabled ? 'Enabled' : 'Disabled'}`,
                            `**Punishment:** ${antinuke.punishment ?? 'ban'}`,
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
                    }],
                });
            }
        } catch (error) {
            console.error(
                `Anti-Nuke command error in guild ${guild.id}:`,
                error
            );

            return interaction.reply({
                content:
                    'Anti-Nuke could not update the server configuration. Check the Railway logs for the error.',
                ephemeral: true,
            }).catch(() => {});
        }
    },
};
