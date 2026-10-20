import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const afkUsers = new Map();

export default {
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Set or remove your AFK status')
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Why are you AFK?')
                .setRequired(false)
        ),

    category: 'community',

    async execute(interaction) {
        const key = `${interaction.guild.id}:${interaction.user.id}`;
        const reason = interaction.options.getString('reason') || 'AFK';

        afkUsers.set(key, {
            reason,
            timestamp: Date.now(),
        });

        const embed = new EmbedBuilder()
            .setAuthor({
                name: `${interaction.user.username} is now AFK`,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setDescription(
                `💤 **${interaction.user} is now AFK.**\n\n` +
                `> **Reason:** ${reason}`
            )
            .setTimestamp()
            .setFooter({
                text: 'AFK',
            });

        return interaction.reply({
            embeds: [embed],
        });
    },
};
