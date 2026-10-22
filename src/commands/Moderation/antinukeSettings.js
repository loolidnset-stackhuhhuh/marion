import {
    SlashCommandBuilder,
    PermissionFlagsBits,
} from 'discord.js';

import {
    getGuildConfig,
    patchGuildConfig,
} from '../../services/config/guildConfig.js';

const PROTECTIONS = [
    'ban',
    'kick',
    'channelDelete',
    'channelCreate',
    'roleDelete',
    'roleCreate',
    'webhook',
    'botAdd',
    'guildUpdate',
];

const PROTECTION_NAMES = {
    ban: 'Mass Ban',
    kick: 'Mass Kick',
    channelDelete: 'Channel Delete',
    channelCreate: 'Channel Create',
    roleDelete: 'Role Delete',
    roleCreate: 'Role Create',
    webhook: 'Webhook Changes',
    botAdd: 'Bot Add',
    guildUpdate: 'Server Updates',
};

export default {
    data: new SlashCommandBuilder()
        .setName('antinuke-settings')
        .setDescription('Configure Marion Anti-Nuke settings')
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        )

        .addSubcommand((subcommand) =>
            subcommand
                .setName('punishment')
                .setDescription('Set the Anti-Nuke punishment')
                .addStringOption((option) =>
                    option
                        .setName('type')
                        .setDescription('Punishment to apply')
                        .setRequired(true)
                        .addChoices(
                            {
                                name: 'Ban',
                                value: 'ban',
                            },
                            {
                                name: 'Kick',
                                value: 'kick',
                            },
                            {
                                name: 'Strip Roles',
                                value: 'strip',
                            },
                            {
                                name: 'Detection Only',
                                value: 'none',
                            },
                        )
                )
        )

        .addSubcommand((subcommand) =>
            subcommand
                .setName('protection')
                .setDescription('Enable or disable a protection')
                .addStringOption((option) =>
                    option
                        .setName('type')
                        .setDescription('Protection to configure')
                        .setRequired(true)
                        .addChoices(
                            ...PROTECTIONS.map((key) => ({
                                name: PROTECTION_NAMES[key],
                                value: key,
                            }))
                        )
                )
                .addBooleanOption((option) =>
                    option
                        .setName('enabled')
                        .setDescription('Whether this protection is enabled')
                        .setRequired(true)
                )
        )

        .addSubcommand((subcommand) =>
            subcommand
                .setName('threshold')
                .setDescription('Configure an Anti-Nuke threshold')
                .addStringOption((option) =>
                    option
                        .setName('type')
                        .setDescription('Protection threshold')
                        .setRequired(true)
                        .addChoices(
                            ...PROTECTIONS.map((key) => ({
                                name: PROTECTION_NAMES[key],
                                value: key,
                            }))
                        )
                )
                .addIntegerOption((option) =>
                    option
                        .setName('amount')
                        .setDescription('Number of actions required')
                        .setMinValue(1)
                        .setMaxValue(100)
                        .setRequired(true)
                )
                .addIntegerOption((option) =>
                    option
                        .setName('window')
                        .setDescription('Time window in seconds')
                        .setMinValue(1)
                        .setMaxValue(300)
                        .setRequired(true)
                )
        )

        .addSubcommand((subcommand) =>
            subcommand
                .setName('reset')
                .setDescription('Reset Anti-Nuke settings to their defaults')
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
                    'You need **Manage Server** permission to configure Anti-Nuke.',
                ephemeral: true,
            });
        }

        const subcommand = interaction.options.getSubcommand();

        try {
            const config = await getGuildConfig(
                guild.client,
                guild.id
            );

            const antinuke = config?.antinuke ?? {};

            const protections = {
                ...(antinuke.protections ?? {}),
            };

            const thresholds = {
                ...(antinuke.thresholds ?? {}),
            };

            if (subcommand === 'punishment') {
                const type = interaction.options.getString(
                    'type',
                    true
                );

                await patchGuildConfig(
                    guild.client,
                    guild.id,
                    {
                        antinuke: {
                            ...antinuke,
                            punishment: type,
                        },
                    },
                    {
                        source: 'antinuke.settings.punishment',
                        userId: interaction.user.id,
                    }
                );

                return interaction.reply({
                    content:
                        `<:approve:1562121610813513871> Anti-Nuke punishment set to **${type}**.`,
                });
            }

            if (subcommand === 'protection') {
                const type = interaction.options.getString(
                    'type',
                    true
                );

                const enabled = interaction.options.getBoolean(
                    'enabled',
                    true
                );

                protections[type] = enabled;

                await patchGuildConfig(
                    guild.client,
                    guild.id,
                    {
                        antinuke: {
                            ...antinuke,
                            protections,
                        },
                    },
                    {
                        source: 'antinuke.settings.protection',
                        userId: interaction.user.id,
                    }
                );

                return interaction.reply({
                    content:
                        `<:approve:1562121610813513871> **${PROTECTION_NAMES[type]}** protection is now **${enabled ? 'enabled' : 'disabled'}**.`,
                });
            }

            if (subcommand === 'threshold') {
                const type = interaction.options.getString(
                    'type',
                    true
                );

                const amount = interaction.options.getInteger(
                    'amount',
                    true
                );

                const windowSeconds =
                    interaction.options.getInteger(
                        'window',
                        true
                    );

                thresholds[type] = {
                    amount,
                    window: windowSeconds * 1000,
                };

                await patchGuildConfig(
                    guild.client,
                    guild.id,
                    {
                        antinuke: {
                            ...antinuke,
                            thresholds,
                        },
                    },
                    {
                        source: 'antinuke.settings.threshold',
                        userId: interaction.user.id,
                    }
                );

                return interaction.reply({
                    content:
                        `<:approve:1562121610813513871> **${PROTECTION_NAMES[type]}** threshold set to **${amount} actions / ${windowSeconds}s**.`,
                });
            }

            if (subcommand === 'reset') {
                const defaultAntinuke = {
                    enabled: false,
                    logChannelId: null,
                    punishment: 'ban',

                    whitelist: {
                        users: [],
                        roles: [],
                    },

                    thresholds: {
                        ban: {
                            amount: 3,
                            window: 10_000,
                        },
                        kick: {
                            amount: 3,
                            window: 10_000,
                        },
                        channelDelete: {
                            amount: 3,
                            window: 10_000,
                        },
                        channelCreate: {
                            amount: 5,
                            window: 10_000,
                        },
                        roleDelete: {
                            amount: 3,
                            window: 10_000,
                        },
                        roleCreate: {
                            amount: 5,
                            window: 10_000,
                        },
                        webhook: {
                            amount: 3,
                            window: 10_000,
                        },
                        botAdd: {
                            amount: 1,
                            window: 10_000,
                        },
                        guildUpdate: {
                            amount: 1,
                            window: 10_000,
                        },
                    },

                    protections: {
                        ban: true,
                        kick: true,
                        channelDelete: true,
                        channelCreate: true,
                        roleDelete: true,
                        roleCreate: true,
                        webhook: true,
                        botAdd: true,
                        guildUpdate: true,
                    },
                };

                await patchGuildConfig(
                    guild.client,
                    guild.id,
                    {
                        antinuke: defaultAntinuke,
                    },
                    {
                        source: 'antinuke.settings.reset',
                        userId: interaction.user.id,
                    }
                );

                return interaction.reply({
                    content:
                        '<:approve:1562121610813513871> Anti-Nuke settings have been reset to their defaults.',
                });
            }
        } catch (error) {
            console.error(
                `Anti-Nuke settings error in guild ${guild.id}:`,
                error
            );

            return interaction.reply({
                content:
                    'I could not update the Anti-Nuke settings. Check the Railway logs for the error.',
                ephemeral: true,
            }).catch(() => {});
        }
    },
};
