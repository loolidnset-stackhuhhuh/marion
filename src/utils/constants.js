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
  cooldowns: {},
};
export const DEFAULT_GUILD_CONFIG = {
  enabledCommands: {},
  birthdayChannelId: null,
  premiumRoleId: null,
  modRole: null,
  adminRole: null,
  welcomeChannel: null,
  autoRole: null,
  logging: {
    enabled: false,
    channels: {
      audit: null,
      applications: null,
      reports: null,
    },
    ignore: {
      users: [],
      channels: [],
    },
    enabledEvents: {},
  },
  verification: {
    enabled: false,
  },
  antinuke: {
    enabled: false,
    logChannelId: null,
    punishment: 'ban',
    whitelist: {
      users: [],
      roles: [],
    },
    thresholds: {
      ban: {
        amount: 3,
        window: 10_000,
      },
      kick: {
        amount: 3,
        window: 10_000,
      },
      channelDelete: {
        amount: 3,
        window: 10_000,
      },
      channelCreate: {
        amount: 5,
        window: 10_000,
      },
      roleDelete: {
        amount: 3,
        window: 10_000,
      },
      roleCreate: {
        amount: 5,
        window: 10_000,
      },
      webhook: {
        amount: 3,
        window: 10_000,
      },
      botAdd: {
        amount: 1,
        window: 10_000,
      },
      guildUpdate: {
        amount: 1,
        window: 10_000,
      },
    },
    protections: {
      ban: true,
      kick: true,
      channelDelete: true,
      channelCreate: true,
      roleDelete: true,
      roleCreate: true,
      webhook: true,
      botAdd: true,
      guildUpdate: true,
    },
  },
};

Replace the contents of src/utils/constants.js with that exact script, commit it, and redeploy Railway.

Then send me the new Railway logs. We’ll fix the next error one at a time so we don’t break anything else.
