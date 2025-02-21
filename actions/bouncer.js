import { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../utils/logger.js';
import CodeAttemptTracker from '../utils/codeAttempts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load permissions schema
const permissionsSchema = JSON.parse(
    readFileSync(join(__dirname, '../config/permissions.json'), 'utf-8')
);

/**
 * Creates a bouncer embed with interactive buttons
 * @returns {Object} The message options containing the embed and buttons
 */
export function createBouncerMessage() {
    // Create the embed
    const embed = new EmbedBuilder()
        .setColor('#FF4444')
        .setImage('https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZWlld2t0eDI3bjI2aXkxbjJ3MW96c2Qzb2I3Y3o4MTlsb2VodXY1aCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/m9XcY7KSHk6yRRA78C/giphy.gif') 
        .setFooter({ text: 'Press for role or Enter secret code' });

    // Create the buttons
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('suits')
                .setLabel('ProfessionalConnect 👔')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('crypto')
                .setLabel('(₿) Crypto')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('enterCode')
                .setLabel('Enter Code')
                .setStyle(ButtonStyle.Danger),
        );

    return {
        embeds: [embed],
        components: [row]
    };
}

/**
 * Creates a modal for code entry
 * @returns {Modal} The modal for code entry
 */
function createCodeModal() {
    const modal = new ModalBuilder()
        .setCustomId('codeEntryModal')
        .setTitle('Enter Access Code');

    const codeInput = new TextInputBuilder()
        .setCustomId('accessCode')
        .setLabel('Enter your access code')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter code here...')
        .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(codeInput);
    modal.addComponents(firstActionRow);

    return modal;
}

/**
 * Handles assigning roles to a member
 * @param {GuildMember} member The member to assign roles to
 * @param {Array<String>} roleNames Array of role names to assign
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function assignRoles(member, roleNames) {
    try {
        // Find the roles to assign
        const roles = roleNames.map(roleName => 
            member.guild.roles.cache.find(role => role.name === roleName)
        ).filter(role => role);

        if (roles.length === 0) {
            return { 
                success: false, 
                message: 'ERROR CONTACT DEV' 
            };
        }

        // Find the RANDO role
        const randoRole = member.guild.roles.cache.find(role => role.name === 'RANDO');
        
        // Add the new roles first
        await member.roles.add(roles);
        
        // Remove RANDO role if they have it
        if (randoRole && member.roles.cache.has(randoRole.id)) {
            await member.roles.remove(randoRole);
            return { 
                success: true, 
                message: `WELCOME I GAVE YOU THE ROLE:  ${roleNames.join(', ')}` 
            };
        }

        return { 
            success: true, 
            message: `WELCOME I GAVE YOU THE ROLE: ${roleNames.join(', ')}` 
        };
    } catch (error) {
        logger.error('Error managing roles:', { error: error.message, member: member.id });
        return { 
            success: false, 
            message: 'ERROR CONTACT DEV' 
        };
    }
}

/**
 * Handles button interactions for the bouncer
 * @param {ButtonInteraction} interaction The button interaction
 */
export async function handleBouncerButton(interaction) {
    try {
        switch (interaction.customId) {
            case 'suits':
                const suitsResult = await assignRoles(interaction.member, ['SUITS']);
                await interaction.reply({
                    content: suitsResult.message,
                    ephemeral: true
                });
                break;

            case 'crypto':
                const cryptoResult = await assignRoles(interaction.member, ['CRYPTO']);
                await interaction.reply({
                    content: cryptoResult.message,
                    ephemeral: true
                });
                break;

            case 'enterCode':
                await interaction.showModal(createCodeModal());
                break;

            default:
                await interaction.reply({
                    content: 'ERROR CONTACT DEV',
                    ephemeral: true
                });
        }
    } catch (error) {
        logger.error('Button interaction error:', { error: error.message });
        await interaction.reply({
            content: 'ERROR CONTACT DEV',
            ephemeral: true
        });
    }
}

/**
 * Creates a security log embed for failed attempts
 * @param {User} user The user who attempted the code
 * @param {Object} attempts The user's attempt data
 * @returns {EmbedBuilder} The formatted embed
 */
function createSecurityLogEmbed(user, attempts) {
    const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🚨 Security Alert: Multiple Failed Access Attempts')
        .setDescription(`User has been kicked for exceeding maximum code attempts.`)
        .addFields(
            { name: 'User Information', value: `Name: ${user.tag}\nID: ${user.id}` },
            { name: 'Join Date', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>` },
            { name: 'First Attempt', value: `<t:${Math.floor(attempts.timestamp / 1000)}:F>` },
            { name: 'Failed Codes', value: attempts.codes.map(c => `\`${c.code}\` at <t:${Math.floor(c.timestamp / 1000)}:T>`).join('\n') }
        )
        .setTimestamp();

    return embed;
}

/**
 * Handles modal submissions for code entry
 * @param {ModalSubmitInteraction} interaction The modal submission interaction
 */
