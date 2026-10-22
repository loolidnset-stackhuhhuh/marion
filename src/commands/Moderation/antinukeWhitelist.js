import {
    SlashCommandBuilder,
    PermissionFlagsBits,
} from 'discord.js';

import {
    getGuildConfig,
    patchGuildConfig,
} from '../../services/config/guildConfig.js';

export default {
    data: new SlashCommandBuilder()
        .setName('antinuke-whitelist')
        .setDescription('Manage Marion Anti-Nuke trusted users and roles')
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        )

        .addSubcommand((subcommand) =>
            subcommand
                .setName('add-user')
                .setDescription('Whitelist a user')
                .addUserOption((option) =>
                    option
                        .setName('user')
                        .setDescription('User to whitelist')
                        .setRequired(true)
                )
        )

        .addSubcommand((subcommand) =>
            subcommand
                .setName('remove-user')
                .setDescription('Remove a user from the whitelist')
                .addUserOption((option) =>
                    option
                        .setName('user')
                        .setDescription('User to remove')
                        .setRequired(true)
                )
        )

        .addSubcommand((subcommand) =>
            subcommand
                .setName('add-role')
                .setDescription('Whitelist a role')
                .addRoleOption((option) =>
                    option
                        .setName('role')
                        .setDescription('Role to whitelist')
                        .setRequired(true)
                )
        )

        .addSubcommand((subcommand) =>
            subcommand
                .setName('remove-role')
                .setDescription('Remove a role from the whitelist')
                .addRoleOption((option) =>
                    option
                        .setName('role')
                        .setDescription('Role to remove')
                        .setRequired(true)
                )
        )

        .addSubcommand((subcommand) =>
            subcommand
                .setName('list')
                .setDescription('View the Anti-Nuke whitelist')
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
                    'You need **Manage Server** permission to manage the Anti-Nuke whitelist.',
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

            const whitelist = {
                users: Array.isArray(antinuke.whitelist?.users)
                    ? [...antinuke.whitelist.users]
                    : [],

                roles: Array.isArray(antinuke.whitelist?.roles)
                    ? [...antinuke.whitelist.roles]
                    : [],
            };

            if (subcommand === 'add-user') {
                const user = interaction.options.getUser(
                    'user',
                    true
                );

                if (!whitelist.users.includes(user.id)) {
                    whitelist.users.push(user.id);
                }

                await patchGuildConfig(
                    guild.client,
                    guild.id,
                    {
                        antinuke: {
                            ...antinuke,
                            whitelist,
                        },
                    },
                    {
                        source: 'antinuke.whitelist.add-user',
                        userId: interaction.user.id,
                    }
                );

                return interaction.reply({
                    content:
                        `${user} has been added to the Anti-Nuke whitelist.`,
                });
            }

            if (subcommand === 'remove-user') {
                const user = interaction.options.getUser(
                    'user',
                    true
                );

                whitelist.users = whitelist.users.filter(
                    (id) => id !== user.id
                );

                await patchGuildConfig(
                    guild.client,
                    guild.id,
                    {
                        antinuke: {
                            ...antinuke,
                            whitelist,
                        },
                    },
                    {
                        source: 'antinuke.whitelist.remove-user',
                        userId: interaction.user.id,
                    }
                );

                return interaction.reply({
                    content:
                        `${user} has been removed from the Anti-Nuke whitelist.`,
                });
            }

            if (subcommand === 'add-role') {
                const role = interaction.options.getRole(
                    'role',
                    true
                );

                if (!whitelist.roles.includes(role.id)) {
                    whitelist.roles.push(role.id);
                }

                await patchGuildConfig(
                    guild.client,
                    guild.id,
                    {
                        antinuke: {
                            ...antinuke,
                            whitelist,
                        },
                    },
                    {
                        source: 'antinuke.whitelist.add-role',
                        userId: interaction.user.id,
                    }
                );

                return interaction.reply({
                    content:
                        `${role} has been added to the Anti-Nuke whitelist.`,
                });
            }

            if (subcommand === 'remove-role') {
                const role = interaction.options.getRole(
                    'role',
                    true
                );

                whitelist.roles = whitelist.roles.filter(
                    (id) => id !== role.id
                );

                await patchGuildConfig(
                    guild.client,
                    guild.id,
                    {
                        antinuke: {
                            ...antinuke,
                            whitelist,
                        },
                    },
                    {
                        source: 'antinuke.whitelist.remove-role',
                        userId: interaction.user.id,
                    }
                );

                return interaction.reply({
                    content:
                        `${role} has been removed from the Anti-Nuke whitelist.`,
                });
            }

            if (subcommand === 'list') {
                const users = whitelist.users.length
                    ? whitelist.users
                        .map((id) => `<@${id}>`)
                        .join('\n')
                    : 'None';

                const roles = whitelist.roles.length
                    ? whitelist.roles
                        .map((id) => `<@&${id}>`)
                        .join('\n')
                    : 'None';

                return interaction.reply({
                    embeds: [{
                        title: 'Anti-Nuke Whitelist',
                        fields: [
                            {
                                name: 'Trusted Users',
                                value: users,
                                inline: false,
                            },
                            {
                                name: 'Trusted Roles',
                                value: roles,
                                inline: false,
                            },
                        ],
                    }],
                    ephemeral: true,
                });
            }
        } catch (error) {
            console.error(
                `Anti-Nuke whitelist error in guild ${guild.id}:`,
                error
            );

            return interaction.reply({
                content:
                    'I could not update the Anti-Nuke whitelist. Check the Railway logs for the error.',
                ephemeral: true,
            }).catch(() => {});
        }
    },
};
