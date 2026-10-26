import { EmbedBuilder } from 'discord.js';

export const afkUsers = new Map();

export default {
  name: 'afk',
  aliases: [],
  prefixOnly: true,
  category: 'Community',
  description: 'Set or remove your AFK status.',
  usage: ',afk [reason]',

  async execute(message, args) {
    if (!message.guild) return;

    const key = `${message.guild.id}:${message.author.id}`;

    // Remove AFK if already AFK
    if (afkUsers.has(key)) {
      afkUsers.delete(key);

      const embed = new EmbedBuilder()
        .setDescription(
          `👋 ${message.author}: Your AFK status has been removed.`
        );

      return message.channel.send({
        embeds: [embed],
      });
    }

    // Set AFK
    const reason = args.length
      ? args.join(' ')
      : 'AFK';

    afkUsers.set(key, {
      reason,
      timestamp: Date.now(),
    });

    const embed = new EmbedBuilder()
      .setDescription(
        `💤 ${message.author}: You're now AFK with the status: **${reason}**`
      );

    return message.channel.send({
      embeds: [embed],
    });
  },
};
