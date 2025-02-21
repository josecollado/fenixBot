import { logger } from './logger.js';
import { EmbedBuilder } from 'discord.js';

// Error types enum
export const ErrorType = {
    COMMAND: 'CommandError',
    PERMISSION: 'PermissionError',
    API: 'APIError',
    DATABASE: 'DatabaseError',
    RATE_LIMIT: 'RateLimitError',
    VALIDATION: 'ValidationError',
    INTERNAL: 'InternalError'
};

// Error severity levels
export const ErrorSeverity = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

/**
 * Create a standardized error response embed
 * @param {Error} error - The error object
 * @param {string} type - Error type from ErrorType enum
 * @param {string} severity - Error severity from ErrorSeverity enum
 * @returns {EmbedBuilder} Discord embed with error details
 */
const createErrorEmbed = (error, type, severity) => {
    const embed = new EmbedBuilder()
        .setColor(severity === ErrorSeverity.CRITICAL ? '#ff0000' : '#ff9900')
        .setTitle('Error Occurred')
        .setDescription(error.message)
        .addFields(
            { name: 'Type', value: type, inline: true },
            { name: 'Severity', value: severity, inline: true }
        )
        .setTimestamp();

    if (process.env.NODE_ENV === 'development') {
        embed.addFields({ name: 'Stack Trace', value: `\`\`\`${error.stack}\`\`\`` });
    }

    return embed;
};

/**
 * Handle command execution errors
 * @param {Error} error - The error object
 * @param {Object} context - Command execution context
 * @returns {Promise<void>}
 */
export const handleCommandError = async (error, context) => {
    const { interaction, command, user } = context;
    
    logger.error('Command execution error:', {
        command: command?.name || 'Unknown',
        user: user?.tag || 'Unknown',
        error: error.message,
        stack: error.stack
    });

    const errorEmbed = createErrorEmbed(
        error,
        ErrorType.COMMAND,
        ErrorSeverity.MEDIUM
    );

    try {
        if (interaction?.replied) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else if (interaction?.deferred) {
            await interaction.editReply({ embeds: [errorEmbed] });
        } else if (interaction) {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    } catch (followUpError) {
        logger.error('Error sending error message:', {
            error: followUpError.message,
            originalError: error.message
        });
    }
};

/**
 * Handle permission-related errors
 * @param {Error} error - The error object
 * @param {Object} context - Permission check context
 * @returns {Promise<void>}
 */
export const handlePermissionError = async (error, context) => {
    const { interaction, command, user, requiredPermissions } = context;

    logger.error('Permission error:', {
        command: command?.name || 'Unknown',
        user: user?.tag || 'Unknown',
        requiredPermissions,
        error: error.message
    });

    const errorEmbed = createErrorEmbed(
        error,
        ErrorType.PERMISSION,
        ErrorSeverity.LOW
    );

    try {
        await interaction.reply({
            embeds: [errorEmbed],
            ephemeral: true
        });
    } catch (replyError) {
        logger.error('Error sending permission error message:', {
            error: replyError.message,
            originalError: error.message
        });
    }
};

/**
 * Handle API-related errors
 * @param {Error} error - The error object
 * @param {Object} context - API call context
 * @returns {Promise<void>}
 */
export const handleAPIError = async (error, context) => {
    const { endpoint, params } = context;

    logger.error('API error:', {
        endpoint,
        params,
        error: error.message,
        stack: error.stack
    });

    // Implement API error recovery logic here
    // For example: retry logic, fallback behavior, etc.
};

/**
 * Global error handler for uncaught exceptions
 * @param {Error} error - The uncaught error
 */
export const handleUncaughtError = (error) => {
    logger.error('Uncaught exception:', {
        error: error.message,
        stack: error.stack,
        type: ErrorType.INTERNAL,
        severity: ErrorSeverity.CRITICAL
    });

    // Implement recovery logic or graceful shutdown if needed
    if (error.severity === ErrorSeverity.CRITICAL) {
        logger.error('Critical error occurred, initiating graceful shutdown...');
        process.exit(1);
    }
};

/**
 * Handle rate limit errors
 * @param {Error} error - The rate limit error
 * @param {Object} context - Rate limit context
 */
export const handleRateLimitError = async (error, context) => {
    const { interaction, command, retryAfter } = context;

    logger.warn('Rate limit hit:', {
        command: command?.name || 'Unknown',
        retryAfter,
        error: error.message
    });

    const errorEmbed = createErrorEmbed(
        error,
        ErrorType.RATE_LIMIT,
        ErrorSeverity.LOW
    ).setDescription(`This command is rate limited. Please try again in ${retryAfter} seconds.`);

    try {
        await interaction.reply({
            embeds: [errorEmbed],
            ephemeral: true
        });
    } catch (replyError) {
        logger.error('Error sending rate limit message:', {
            error: replyError.message,
            originalError: error.message
        });
    }
}; 