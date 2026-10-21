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
