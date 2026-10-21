const files = [
  './src/commands/Community/afk.js',
  './src/utils/logger.js',
  './src/services/leveling/leveling.js',
  './src/services/leveling/xpSystem.js',
  './src/utils/rateLimiter.js',
  './src/utils/prefixParser.js',
  './src/utils/messageAdapter.js',
  './src/config/commands/commandAliases.js',
  './src/config/commands/prefixRestrictions.js',
  './src/services/config/guildConfig.js',
  './src/config/bot.js',
  './src/utils/abuseProtection.js',
  './src/utils/embeds.js',
  './src/services/commandAccessService.js',
  './src/services/countingGameService.js',
  './src/utils/errorHandler.js',
  './src/utils/interactionHelper.js',
  './src/utils/commandInputValidation.js',
  './src/utils/collectorComponents.js',
  './src/utils/responseCoordinator.js',
  './src/utils/permissionGuard.js',
  './src/commands/Community/apply.js',
];

for (const file of files) {
  try {
    await import(file);
    console.log(`OK: ${file}`);
  } catch (error) {
    console.log(`ERROR: ${file}`);
    console.log(error.stack || error);
  }
}
