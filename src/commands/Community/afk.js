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

    // If already AFK, remove AFK
    if (afkUsers.has(key)) {
      afkUsers.delete(key);

      return message.channel.send({
        embeds: [
          {
            description: `👋 ${message.author}: Your AFK status has been removed.`,
          },
        ],
      });
    }

    const reason = args.length
      ? args.join(' ')
      : 'AFK';

    afkUsers.set(key, {
      reason,
      timestamp: Date.now(),
    });

    return message.channel.send({
      embeds: [
        {
          description: `💤 ${message.author}: You're now AFK with the status: **${reason}**`,
        },
      ],
    });
  },
};
