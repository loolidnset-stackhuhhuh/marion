/**
 * Prefix command restrictions.
 * Commands are allowed to run with the message prefix by default.
 * Add a command or subcommand to the restriction lists below only
 * when it must remain slash-only.
 */

/**
 * Top-level commands that cannot be invoked via prefix.
 */
export const SLASH_ONLY_COMMANDS = new Set([]);

/**
 * Subcommands blocked for every command when invoked via prefix.
 */
export const GLOBAL_BLOCKED_SUBCOMMANDS = new Set([]);

/**
 * Subcommand groups blocked for every command when invoked via prefix.
 */
export const GLOBAL_BLOCKED_SUBCOMMAND_GROUPS = new Set([]);

/**
 * Per-command subcommands that stay slash-only.
 * Example:
 * music: new Set(['shuffle', 'loop'])
 */
export const COMMAND_BLOCKED_SUBCOMMANDS = {};

/**
 * Collect subcommand names from a slash command definition.
 * @param {object} commandJson
 * @returns {string[]}
 */
function collectSubcommandNames(commandJson) {
  const options = commandJson.options || [];
  const subcommandGroup = options.find((option) => option.type === 2);

  if (subcommandGroup) {
    const names = [];

    for (const group of subcommandGroup.options || []) {
      names.push(
        ...(group.options || [])
          .filter((option) => option.type === 1)
          .map((option) => option.name)
      );
    }

    return names;
  }

  return options
    .filter((option) => option.type === 1)
    .map((subcommand) => subcommand.name);
}

/**
 * Check whether a subcommand is blocked.
 * @param {string} commandName
 * @param {string | null} subcommandName
 * @returns {boolean}
 */
function isSubcommandBlocked(commandName, subcommandName) {
  if (!subcommandName) {
    return false;
  }

  if (GLOBAL_BLOCKED_SUBCOMMANDS.has(subcommandName)) {
    return true;
  }

  const commandBlocked = COMMAND_BLOCKED_SUBCOMMANDS[commandName];

  return commandBlocked?.has(subcommandName) ?? false;
}

/**
 * Returns whether a prefix invocation should be rejected.
 * Prefix commands are allowed by default. This function preserves
 * support for optional restrictions if you add them in the future.
 * @param {object} command - Loaded command module
 * @param {string[]} args - Parsed prefix arguments
 * @param {(name: string) => string} resolveSubcommandAlias
 * @returns {{ blocked: boolean, reason?: string }}
 */
export function getPrefixRestriction(
  command,
  args = [],
  resolveSubcommandAlias = (name) => name
) {
  if (!command?.data?.toJSON) {
    return { blocked: false };
  }

  const commandJson = command.data.toJSON();
  const commandName = commandJson.name?.toLowerCase();

  if (!commandName) {
    return { blocked: false };
  }

  if (command.slashOnly === true) {
    return {
      blocked: true,
      reason: 'This command is only available as a slash command.',
    };
  }

  if (SLASH_ONLY_COMMANDS.has(commandName)) {
    return {
      blocked: true,
      reason: 'This command is only available as a slash command.',
    };
  }

  const [firstArg, secondArg] = args.map((arg) =>
    typeof arg === 'string' ? arg.toLowerCase() : null
  );

  const resolvedFirstArg = firstArg
    ? resolveSubcommandAlias(firstArg)
    : null;

  const resolvedSecondArg = secondArg
    ? resolveSubcommandAlias(secondArg)
    : null;

  const subcommandGroup = commandJson.options?.find(
    (option) => option.type === 2
  );

  const allSubcommandNames = collectSubcommandNames(commandJson);

  const allSubcommandsBlocked =
    allSubcommandNames.length > 0 &&
    allSubcommandNames.every((name) =>
      isSubcommandBlocked(commandName, name)
    );

  if (allSubcommandsBlocked) {
    return {
      blocked: true,
      reason: 'This command is only available as a slash command.',
    };
  }

  if (
    resolvedFirstArg &&
    GLOBAL_BLOCKED_SUBCOMMAND_GROUPS.has(resolvedFirstArg)
  ) {
    return {
      blocked: true,
      reason: 'This configuration flow is only available as a slash command.',
    };
  }

  if (
    resolvedFirstArg &&
    isSubcommandBlocked(commandName, resolvedFirstArg)
  ) {
    return {
      blocked: true,
      reason: 'This subcommand is only available as a slash command.',
    };
  }

  if (
    subcommandGroup &&
    resolvedSecondArg &&
    isSubcommandBlocked(commandName, resolvedSecondArg)
  ) {
    return {
      blocked: true,
      reason: 'This subcommand is only available as a slash command.',
    };
  }

  return { blocked: false };
}

/**
 * Convenience function returning only the restriction result.
 * @param {object} command
 * @param {string[]} args
 * @param {(name: string) => string} resolveSubcommandAlias
 * @returns {boolean}
 */
export function isPrefixRestrictedCommand(
  command,
  args = [],
  resolveSubcommandAlias = (name) => name
) {
  return getPrefixRestriction(
    command,
    args,
    resolveSubcommandAlias
  ).blocked;
}
