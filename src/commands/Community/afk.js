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
        const reason = interaction.options.getString('reason');
        // No reason = remove AFK
        if (!reason) {
            if (!afkUsers.has(key)) {
                return interaction.reply({
                    content: '❌ You are not currently AFK.',
                    ephemeral: true,
                });
            }
            afkUsers.delete(key);
            return interaction.reply({
                content: '👋 Your AFK status has been removed.',
            });
        }
        afkUsers.set(key, {
            reason,
            timestamp: Date.now(),
        });
        return interaction.reply({
            content: `💤 You are now AFK: **${reason}**`,
        });
    },
};
