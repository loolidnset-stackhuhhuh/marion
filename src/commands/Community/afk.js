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
            .setColor(0x57F287)
            .setDescription(
                `<:approve:1562121487165558947> ${interaction.user}: You're now AFK with the status: **${reason}**`
            );

        return interaction.reply({
            embeds: [embed],
        });
    },
};