export async function handleCodeSubmission(interaction) {
    try {
        // Defer the reply to prevent interaction timeout
        await interaction.deferReply({ ephemeral: true });

        const code = interaction.fields.getTextInputValue('accessCode');
        const user = interaction.user;
        const member = interaction.member;
        
        // Get the log channel from permissions.json
        const logChannelId = permissionsSchema.adminConfig['log channel'];
        const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(error => {
            logger.error('Failed to fetch log channel:', { 
                channelId: logChannelId, 
                error: error.message 
            });
            return null;
        });
        
        if (!logChannel) {
            return await interaction.editReply({
                content: 'An error occurred while processing your code. Please contact an administrator.'
            });
        }

        // Track this attempt using the log channel
        const attempts = await CodeAttemptTracker.addAttempt(user.id, code, logChannel);
        const codeConfig = permissionsSchema.adminConfig.codes.find(c => c.code === code);

        if (!codeConfig) {
            // Check if user has exceeded attempt limit
            if (await CodeAttemptTracker.hasExceededLimit(user.id, logChannel)) {
                // Create security log embed
                const securityEmbed = createSecurityLogEmbed(user, attempts);
                
                // Find and notify admin through log channel
                const adminRole = interaction.guild.roles.cache.find(role => role.name === permissionsSchema.adminConfig.adminRole);
                if (adminRole) {
                    // Send a prominent alert to the log channel
                    await logChannel.send({
                        content: `🚨 <@&${adminRole.id}> **SECURITY ALERT** 🚨\n━━━━━━━━━━━━━━━━━━━━━━━━`,
                        embeds: [
                            securityEmbed,
                            new EmbedBuilder()
                                .setColor('#FF0000')
                                .setTitle('🔒 Additional Security Details')
                                .setDescription('User has been automatically kicked for security reasons.')
                                .addFields({
                                    name: 'Action Required',
                                    value: '• Review the failed attempts\n• Check for potential security threats\n• Consider updating access codes if necessary'
                                })
                                .setTimestamp(new Date())
                        ]
                    }).catch(error => {
                        logger.error('Failed to send security alert to log channel:', { error: error.message });
                    });
                }

                // Send the failure message before kicking
                await interaction.editReply({
                    content: '❌❌❌ GOOODBYEEEE ❌❌❌\nYou have exceeded the maximum number of attempts.'
                });
                
                // Kick the user after sending the message
                try {
                    await member.kick('Exceeded maximum code entry attempts');
                    await CodeAttemptTracker.clearAttempts(user.id, logChannel);
                } catch (error) {
                    logger.error('Failed to kick user:', { 
                        userId: user.id, 
                        error: error.message,
                        stack: error.stack 
                    });
                }
                return;
            }
            
            const message = (count) => {
                switch (count) {
                    case 1:
                        return `❌ NOPE TRY AGAIN ❌\nAttempt ${attempts.count}/${CodeAttemptTracker.MAX_ATTEMPTS}`;
                    case 2:
                        return `❌ SWING AND A MISS ❌\nAttempt ${attempts.count}/${CodeAttemptTracker.MAX_ATTEMPTS}`;
                    case 3:
                        return `❌ BOOOOOO ❌\nAttempt ${attempts.count}/${CodeAttemptTracker.MAX_ATTEMPTS}`;
                    case 4:
                        return `❌ YOU GOT ONE MORE CHANCE AFTER THIS ONE ❌\nAttempt ${attempts.count}/${CodeAttemptTracker.MAX_ATTEMPTS}`; 
                    case 5:
                        return `❌❌❌ GOOODBYEEEE ❌❌❌\nAttempted: ${attempts.count}/${CodeAttemptTracker.MAX_ATTEMPTS}`;
                    default:
                        return `❌ Invalid code. Attempt ${attempts.count}/${CodeAttemptTracker.MAX_ATTEMPTS}`;
                }
            };

            await interaction.editReply({
                content: message(attempts.count)
            });
            return;
        }

        // Valid code - mark attempts as resolved
        await CodeAttemptTracker.clearAttempts(user.id, logChannel);
        
        const result = await assignRoles(interaction.member, codeConfig.roles);
        
        // Log successful access
        await logChannel.send({
            embeds: [new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Successful Code Access')
                .setDescription(`User successfully accessed with code.`)
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})` },
                    { name: 'Roles Assigned', value: codeConfig.roles.join(', ') }
                )
                .setTimestamp(new Date())]
        }).catch(error => {
            logger.error('Failed to log successful access:', { error: error.message });
        });
        
        await interaction.editReply({
            content: result.message
        });

    } catch (error) {
        logger.error('Code submission error:', { 
            error: error.message,
            stack: error.stack,
            user: interaction.user?.id,
            code: interaction.fields?.getTextInputValue('accessCode')
        });

        // Ensure we always respond to the interaction
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'An error occurred while processing your code. Please try again later.',
                    ephemeral: true
                });
            } else {
                await interaction.editReply({
                    content: 'An error occurred while processing your code. Please try again later.'
                });
            }
        } catch (replyError) {
            logger.error('Failed to send error response:', {
                error: replyError.message,
                originalError: error.message
            });
        }
    }
} 