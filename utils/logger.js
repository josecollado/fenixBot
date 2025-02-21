/**
 * Safely stringify objects that may contain BigInt values
 * @param {Object} obj - The object to stringify
 * @returns {string} A JSON string with BigInt values converted to strings
 */
const safeStringify = (obj) => {
    return JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint'
            ? value.toString()
            : value
    );
};

// ANSI color codes for different log levels
const colors = {
    reset: '\x1b[0m',
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warn: '\x1b[33m',    // Yellow
    error: '\x1b[31m',   // Red
    debug: '\x1b[35m',   // Magenta
    system: '\x1b[34m'   // Blue
};

/**
 * Get current timestamp in NY timezone
 * @returns {string} Formatted timestamp
 */
const getTimestamp = () => {
    return new Date().toLocaleString('en-US', { 
        timeZone: 'America/New_York',
        hour12: false 
    });
};

/**
 * Format a log message with timestamp and optional color
 * @param {string} level - Log level
 * @param {string} message - Message to log
 * @param {Object} [data] - Optional data to log
 * @returns {string} Formatted log message
 */
const formatLog = (level, message, data = null) => {
    const timestamp = getTimestamp();
    const color = colors[level.toLowerCase()] || colors.reset;
    let logMessage = `${color}[${level.toUpperCase()}] [${timestamp}] ${message}${colors.reset}`;
    
    if (data) {
        logMessage += '\n' + safeStringify(data);
    }
    
    return logMessage;
};

/**
 * Log an info message
 * @param {string} message - Message to log
 * @param {Object} [data] - Optional data to log
 */
const info = (message, data = null) => {
    console.log(formatLog('info', message, data));
};

/**
 * Log a success message
 * @param {string} message - Message to log
 * @param {Object} [data] - Optional data to log
 */
const success = (message, data = null) => {
    console.log(formatLog('success', message, data));
};

/**
 * Log a warning message
 * @param {string} message - Message to log
 * @param {Object} [data] - Optional data to log
 */
const warn = (message, data = null) => {
    console.log(formatLog('warn', message, data));
};

/**
 * Log an error message
 * @param {string} message - Message to log
 * @param {Object} [data] - Optional data to log
 */
const error = (message, data = null) => {
    console.log(formatLog('error', message, data));
};

/**
 * Log a debug message
 * @param {string} message - Message to log
 * @param {Object} [data] - Optional data to log
 */
const debug = (message, data = null) => {
    if (process.env.DEBUG === 'true') {
        console.log(formatLog('debug', message, data));
    }
};

/**
 * Log a system message
 * @param {string} message - Message to log
 * @param {Object} [data] - Optional data to log
 */
const system = (message, data = null) => {
    console.log(formatLog('system', message, data));
};

/**
 * Log response with status, code, and timestamp
 * @param {string} status - The status of the response
 * @param {string|number} code - The response code
 * @param {Object} response - The response object to log
 */
const logResponse = (status, code, response) => {
    const level = code >= 400 ? 'error' : 'success';
    const message = `Response [${status}] [${code}]`;
    console.log(formatLog(level, message, response));
};

export const logger = {
    safeStringify,
    logResponse,
    info,
    success,
    warn,
    error,
    debug,
    system
}; 