async function handleAFK(message) {
  try {
    const authorKey = `${message.guild.id}:${message.author.id}`;

    // Remove AFK when the user talks
    if (afkUsers.has(authorKey)) {
      const afkData = afkUsers.get(authorKey);
      afkUsers.delete(authorKey);

      const timeAway = Date.now() - afkData.timestamp;
      const totalSeconds = Math.floor(timeAway / 1000);

      let timeText;

      if (totalSeconds < 60) {
        timeText = `${totalSeconds} second${totalSeconds === 1 ? '' : 's'}`;
      } else if (totalSeconds < 3600) {
        const minutes = Math.floor(totalSeconds / 60);
        timeText = `${minutes} minute${minutes === 1 ? '' : 's'}`;
      } else if (totalSeconds < 86400) {
        const hours = Math.floor(totalSeconds / 3600);
        timeText = `${hours} hour${hours === 1 ? '' : 's'}`;
      } else {
        const days = Math.floor(totalSeconds / 86400);
        timeText = `${days} day${days === 1 ? '' : 's'}`;
      }

      const embed = new EmbedBuilder()
        .setDescription(
          `👋 ${message.author}: Welcome back, you were away for **${timeText}**`
        );

      await message.channel.send({
        embeds: [embed],
      }).catch(() => {});
    }

    // Check mentions for AFK users
    for (const [userId] of message.mentions.users) {
      if (userId === message.author.id) continue;

      const key = `${message.guild.id}:${userId}`;
      const afkData = afkUsers.get(key);

      if (!afkData) continue;

      const timeAway = Date.now() - afkData.timestamp;
      const totalSeconds = Math.floor(timeAway / 1000);

      let timeText;

      if (totalSeconds < 60) {
        timeText = `${totalSeconds} second${totalSeconds === 1 ? '' : 's'}`;
      } else if (totalSeconds < 3600) {
        const minutes = Math.floor(totalSeconds / 60);
        timeText = `${minutes} minute${minutes === 1 ? '' : 's'}`;
      } else if (totalSeconds < 86400) {
        const hours = Math.floor(totalSeconds / 3600);
        timeText = `${hours} hour${hours === 1 ? '' : 's'}`;
      } else {
        const days = Math.floor(totalSeconds / 86400);
        timeText = `${days} day${days === 1 ? '' : 's'}`;
      }

      const embed = new EmbedBuilder()
        .setDescription(
          `💤 <@${userId}> is currently AFK: **${afkData.reason}**\n` +
          `They went AFK **${timeText} ago**.`
        );

      await message.channel.send({
        embeds: [embed],
      }).catch(() => {});
    }
  } catch (error) {
    logger.error('Error handling AFK:', error);
  }
}
