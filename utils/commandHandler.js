import { checkCooldown } from './cooldown.js';
import { logger } from './logger.js';
import * as slashFunctions from '../functions/slashFunctions.js';
import * as prefixFunctions from '../functions/prefixFunctions.js';
import { PREFIX, commands as prefixCommands } from '../commands/prefixCommands.js';
import admin from '../config/admin.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// Import InteractionResponseFlags properly for CommonJS module
import pkg from 'discord.js';
const { InteractionResponseFlags } = pkg;

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load permissions schema
const permissionsSchema = JSON.parse(
    readFileSync(join(__dirname, '../config/permissions.json'), 'utf-8')
);

// Handle slash commands
async function handleSlashCommand(interaction) {
    const commandName = interaction.commandName;
    const handler = slashFunctions[`handle${capitalizeFirstLetter(commandName)}`];

    if (!handler) {
        logger.error('No handler found for slash command:', { 
            commandName,
            availableHandlers: Object.keys(slashFunctions)
        });
        return await interaction.reply({
            content: 'This command is not implemented yet.',
            flags: InteractionResponseFlags.Ephemeral
        });
    }

    // Get user's role and check permissions
    const userRoles = interaction.member.roles.cache.map(role => role.name);
    const permissionRole = userRoles.find(role => permissionsSchema.adminConfig.rolesTotal.includes(role));
    
    const { canUse, reason } = admin.canUseCommand(permissionRole, interaction.user.id, commandName);
    
    if (!canUse) {
        return await interaction.reply({
            content: reason || 'You do not have permission to use this command.',
            flags: InteractionResponseFlags.Ephemeral
        });
    }

    try {
        await handler(interaction);
    } catch (error) {
        logger.error('Slash command execution error:', {
            command: commandName,
            error: error.message,
            stack: error.stack
        });

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: 'There was an error executing this command.',
                flags: InteractionResponseFlags.Ephemeral
            });
        }
    }
}

// Handle prefix commands
async function handlePrefixCommand(message) {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = prefixCommands[commandName];

    if (!command) return;

    // Get user's role and check permissions
    const userRoles = message.member.roles.cache.map(role => role.name);
    const permissionRole = userRoles.find(role => permissionsSchema.adminConfig.rolesTotal.includes(role));
    
    const { canUse, reason } = admin.canUseCommand(permissionRole, message.author.id, commandName);
    
    if (!canUse) {
        return message.reply(reason || 'You do not have permission to use this command.');
    }

    // Check if command requires arguments
    if (command.args && args.length < command.minArgs) {
        return message.reply(
            `Invalid command usage!\nCorrect usage: ${command.usage}`
        );
    }

    // Check cooldown
    const cooldownTime = checkCooldown(
        message.author.id,
        commandName,
        command.cooldown.duration
    );

    if (cooldownTime) {
        return message.reply(
            `Please wait ${cooldownTime} seconds before using this command again.`
        );
    }

    const handler = prefixFunctions[`handle${capitalizeFirstLetter(commandName)}`];

    if (!handler) {
        logger.error('No handler found for prefix command:', { commandName });
        return message.reply('This command is not implemented yet.');
    }

    try {
        await handler(message, args);
    } catch (error) {
        logger.error('Prefix command execution error:', {
            command: commandName,
            error: error.message,
            stack: error.stack
        });
        await message.reply('There was an error executing this command.');
    }
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export { handleSlashCommand, handlePrefixCommand }; 