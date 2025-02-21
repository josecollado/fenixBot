import { logger } from '../utils/logger.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const PREFIX = '//';

// Helper function to get command config
const getCommandConfig = (commandName) => {
    try {
        const configPath = join(__dirname, '../config/permissions.json');
        const config = JSON.parse(readFileSync(configPath, 'utf8'));
        return config.commands[commandName] || {
            description: 'No description available',
            cooldown: { duration: 3, type: 'user', usages: 1 }
        };
    } catch (error) {
        logger.error('Error loading command config:', { error: error.message });
        return {
            description: 'No description available',
            cooldown: { duration: 3, type: 'user', usages: 1 }
        };
    }
};

// Command configurations
export const commands = {
    // BuildBouncer command
    buildBouncer: {
        name: 'buildbouncer',
        description: getCommandConfig('buildBouncer').description,
        cooldown: getCommandConfig('buildBouncer').cooldown,
        usage: `${PREFIX}buildbouncer`,
        args: false,
        minArgs: 0
    },

    // Ping command
    ping: {
        name: 'ping',
        description: getCommandConfig('ping').description,
        cooldown: getCommandConfig('ping').cooldown,
        usage: `${PREFIX}ping`,
        args: false
    },

    // Ban command
    ban: {
        name: 'ban',
        description: getCommandConfig('ban').description,
        cooldown: getCommandConfig('ban').cooldown,
        usage: `${PREFIX}ban <user> [reason]`,
        args: true,
        minArgs: 1
    },

    // Unban command
    unban: {
        name: 'unban',
        description: getCommandConfig('unban').description,
        cooldown: getCommandConfig('unban').cooldown,
        usage: `${PREFIX}unban <userId> [reason]`,
        args: true,
        minArgs: 1
    },

    // Kick command
    kick: {
        name: 'kick',
        description: getCommandConfig('kick').description,
        cooldown: getCommandConfig('kick').cooldown,
        usage: `${PREFIX}kick <user> [reason]`,
        args: true,
        minArgs: 1
    },

    // Timeout command
    timeout: {
        name: 'timeout',
        description: getCommandConfig('timeout').description,
        cooldown: getCommandConfig('timeout').cooldown,
        usage: `${PREFIX}timeout <user> <duration> [reason]`,
        args: true,
        minArgs: 2
    },

    // Untimeout command
    untimeout: {
        name: 'untimeout',
        description: getCommandConfig('untimeout').description,
        cooldown: getCommandConfig('untimeout').cooldown,
        usage: `${PREFIX}untimeout <user> [reason]`,
        args: true,
        minArgs: 1
    },

    // Purge command
    purge: {
        name: 'purge',
        description: getCommandConfig('purge').description,
        cooldown: getCommandConfig('purge').cooldown,
        usage: `${PREFIX}purge <amount>`,
        args: true,
        minArgs: 1
    },

    // Warn command
    warn: {
        name: 'warn',
        description: getCommandConfig('warn').description,
        cooldown: getCommandConfig('warn').cooldown,
        usage: `${PREFIX}warn <user> <reason>`,
        args: true,
        minArgs: 2
    },

    // Warnings command
    warnings: {
        name: 'warnings',
        description: getCommandConfig('warnings').description,
        cooldown: getCommandConfig('warnings').cooldown,
        usage: `${PREFIX}warnings <user>`,
        args: true,
        minArgs: 1
    },

    // Help command
    help: {
        name: 'help',
        description: getCommandConfig('help').description,
        cooldown: getCommandConfig('help').cooldown,
        usage: `${PREFIX}help [command]`,
        args: false
    }
}; 