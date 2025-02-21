import { logger } from '../utils/logger.js';

/**
 * Handles the guildMemberAdd event to automatically assign the RANDO role to new members
 * @param {GuildMember} member - The member who joined the server
 */
async function handleMemberJoin(member) {
    try {
        // Log all available roles for debugging
        const availableRoles = member.guild.roles.cache.map(role => ({
            name: role.name,
            id: role.id,
            position: role.position
        }));
        

        // Get the RANDO role from the guild
        const randoRole = member.guild.roles.cache.find(role => role.name === 'RANDO');
        
        if (!randoRole) {
            logger.error('RANDO role not found in the server. Available roles:', {
                roles: availableRoles.map(r => r.name)
            });
            return;
        }

        // Assign the role to the new member
        await member.roles.add(randoRole);

    } catch (error) {
        logger.error('Error assigning auto-role:', {
            error: error.message,
            errorStack: error.stack,
            user: member.user.tag,
            guildId: member.guild.id
        });
    }
}

export { handleMemberJoin }; 