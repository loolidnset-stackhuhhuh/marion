import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Collection } from 'discord.js';

import { logger } from '../../utils/logger.js';

import botConfig from '../../config/bot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_COMMANDS = 100;
const COMMAND_COUNT_WARN_THRESHOLD = 90;

const PRIORITY_COMMANDS = new Set([
  'setup',
  'help',
  'configwizard',
  'embedbuilder',
  'wipedata',
  'apply',
  'alias',
]);

function getSubcommandInfo(commandData) {
  const subcommands = [];

  if (commandData.options) {
    for (const option of commandData.options) {
      if (option.type === 1) {
        subcommands.push(option.name);
      } else if (option.type === 2 && option.options) {
        for (const subOption of option.options) {
          if (subOption.type === 1) {
            subcommands.push(`${option.name}/${subOption.name}`);
          }
        }
      }
    }
  }

  return subcommands;
}

async function getAllFiles(directory, fileList = []) {
  const files = await fs.readdir(directory, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(directory, file.name);

    if (file.isDirectory()) {
      if (file.name === 'modules') {
        continue;
      }

      await getAllFiles(filePath, fileList);
    } else if (file.name.endsWith('.js')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

export async function loadCommands(client) {
  client.commands = new Collection();

  const commandsPath = path.join(__dirname, '../../commands');
  const commandFiles = await getAllFiles(commandsPath);

  logger.info(`Found ${commandFiles.length} command files to load`);

  const uniqueCommandNames = new Set();

  for (const filePath of commandFiles) {
    const normalizedPath = filePath.replace(/\\/g, '/');

    try {
      const commandDir = path.dirname(filePath);
      const category = path.basename(commandDir);

      const commandModule = await import(
        pathToFileURL(filePath).href
      );

      const command = commandModule.default || commandModule;

      /*
       * Prefix-only commands do not need Discord slash-command
       * data. They only need an execute function and a name.
       */
      if (command.prefixOnly) {
        if (!command.name || typeof command.execute !== 'function') {
          logger.warn(
            `Prefix-only command at ${normalizedPath} is missing required "name" or "execute" property.`
          );

          continue;
        }

        command.category = category;
        command.filePath = normalizedPath;

        const primaryCommandName = command.name.toLowerCase();

        if (!uniqueCommandNames.has(primaryCommandName)) {
          uniqueCommandNames.add(primaryCommandName);

          client.commands.set(primaryCommandName, command);

          if (Array.isArray(command.aliases)) {
            for (const alias of command.aliases) {
              const normalizedAlias = String(alias).toLowerCase();

              if (!client.commands.has(normalizedAlias)) {
                client.commands.set(normalizedAlias, command);
              }
            }
          }
        }

        logger.info(
          `Loaded prefix-only command: ${primaryCommandName} from ${normalizedPath} (category: ${category})`
        );

        continue;
      }

      /*
       * Normal commands still require Discord command data.
       */
      if (!command.data || !command.execute) {
        logger.warn(
          `Command at ${normalizedPath} is missing required "data" or "execute" property.`
        );

        continue;
      }

      command.category = category;
      command.filePath = normalizedPath;

      const primaryCommandName = command.data.name;

      if (!uniqueCommandNames.has(primaryCommandName)) {
        uniqueCommandNames.add(primaryCommandName);

        client.commands.set(primaryCommandName, command);

        if (Array.isArray(command.aliases)) {
          for (const alias of command.aliases) {
            const normalizedAlias = String(alias).toLowerCase();

            if (!client.commands.has(normalizedAlias)) {
              client.commands.set(normalizedAlias, command);
            }
          }
        }
      }

      const subcommands = getSubcommandInfo(
        command.data.toJSON()
      );

      logger.info(
        `Loaded command: ${primaryCommandName} from ${normalizedPath} (category: ${category})`
      );

      if (subcommands.length > 0) {
        logger.info(
          ` - Subcommands: ${subcommands.join(', ')}`
        );
      }
    } catch (error) {
      logger.error(
        `<:warning:1562130172004540439> FAILED TO LOAD COMMAND: ${normalizedPath}`
      );

      logger.error(
        `Error name: ${error?.name || 'Unknown error'}`
      );

      logger.error(
        `Error message: ${error?.message || 'Unknown error'}`
      );

      logger.error(
        error?.stack || String(error)
      );
    }
  }

  /*
   * Only commands that actually have Discord command data
   * participate in slash-command/subcommand statistics.
   */
  const commandsWithSubcommands = Array.from(
    client.commands.values()
  ).filter((cmd) => {
    if (
      cmd.prefixOnly ||
      !cmd.data ||
      typeof cmd.data.toJSON !== 'function'
    ) {
      return false;
    }

    const subcommands = getSubcommandInfo(
      cmd.data.toJSON()
    );

    return subcommands.length > 0;
  });

  const totalSubcommands =
    commandsWithSubcommands.reduce(
      (total, cmd) =>
        total +
        getSubcommandInfo(cmd.data.toJSON()).length,
      0
    );

  const uniqueCommands = new Set();

  for (const [name, command] of client.commands.entries()) {
    if (command.prefixOnly) {
      uniqueCommands.add(command.name);
      continue;
    }

    if (command.data && command.data.name) {
      uniqueCommands.add(command.data.name);
    }
  }

  logger.info(`Loaded ${uniqueCommands.size} commands`);

  return client.commands;
}

function collectCommandPayloads(client) {
  const commands = [];
  let totalSubcommands = 0;

  const registeredNames = new Set();

  for (const command of client.commands.values()) {
    /*
     * PREFIX-ONLY COMMANDS ARE NEVER REGISTERED WITH DISCORD.
     */
    if (command.prefixOnly === true) {
      logger.debug(
        `Skipping prefix-only command from slash registration: ${command.name}`
      );

      continue;
    }

    if (
      !command.data ||
      typeof command.data.toJSON !== 'function'
    ) {
      logger.warn(
        `Command missing data or toJSON method: ${command.name || 'unknown'}`
      );

      continue;
    }

    const commandName = command.data.name;

    if (registeredNames.has(commandName)) {
      logger.debug(
        `Skipping duplicate command: ${commandName}`
      );

      continue;
    }

    registeredNames.add(commandName);

    const commandJson = command.data.toJSON();

    commands.push(commandJson);

    totalSubcommands +=
      getSubcommandInfo(commandJson).length;
  }

  return {
    commands,
    totalSubcommands,
  };
}

function validateCommands(commands) {
  const validationErrors = [];

  for (const cmd of commands) {
    if (cmd.name && cmd.name.length > 32) {
      validationErrors.push(
        `Command ${cmd.name} has name longer than 32 chars: "${cmd.name}" (${cmd.name.length} chars)`
      );
    }

    if (
      cmd.description &&
      cmd.description.length > 110
    ) {
      validationErrors.push(
        `Command ${cmd.name} has description longer than 110 chars: "${cmd.description}" (${cmd.description.length} chars)`
      );
    }

    if (!cmd.options) {
      continue;
    }

    for (const option of cmd.options) {
      if (
        option.name &&
        option.name.length > 32
      ) {
        validationErrors.push(
          `Command ${cmd.name} option ${option.name} has name longer than 32 chars: "${option.name}" (${option.name.length} chars)`
        );
      }

      if (
        option.description &&
        option.description.length > 110
      ) {
        validationErrors.push(
          `Command ${cmd.name} option ${option.name} has description longer than 110 chars: "${option.description}" (${option.description.length} chars)`
        );
      }

      if (option.choices) {
        for (const choice of option.choices) {
          if (
            choice.name &&
            choice.name.length > 110
          ) {
            validationErrors.push(
              `Command ${cmd.name} choice ${choice.name} has name longer than 110 chars`
            );
          }
        }
      }

      if (option.options) {
        for (const subOption of option.options) {
          if (
            subOption.name &&
            subOption.name.length > 32
          ) {
            validationErrors.push(
              `Command ${cmd.name} subcommand ${subOption.name} has name longer than 32 chars`
            );
          }

          if (
            subOption.description &&
            subOption.description.length > 110
          ) {
            validationErrors.push(
              `Command ${cmd.name} subcommand ${subOption.name} has description longer than 110 chars`
            );
          }
        }
      }
    }
  }

  return validationErrors;
}

export function getSlashCommands(client) {
  const { commands, totalSubcommands } =
    collectCommandPayloads(client);

  const validationErrors =
    validateCommands(commands);

  if (validationErrors.length > 0) {
    for (const error of validationErrors) {
      logger.warn(error);
    }
  }

  if (
    commands.length >= COMMAND_COUNT_WARN_THRESHOLD
  ) {
    logger.warn(
      `Command count (${commands.length}) is near Discord's ${MAX_COMMANDS} global command limit`
    );
  }

  if (commands.length > MAX_COMMANDS) {
    logger.warn(
      `Command count (${commands.length}) exceeds Discord limit (${MAX_COMMANDS}).`
    );

    /*
     * Priority commands are kept first, while prefix-only
     * commands have already been removed from this list.
     */
    const priority = [];
    const normal = [];

    for (const command of commands) {
      if (PRIORITY_COMMANDS.has(command.name)) {
        priority.push(command);
      } else {
        normal.push(command);
      }
    }

    const limitedCommands = [
      ...priority,
      ...normal,
    ].slice(0, MAX_COMMANDS);

    const excluded = commands
      .filter(
        (command) =>
          !limitedCommands.some(
            (included) =>
              included.name === command.name
          )
      )
      .map((command) => command.name);

    if (excluded.length > 0) {
      logger.warn(
        `Commands excluded from global registration due to Discord's ${MAX_COMMANDS}-command limit: ${excluded.join(', ')}`
      );
    }

    return limitedCommands;
  }

  return commands;
}

export function getCommandPayloads(client) {
  return collectCommandPayloads(client);
}

export default {
  loadCommands,
  getSlashCommands,
  getCommandPayloads,
};
