import { SlashCommandBuilder } from 'discord.js';

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

        return interaction.reply({
            content: `💤 You are now AFK: **${reason}**`,
        });
    },
};
