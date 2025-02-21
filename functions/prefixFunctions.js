import { logger } from '../utils/logger.js';
import { PREFIX, commands } from '../commands/prefixCommands.js';
import { createBouncerMessage } from '../actions/bouncer.js';

// Helper function to send DM and notify in channel
const sendResponse = async (message, content) => {
    try {
        await message.author.send(content);
        if (message.guild) {
            await message.reply('Check DMs');
        }
    } catch (error) {
        logger.error('Failed to send DM:', { error: error.message });
        await message.reply('I couldn\'t send you a DM. Please make sure your DMs are open.');
    }
};

// Ping command handler
const handlePing = async (message) => {
    const sent = await message.author.send('Pinging...');
    const latency = sent.createdTimestamp - message.createdTimestamp;
    await sent.edit(`Pong! 🏓\nBot Latency: ${latency}ms\nAPI Latency: ${message.client.ws.ping}ms`);
    
    if (message.guild) {
        await message.reply('Check DMs');
    }
};

// Ban command handler
const handleBan = async (message, args) => {
    if (!message.guild.members.me.permissions.has('BanMembers')) {
        return await sendResponse(message, 'I do not have permission to ban members.');
    }

    const user = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
    if (!user) {
        return await sendResponse(message, 'Please mention a user or provide a valid user ID to ban.');
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
        await message.guild.members.ban(user, { reason });
        await sendResponse(message, `Successfully banned ${user.tag}\nReason: ${reason}`);
        
        logger.info('User banned', {
            user: user.tag,
            reason,
            moderator: message.author.tag
        });
    } catch (error) {
        logger.error('Ban command error:', { error: error.message });
        await sendResponse(message, 'Failed to ban user. Make sure I have the correct permissions and the user is bannable.');
    }
};

// Kick command handler
const handleKick = async (message, args) => {
    if (!message.guild.members.me.permissions.has('KickMembers')) {
        return await sendResponse(message, 'I do not have permission to kick members.');
    }

    const user = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
    if (!user) {
        return await sendResponse(message, 'Please mention a user or provide a valid user ID to kick.');
    }

    const member = await message.guild.members.fetch(user.id);
    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
        await member.kick(reason);
        await sendResponse(message, `Successfully kicked ${user.tag}\nReason: ${reason}`);
        
        logger.info('User kicked', {
            user: user.tag,
            reason,
            moderator: message.author.tag
        });
    } catch (error) {
        logger.error('Kick command error:', { error: error.message });
        await sendResponse(message, 'Failed to kick user. Make sure I have the correct permissions and the user is kickable.');
    }
};

// Timeout command handler
const handleTimeout = async (message, args) => {
    if (!message.guild.members.me.permissions.has('ModerateMembers')) {
        return await sendResponse(message, 'I do not have permission to timeout members.');
    }

    const user = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
    if (!user) {
        return await sendResponse(message, 'Please mention a user or provide a valid user ID to timeout.');
    }

    const duration = parseInt(args[1]);
    if (!duration || isNaN(duration) || duration <= 0) {
        return await sendResponse(message, 'Please provide a valid duration in minutes.');
    }

    const member = await message.guild.members.fetch(user.id);
    const reason = args.slice(2).join(' ') || 'No reason provided';

    try {
        await member.timeout(duration * 60 * 1000, reason);
        await sendResponse(message, `Successfully timed out ${user.tag} for ${duration} minutes\nReason: ${reason}`);
        
        logger.info('User timed out', {
            user: user.tag,
            duration: `${duration} minutes`,
            reason,
            moderator: message.author.tag
        });
    } catch (error) {
        logger.error('Timeout command error:', { error: error.message });
        await sendResponse(message, 'Failed to timeout user. Make sure I have the correct permissions and the user is moderatable.');
    }
};

// Unban command handler
const handleUnban = async (message, args) => {
    if (!message.guild.members.me.permissions.has('BanMembers')) {
        return await sendResponse(message, 'I do not have permission to unban members.');
    }

    const userId = args[0];
    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
        await message.guild.members.unban(userId, reason);
        await sendResponse(message, `Successfully unbanned user with ID: ${userId}\nReason: ${reason}`);
        
        logger.info('User unbanned', {
            userId,
            reason,
            moderator: message.author.tag
        });
    } catch (error) {
        logger.error('Unban command error:', { error: error.message });
        await sendResponse(message, 'Failed to unban user. Make sure the ID is valid and the user is banned.');
    }
};

