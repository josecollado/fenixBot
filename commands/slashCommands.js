import { SlashCommandBuilder } from 'discord.js';
import { logger } from '../utils/logger.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

// Create an array of command builders
export const slashCommands = [
    // BuildBouncer command
    {
        data: new SlashCommandBuilder()
            .setName('buildbouncer')
            .setDescription(getCommandConfig('buildBouncer').description),
        cooldown: getCommandConfig('buildBouncer').cooldown
    },

    // Ping command
    {
        data: new SlashCommandBuilder()
            .setName('ping')
            .setDescription(getCommandConfig('ping').description),
        cooldown: getCommandConfig('ping').cooldown
    },

    // Ban command
    {
        data: new SlashCommandBuilder()
            .setName('ban')
            .setDescription(getCommandConfig('ban').description)
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('The user to ban')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription('Reason for the ban')
            ),
        cooldown: getCommandConfig('ban').cooldown
    },

    // Unban command
    {
        data: new SlashCommandBuilder()
            .setName('unban')
            .setDescription(getCommandConfig('unban').description)
            .addStringOption(option =>
                option
                    .setName('userid')
                    .setDescription('The ID of the user to unban')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription('Reason for the unban')
            ),
        cooldown: getCommandConfig('unban').cooldown
    },

    // Kick command
    {
        data: new SlashCommandBuilder()
            .setName('kick')
            .setDescription(getCommandConfig('kick').description)
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('The user to kick')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription('Reason for the kick')
            ),
        cooldown: getCommandConfig('kick').cooldown
    },

    // Timeout command
    {
        data: new SlashCommandBuilder()
            .setName('timeout')
            .setDescription(getCommandConfig('timeout').description)
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('The user to timeout')
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option
                    .setName('duration')
                    .setDescription('Duration in minutes')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription('Reason for the timeout')
            ),
        cooldown: getCommandConfig('timeout').cooldown
    },

    // Untimeout command
    {
        data: new SlashCommandBuilder()
            .setName('untimeout')
            .setDescription(getCommandConfig('untimeout').description)
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('The user to remove timeout from')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription('Reason for removing the timeout')
            ),
        cooldown: getCommandConfig('untimeout').cooldown
    },

    // Purge command
    {
        data: new SlashCommandBuilder()
            .setName('purge')
            .setDescription(getCommandConfig('purge').description)
            .addIntegerOption(option =>
                option
                    .setName('amount')
                    .setDescription('Number of messages to delete (max 100)')
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(100)
            ),
        cooldown: getCommandConfig('purge').cooldown
    },

    // Warn command
    {
        data: new SlashCommandBuilder()
            .setName('warn')
            .setDescription(getCommandConfig('warn').description)
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('The user to warn')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription('Reason for the warning')
                    .setRequired(true)
            ),
        cooldown: getCommandConfig('warn').cooldown
    },

    // Warnings command
    {
        data: new SlashCommandBuilder()
            .setName('warnings')
            .setDescription(getCommandConfig('warnings').description)
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('The user to check warnings for')
                    .setRequired(true)
            ),
        cooldown: getCommandConfig('warnings').cooldown
    },

    // Help command
    {
        data: new SlashCommandBuilder()
            .setName('help')
            .setDescription(getCommandConfig('help').description),
        cooldown: getCommandConfig('help').cooldown
    }
]; 