export const DEFAULT_ECONOMY_DATA = {
  wallet: 0,
  bank: 0,
  bankLevel: 0,
  xp: 0,
  level: 1,
  lastDaily: 0,
  lastWork: 0,
  lastCrime: 0,
  lastRob: 0,
  lastMine: 0,
  lastGamble: 0,
  lastFish: 0,
  dailyStreak: 0,
  lastWeekly: 0,
  lastDeposit: 0,
  lastWithdraw: 0,
  inventory: {},
  upgrades: {},
  cooldowns: {}
};
export const DEFAULT_GUILD_CONFIG = {
  prefix: ',',
  moderation: {
    enabled: true,
    logChannel: null,
    modLogChannel: null,
    muteRole: null,
    jailRole: null,
    warnThreshold: 3,
    autoBan: false
  },
  antinuke: {
    enabled: false,
    logChannel: null,
    punishment: 'ban',
    whitelist: [],
    limits: {
      channelDelete: 3,
      channelCreate: 5,
      roleDelete: 3,
      roleCreate: 5,
      ban: 3,
      kick: 5,
      webhookCreate: 3,
      botAdd: 2
    },
    timeWindow: 10
  },
  welcome: {
    enabled: false,
    channel: null,
    message: 'Welcome {user} to {server}!'
  },
  goodbye: {
    enabled: false,
    channel: null,
    message: '{user} has left the server.'
  },
  logging: {
    enabled: false,
    channel: null,
    messageDelete: false,
    messageEdit: false,
    memberJoin: false,
    memberLeave: false,
    roleCreate: false,
    roleDelete: false,
    channelCreate: false,
    channelDelete: false
  },
  tickets: {
    enabled: false,
    category: null,
    supportRole: null,
    transcriptChannel: null
  },
  verification: {
    enabled: false,
    channel: null,
    role: null
  },
  leveling: {
    enabled: true,
    channel: null,
    xpEnabled: true,
    levelUpMessages: true,
    levelRoles: {}
  },
  reactionRoles: {
    enabled: false,
    panels: []
  },
  giveaways: {
    enabled: true
  }
};
export const COLORS = {
  PRIMARY: 0xff69b4,
  SUCCESS: 0x57f287,
  WARNING: 0xfee75c,
  ERROR: 0xed4245,
  INFO: 0x5865f2
};
export const EMOJIS = {
  APPROVE: '<:approve:1562121487165558947>',
  WARNING: '<:warning:1562130172004540439>',
  DENY: '<:deny:1562121610813513871>'
};
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000
};
export const LIMITS = {
  MAX_WARNINGS: 10,
  MAX_COMMANDS: 100,
  MAX_PREFIX_LENGTH: 5,
  MAX_GIVEAWAY_DURATION: 30 * TIME.DAY,
  MAX_TICKET_NAME_LENGTH: 50
};
export const BOT_DEFAULTS = {
  prefix: ',',
  cooldown: 3000,
  deleteCommands: false,
  maintenance: false
};
