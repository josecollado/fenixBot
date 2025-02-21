import { logger } from '../utils/logger.js';
import { slashCommands } from '../commands/slashCommands.js';
import { createBouncerMessage } from '../actions/bouncer.js';

// Ping command handler
const handlePing = async (interaction) => {
    const sent = await interaction.reply({ 
        content: 'Pinging...', 
        fetchReply: true,
        // ephemeral: true
    });
    
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply({
        content: `Pong! 🏓\nBot Latency: ${latency}ms\nAPI Latency: ${interaction.client.ws.ping}ms`,
        // ephemeral: true
    });
};

// Ban command handler
const handleBan = async (interaction) => {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!interaction.guild.members.me.permissions.has('BanMembers')) {
        return await interaction.reply({
            content: 'I do not have permission to ban members.',
            ephemeral: true
        });
    }

    try {
        await interaction.deferReply({ ephemeral: true });
        await interaction.guild.members.ban(user, { reason });
        await interaction.editReply({
            content: `Successfully banned ${user.tag}\nReason: ${reason}`,
            ephemeral: true
        });
        
        logger.info('User banned', {
            user: user.tag,
            reason,
            moderator: interaction.user.tag
        });
    } catch (error) {
        logger.error('Ban command error:', { error: error.message });
        await interaction.editReply({
            content: 'Failed to ban user. Make sure I have the correct permissions and the user is bannable.',
            ephemeral: true
        });
    }
};

// Kick command handler
const handleKick = async (interaction) => {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id);

    if (!interaction.guild.members.me.permissions.has('KickMembers')) {
        return await interaction.reply({
            content: 'I do not have permission to kick members.',
            ephemeral: true
        });
    }

    try {
        await interaction.deferReply({ ephemeral: true });
        await member.kick(reason);
        await interaction.editReply({
            content: `Successfully kicked ${user.tag}\nReason: ${reason}`,
            ephemeral: true
        });
        
        logger.info('User kicked', {
            user: user.tag,
            reason,
            moderator: interaction.user.tag
        });
    } catch (error) {
        logger.error('Kick command error:', { error: error.message });
        await interaction.editReply({
            content: 'Failed to kick user. Make sure I have the correct permissions and the user is kickable.',
            ephemeral: true
        });
    }
};

// Timeout command handler
const handleTimeout = async (interaction) => {
    const user = interaction.options.getUser('user');
    const duration = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id);

    if (!interaction.guild.members.me.permissions.has('ModerateMembers')) {
        return await interaction.reply({
            content: 'I do not have permission to timeout members.',
            ephemeral: true
        });
    }

    try {
        await interaction.deferReply({ ephemeral: true });
        await member.timeout(duration * 60 * 1000, reason);
        await interaction.editReply({
            content: `Successfully timed out ${user.tag} for ${duration} minutes\nReason: ${reason}`,
            ephemeral: true
        });
        
        logger.info('User timed out', {
            user: user.tag,
            duration: `${duration} minutes`,
            reason,
            moderator: interaction.user.tag
        });
    } catch (error) {
        logger.error('Timeout command error:', { error: error.message });
        await interaction.editReply({
            content: 'Failed to timeout user. Make sure I have the correct permissions and the user is moderatable.',
            ephemeral: true
        });
    }
};

// Unban command handler
const handleUnban = async (interaction) => {
    const userId = interaction.options.getString('userid');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!interaction.guild.members.me.permissions.has('BanMembers')) {
        return await interaction.reply({
            content: 'I do not have permission to unban members.',
            ephemeral: true
        });
    }

    try {
        await interaction.guild.members.unban(userId, reason);
        await interaction.reply({
            content: `Successfully unbanned user with ID: ${userId}\nReason: ${reason}`,
            ephemeral: true
        });
        
        logger.info('User unbanned', {
            userId,
            reason,
            moderator: interaction.user.tag
        });
    } catch (error) {
        logger.error('Unban command error:', { error: error.message });
        await interaction.reply({
            content: 'Failed to unban user. Make sure the ID is valid and the user is banned.',
            ephemeral: true
        });
    }
};

