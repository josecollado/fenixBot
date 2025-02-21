import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { logger } from './logger.js';
import { slashCommands } from '../commands/slashCommands.js';
import { fileURLToPath } from 'url';

// Ensure environment variables are loaded
config();

// Update these to match your .env file names
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!DISCORD_TOKEN || !CLIENT_ID) {
    logger.error('Missing required environment variables:', {
        hasToken: !!DISCORD_TOKEN,
        hasClientId: !!CLIENT_ID
    });
    throw new Error('Missing required environment variables');
}

const rest = new REST().setToken(DISCORD_TOKEN);

export async function deployCommands() {
    try {
        const commands = slashCommands.map(command => command.data.toJSON());

        logger.info('Deploying slash commands...');

        const data = await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );

        logger.success(`Successfully loaded ${data.length} slash(/) commands.`);
    } catch (error) {
        logger.error('Error deploying commands:', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

// If running this file directly
if (import.meta.url === fileURLToPath(import.meta.url)) {
    deployCommands();
}

export default deployCommands; 