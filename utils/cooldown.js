import { Collection } from 'discord.js';

// Create a collection to store cooldowns
const cooldowns = new Collection();

/**
 * Check if a command is on cooldown
 * @param {string} userId - The user's ID
 * @param {string} commandName - The command name
 * @param {number} cooldownSeconds - Cooldown duration in seconds
 * @returns {number|false} - Returns remaining seconds if on cooldown, false otherwise
 */
export function checkCooldown(userId, commandName, cooldownSeconds = 3) {
    const key = `${userId}-${commandName}`;
    const now = Date.now();
    
    if (cooldowns.has(key)) {
        const expirationTime = cooldowns.get(key) + (cooldownSeconds * 1000);
        if (now < expirationTime) {
            return Math.ceil((expirationTime - now) / 1000);
        }
    }
    
    cooldowns.set(key, now);
    setTimeout(() => cooldowns.delete(key), cooldownSeconds * 1000);
    return false;
} 