// Purge command handler
const handlePurge = async (interaction) => {
    if (!interaction.guild.members.me.permissions.has('ManageMessages')) {
        return await interaction.deferReply().then(() => interaction.deleteReply());
    }

    const amount = interaction.options.getInteger('amount');
    if (amount <= 0 || amount > 100) {
        return await interaction.deferReply().then(() => interaction.deleteReply());
    }

    try {
        // Acknowledge silently and delete the acknowledgment
        await interaction.deferReply().then(() => interaction.deleteReply());
        
        const messages = await interaction.channel.bulkDelete(amount, true);
        
        logger.info('Messages purged', {
            amount: messages.size,
            channel: interaction.channel.name,
            moderator: interaction.user.tag
        });
    } catch (error) {
        logger.error('Purge command error:', { error: error.message });
    }
};

// Untimeout command handler
const handleUntimeout = async (interaction) => {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id);

    if (!interaction.guild.members.me.permissions.has('ModerateMembers')) {
        return await interaction.reply({
            content: 'I do not have permission to manage timeouts.',
            ephemeral: true
        });
    }

    try {
        await member.timeout(null, reason);
        await interaction.reply({
            content: `Successfully removed timeout from ${user.tag}\nReason: ${reason}`,
            ephemeral: true
        });
        
        logger.info('Timeout removed', {
            user: user.tag,
            reason,
            moderator: interaction.user.tag
        });
    } catch (error) {
        logger.error('Untimeout command error:', { error: error.message });
        await interaction.reply({
            content: 'Failed to remove timeout. Make sure I have the correct permissions and the user is moderatable.',
            ephemeral: true
        });
    }
};

// Warn command handler
const handleWarn = async (interaction) => {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    // Note: This is a placeholder. You'll need to implement a warning system
    // that stores warnings in a database
    try {
        await interaction.reply({
            content: `Warning issued to ${user.tag}\nReason: ${reason}`,
            ephemeral: true
        });
        
        logger.info('User warned', {
            user: user.tag,
            reason,
            moderator: interaction.user.tag
        });
    } catch (error) {
        logger.error('Warn command error:', { error: error.message });
        await interaction.reply({
            content: 'Failed to warn user.',
            ephemeral: true
        });
    }
};

// Warnings command handler
const handleWarnings = async (interaction) => {
    const user = interaction.options.getUser('user');

    // Note: This is a placeholder. You'll need to implement a warning system
    // that retrieves warnings from a database
    try {
        await interaction.reply({
            content: `Warnings for ${user.tag} will be displayed here once the warning system is implemented.`,
            ephemeral: true
        });
    } catch (error) {
        logger.error('Warnings command error:', { error: error.message });
        await interaction.reply({
            content: 'Failed to retrieve warnings.',
            ephemeral: true
        });
    }
};

// Help command handler
const handleHelp = async (interaction) => {
    const commandList = slashCommands.map(cmd => {
        return `**/${cmd.data.name}**: ${cmd.data.description}`;
    }).join('\n');

    await interaction.reply({
        content: `Here are all my commands:\n\n${commandList}`,
        ephemeral: true
    });
};

// BuildBouncer command handler
const handleBuildbouncer = async (interaction) => {
    try {
        const bouncerMessage = createBouncerMessage();
        await interaction.channel.send(bouncerMessage);
        
        await interaction.reply({
            content: 'Bouncer has been created!',
            ephemeral: true
        });
        
        logger.info('Bouncer created', {
            channel: interaction.channel.name,
            moderator: interaction.user.tag
        });
    } catch (error) {
        logger.error('Bouncer creation error:', { error: error.message });
        await interaction.reply({
            content: 'Failed to create bouncer. Make sure I have the correct permissions in this channel.',
            ephemeral: true
        });
    }
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