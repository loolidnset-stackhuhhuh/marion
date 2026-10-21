import { AuditLogEvent } from 'discord.js';

const AUDIT_LOG_TYPES = {
  ban: AuditLogEvent.MemberBanAdd,
  kick: AuditLogEvent.MemberKick,
  channelDelete: AuditLogEvent.ChannelDelete,
  channelCreate: AuditLogEvent.ChannelCreate,
  roleDelete: AuditLogEvent.RoleDelete,
  roleCreate: AuditLogEvent.RoleCreate,
  webhook: AuditLogEvent.WebhookCreate,
  botAdd: AuditLogEvent.BotAdd,
  guildUpdate: AuditLogEvent.GuildUpdate,
};

export async function getAuditLogExecutor(
  guild,
  action,
  targetId = null,
) {
  const type = AUDIT_LOG_TYPES[action];

  if (!type) {
    return null;
  }

  const auditLogs = await guild.fetchAuditLogs({
    type,
    limit: 10,
  }).catch(() => null);

  if (!auditLogs) {
    return null;
  }

  const now = Date.now();

  const entry = auditLogs.entries.find((entry) => {
    if (!entry.executorId) {
      return false;
    }

    if (now - entry.createdTimestamp > 10_000) {
      return false;
    }

    if (
      targetId &&
      entry.target?.id &&
      entry.target.id !== targetId
    ) {
      return false;
    }

    return true;
  });

  if (!entry) {
    return null;
  }

  return {
    userId: entry.executorId,
    entry,
  };
}
