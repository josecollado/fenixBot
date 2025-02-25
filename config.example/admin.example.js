import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Get current file directory
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load permissions schema from JSON file
const loadPermissionsSchema = () => {
  try {
    const filePath = join(__dirname, 'permissions.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error loading permissions schema:', error);
    return null;
  }
};

// Initialize permissions schema
const permissionsSchema = loadPermissionsSchema();

// Cooldown tracking
const cooldowns = new Map();

const admin = {
  /**
   * Check if a command exists
   * @param {string} commandName
   * @returns {boolean}
   */
  hasCommand(commandName) {
    return Boolean(permissionsSchema?.commands[commandName]);
  },

  /**
   * Check if a role has access to a command
   * @param {string} role
   * @param {string} commandName
   * @returns {boolean}
   */
  roleHasAccess(role, commandName) {
    const command = permissionsSchema?.commands[commandName];
    return command?.roles.includes(role) || command?.public || false;
  },

  /**
   * Check if a user has admin access
   * @param {string} role
   * @returns {boolean}
   */
  isAdmin(role) {
    return role === permissionsSchema?.adminConfig.adminRole || false;
  },

  /**
   * Get command configuration
   * @param {string} commandName
   * @returns {CommandConfig|undefined}
   */
  getCommandConfig(commandName) {
    return permissionsSchema?.commands[commandName];
  },

  /**
   * Check if a user can use a command based on roles and cooldown
   * @param {string} role
   * @param {string} userId
   * @param {string} commandName
   * @returns {{ canUse: boolean, reason?: string }}
   */
  canUseCommand(role, userId, commandName) {
    if (!this.hasCommand(commandName)) {
      return { canUse: false, reason: 'Command does not exist' };
    }

    const command = this.getCommandConfig(commandName);

    // Check if user is admin
    if (this.isAdmin(role)) {
      return { canUse: true };
    }

    // Check if command is public
    if (command.public) {
      return { canUse: true };
    }

    // Check role access
    const hasRoleAccess = this.roleHasAccess(role, commandName);
    if (!hasRoleAccess) {
      return { canUse: false, reason: 'Insufficient permissions' };
    }

    // Check cooldown
    const cooldownResult = this.checkCooldown(userId, commandName);
    if (!cooldownResult.canUse) {
      return cooldownResult;
    }

    return { canUse: true };
  },

  /**
   * Check and update command cooldown
   * @param {string} userId
   * @param {string} commandName
   * @returns {{ canUse: boolean, reason?: string }}
   */
  checkCooldown(userId, commandName) {
    const command = this.getCommandConfig(commandName);
    if (!command?.cooldown || command.cooldown.duration === 0) {
      return { canUse: true };
    }

    const now = Date.now();
    const cooldownKey = `${userId}-${commandName}`;
    const timestamps = cooldowns.get(cooldownKey) || [];

    // Remove expired timestamps
    const validTimestamps = timestamps.filter(
      timestamp => now - timestamp < command.cooldown.duration * 1000
    );

    if (validTimestamps.length >= command.cooldown.usages) {
      const oldestTimestamp = validTimestamps[0];
      const timeLeft = (oldestTimestamp + command.cooldown.duration * 1000 - now) / 1000;
      return {
        canUse: false,
        reason: `Please wait ${timeLeft.toFixed(1)} more seconds before using this command again.`
      };
    }

    // Update cooldown
    validTimestamps.push(now);
    cooldowns.set(cooldownKey, validTimestamps);

    return { canUse: true };
  }
};

export default admin;
