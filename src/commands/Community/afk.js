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

    /*
     * If already AFK, do not manually remove it here.
     * Sending a normal message will be handled by messageCreate
     * and will trigger the "Welcome back" message.
     */

    if (afkUsers.has(key)) {
      return;
    }

    const reason = args.length
      ? args.join(' ')
      : 'AFK';

    afkUsers.set(key, {
      reason,
      timestamp: Date.now(),
    });

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setDescription(
        `<:approve:1562121487165558947> ${message.author}: You're now AFK with the status: **${reason}**`
      );

    return message.channel.send({
      embeds: [embed],
    });
  },
};
