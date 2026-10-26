import { EmbedBuilder } from 'discord.js';

export const afkUsers = new Map();

const APPROVE_EMOJI = '<:approve:1562121487165558947>';

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
     * If the user is already AFK, remove their AFK status.
     */
    if (afkUsers.has(key)) {
      afkUsers.delete(key);

      const embed = new EmbedBuilder()
        .setDescription(
          `${APPROVE_EMOJI} ${message.author}: Your AFK status has been removed.`
        );

      return message.channel.send({
        embeds: [embed],
      });
    }

    /*
     * Set AFK status.
     */
    const reason = args.length
      ? args.join(' ')
      : 'AFK';

    afkUsers.set(key, {
      reason,
      timestamp: Date.now(),
    });

    /*
     * Bleed-style AFK confirmation.
     *
     * Example:
     * <:approve:...> @user: You're now AFK with the status:
     * AFK
     */
    const embed = new EmbedBuilder()
      .setDescription(
        `${APPROVE_EMOJI} ${message.author}: You're now AFK with the status:\n` +
        `**${reason}**`
      );

    return message.channel.send({
      embeds: [embed],
    });
  },
};
