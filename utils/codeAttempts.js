import { EmbedBuilder } from 'discord.js';

class CodeAttemptTracker {
    static MAX_ATTEMPTS = 5;

    /**
     * Adds a new attempt and returns all attempts for the user
     * @param {string} userId - The user's ID
     * @param {string} code - The attempted code
     * @param {TextChannel} logChannel - The Discord channel to use for logging
     * @returns {Promise<{count: number, codes: Array, timestamp: Date}>}
     */
    static async addAttempt(userId, code, logChannel) {
        const attempts = await this.getAttempts(userId, logChannel);
        const now = new Date();

        // If this is the first attempt
        if (!attempts) {
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('🔒 Code Entry Tracking')
                .setDescription(`Tracking attempts for <@${userId}>`)
                .addFields({
                    name: 'Attempts',
                    value: `1. \`${code}\` at <t:${Math.floor(now.getTime() / 1000)}:F>`
                })
                .setFooter({ text: `User ID: ${userId} | First Attempt` })
                .setTimestamp(now);

            await logChannel.send({ embeds: [embed] });
            return { count: 1, codes: [{ code, timestamp: now }], timestamp: now };
        }

        // Update existing attempts
        const newCount = attempts.count + 1;
        const newCodes = [...attempts.codes, { code, timestamp: now }];
        
        // Update the tracking message with a new embed
        const trackingMessage = await this.findTrackingMessage(userId, logChannel);
        if (trackingMessage) {
            const oldEmbed = trackingMessage.embeds[0];
            const newEmbed = new EmbedBuilder()
                .setColor(oldEmbed.color)
                .setTitle(oldEmbed.title)
                .setDescription(oldEmbed.description)
                .addFields({
                    name: 'Attempts',
                    value: newCodes
                        .map((c, i) => `${i + 1}. \`${c.code}\` at <t:${Math.floor(c.timestamp.getTime() / 1000)}:F>`)
                        .join('\n')
                })
                .setFooter({ text: oldEmbed.footer.text })
                .setTimestamp(now);

            await trackingMessage.edit({ embeds: [newEmbed] });
        }

        return {
            count: newCount,
            codes: newCodes,
            timestamp: attempts.timestamp
        };
    }

    /**
     * Gets all attempts for a user
     * @param {string} userId - The user's ID
     * @param {TextChannel} logChannel - The Discord channel to search in
     * @returns {Promise<{count: number, codes: Array, timestamp: Date} | null>}
     */
    static async getAttempts(userId, logChannel) {
        const trackingMessage = await this.findTrackingMessage(userId, logChannel);
        if (!trackingMessage) return null;

        const embed = trackingMessage.embeds[0];
        const attempts = embed.fields[0].value
            .split('\n')
            .map(line => {
                const matches = line.match(/`(.+)`.*?at <t:(\d+):/);
                if (matches) {
                    return {
                        code: matches[1],
                        timestamp: new Date(parseInt(matches[2]) * 1000)
                    };
                }
                return null;
            })
            .filter(Boolean);

        return {
            count: attempts.length,
            codes: attempts,
            timestamp: new Date(trackingMessage.createdTimestamp)
        };
    }

    /**
     * Finds the tracking message for a user
     * @param {string} userId - The user's ID
     * @param {TextChannel} logChannel - The Discord channel to search in
     * @returns {Promise<Message | null>}
     */
    static async findTrackingMessage(userId, logChannel) {
        try {
            const messages = await logChannel.messages.fetch({ limit: 100 });
            return messages.find(msg => 
                msg.embeds.length > 0 &&
                msg.embeds[0].title === '🔒 Code Entry Tracking' &&
                msg.embeds[0].footer?.text?.includes(userId)
            );
        } catch (error) {
            console.error('Error finding tracking message:', error);
            return null;
        }
    }

    /**
     * Checks if a user has exceeded the attempt limit
     * @param {string} userId - The user's ID
     * @param {TextChannel} logChannel - The Discord channel to search in
     * @returns {Promise<boolean>}
     */
    static async hasExceededLimit(userId, logChannel) {
        const attempts = await this.getAttempts(userId, logChannel);
        return attempts && attempts.count >= this.MAX_ATTEMPTS;
    }

    /**
     * Clears attempts for a user by marking the tracking message as resolved
     * @param {string} userId - The user's ID
     * @param {TextChannel} logChannel - The Discord channel
     */
    static async clearAttempts(userId, logChannel) {
        const trackingMessage = await this.findTrackingMessage(userId, logChannel);
        if (trackingMessage) {
            const oldEmbed = trackingMessage.embeds[0];
            const newEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Code Tracker Concluded')
                .setDescription(oldEmbed.description)
                .addFields({
                    name: 'Attempts',
                    value: oldEmbed.fields[0].value
                })
                .setFooter({ text: `${oldEmbed.footer.text} | Resolved` })
                .setTimestamp(new Date());

            await trackingMessage.edit({ embeds: [newEmbed] });
        }
    }
}

export default CodeAttemptTracker; 