// Purge command handler
const handlePurge = async (message, args) => {
    if (!message.guild.members.me.permissions.has('ManageMessages')) {
        return;
    }

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount <= 0 || amount > 100) {
        return;
    }

    try {
        const messages = await message.channel.bulkDelete(amount + 1, true); // +1 to include command message
        
        logger.info('Messages purged', {
            amount: messages.size - 1,
            channel: message.channel.name,
            moderator: message.author.tag
        });
    } catch (error) {
        logger.error('Purge command error:', { error: error.message });
    }
};

// Untimeout command handler
const handleUntimeout = async (message, args) => {
    if (!message.guild.members.me.permissions.has('ModerateMembers')) {
        return await sendResponse(message, 'I do not have permission to manage timeouts.');
    }

    const user = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
    if (!user) {
        return await sendResponse(message, 'Please mention a user or provide a valid user ID to remove timeout from.');
    }

    const member = await message.guild.members.fetch(user.id);
    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
        await member.timeout(null, reason);
        await sendResponse(message, `Successfully removed timeout from ${user.tag}\nReason: ${reason}`);
        
        logger.info('Timeout removed', {
            user: user.tag,
            reason,
            moderator: message.author.tag
        });
    } catch (error) {
        logger.error('Untimeout command error:', { error: error.message });
        await sendResponse(message, 'Failed to remove timeout. Make sure I have the correct permissions and the user is moderatable.');
    }
};

// Warn command handler
const handleWarn = async (message, args) => {
    const user = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
    if (!user) {
        return await sendResponse(message, 'Please mention a user or provide a valid user ID to warn.');
    }

    const reason = args.slice(1).join(' ');
    if (!reason) {
        return await sendResponse(message, 'Please provide a reason for the warning.');
    }

    try {
        await sendResponse(message, `Warning issued to ${user.tag}\nReason: ${reason}`);
        
        logger.info('User warned', {
            user: user.tag,
            reason,
            moderator: message.author.tag
        });
    } catch (error) {
        logger.error('Warn command error:', { error: error.message });
        await sendResponse(message, 'Failed to warn user.');
    }
};

// Warnings command handler
const handleWarnings = async (message, args) => {
    const user = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
    if (!user) {
        return await sendResponse(message, 'Please mention a user or provide a valid user ID to check warnings for.');
    }

    try {
        await sendResponse(message, `Warnings for ${user.tag} will be displayed here once the warning system is implemented.`);
    } catch (error) {
        logger.error('Warnings command error:', { error: error.message });
        await sendResponse(message, 'Failed to retrieve warnings.');
    }
};

// BuildBouncer command handler
const handleBuildbouncer = async (message) => {
    try {
        const bouncerMessage = createBouncerMessage();
        await message.channel.send(bouncerMessage);
        
        await message.reply('Bouncer has been created!');
        
        logger.info('Bouncer created', {
            channel: message.channel.name,
            moderator: message.author.tag
        });
    } catch (error) {
        logger.error('Bouncer creation error:', { error: error.message });
        await message.reply('Failed to create bouncer. Make sure I have the correct permissions in this channel.');
    }
};

// Help command handler
const handleHelp = async (message, args) => {
    if (args.length > 0) {
        const commandName = args[0].toLowerCase();
        const command = commands[commandName];
        
        if (command) {
            return await sendResponse(message,
                `**${command.name}**\n` +
                `Description: ${command.description}\n` +
                `Usage: ${command.usage}`
            );
        }
        return await sendResponse(message, 'That command does not exist.');
    }

    const commandList = Object.values(commands).map(cmd => {
        return `**${PREFIX}${cmd.name}**: ${cmd.description}`;
    }).join('\n');

    await sendResponse(message, `Here are all my commands:\n\n${commandList}`);
};

export {
    handlePing,
    handleBan,
    handleKick,
    handleTimeout,
    handleUnban,
    handlePurge,
    handleUntimeout,
    handleWarn,
    handleWarnings,
    handleHelp,
    handleBuildbouncer
};  