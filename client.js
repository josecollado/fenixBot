import { Client, GatewayIntentBits, Collection } from 'discord.js';
import * as dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { handleSlashCommand, handlePrefixCommand } from './utils/commandHandler.js';
import { slashCommands } from './commands/slashCommands.js';
import { deployCommands } from './utils/deploy-commands.js';
import { handleUncaughtError, handleCommandError, ErrorType, ErrorSeverity } from './utils/errorHandler.js';
import { handleMemberJoin } from './events/memberJoin.js';

// Load environment variables
dotenv.config();

// Create new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildModeration
    ]
});

// Store slash commands for quick access
client.commands = new Collection();

// Load slash commands into collection
for (const command of slashCommands) {
    if ('data' in command && command.data) {
        client.commands.set(command.data.name, command);
    } else {
        logger.warn('Invalid slash command configuration');
    }
}

// Handle interactions
client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isCommand()) {
            await handleSlashCommand(interaction);
        } else if (interaction.isModalSubmit() && interaction.customId === 'codeEntryModal') {
            const { handleCodeSubmission } = await import('./actions/bouncer.js');
            await handleCodeSubmission(interaction);
        } else if (interaction.isButton()) {
            const { handleBouncerButton } = await import('./actions/bouncer.js');
            await handleBouncerButton(interaction);
        }
    } catch (error) {
        await handleCommandError(error, {
            interaction,
            command: interaction.isCommand() ? client.commands.get(interaction.commandName) : null,
            user: interaction.user
        });
    }
});

// Handle prefix commands
client.on('messageCreate', async message => {
    try {
        await handlePrefixCommand(message);
    } catch (error) {
        await handleCommandError(error, {
            message,
            command: message.content.split(' ')[0],
            user: message.author
        });
    }
});

// Handle ready event
client.once('ready', async () => {
    try {
        logger.info(`DISCORD_BOT: online`);

        // Deploy slash commands on startup
        await deployCommands();
    } catch (error) {
        handleUncaughtError({
            ...error,
            severity: ErrorSeverity.HIGH
        });
    }
});

// Handle Discord client errors
client.on('error', error => {
    handleUncaughtError({
        ...error,
        severity: ErrorSeverity.HIGH,
        type: ErrorType.INTERNAL
    });
});


// Handle debug messages in development
if (process.env.NODE_ENV === 'development') {
    client.on('debug', debug => {
        logger.debug('Discord client debug:', { debug });
    });
}

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
    handleUncaughtError({
        message: 'Unhandled Promise Rejection',
        stack: reason instanceof Error ? reason.stack : new Error(String(reason)).stack,
        severity: ErrorSeverity.HIGH,
        type: ErrorType.INTERNAL,
        reason,
        promise
    });
});

process.on('uncaughtException', error => {
    handleUncaughtError({
        ...error,
        severity: ErrorSeverity.CRITICAL,
        type: ErrorType.INTERNAL
    });
});

// Graceful shutdown handler
const handleGracefulShutdown = async (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    
    try {
        // Cleanup tasks
        client.destroy();
        logger.info('Discord client destroyed successfully');
        
        // Additional cleanup (e.g., database connections, etc.)
        
        process.exit(0);
    } catch (error) {
        logger.error('Error during graceful shutdown:', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
};

// Handle termination signals
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

// Handle member join event
client.on('guildMemberAdd', async member => {
    try {
        await handleMemberJoin(member);
    } catch (error) {
        handleUncaughtError({
            ...error,
            severity: ErrorSeverity.HIGH,
            type: ErrorType.INTERNAL
        });
    }
});

// Login to Discord
try {
    await client.login(process.env.DISCORD_TOKEN);
    logger.info('Logging in to BOT...');
    if (client.user) {
        logger.success(`BOT_LOGIN: success`);
    }
} catch (error) {
    handleUncaughtError({
        ...error,
        severity: ErrorSeverity.CRITICAL,
        type: ErrorType.INTERNAL
    });
    process.exit(1);
}
