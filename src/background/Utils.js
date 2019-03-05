/**
 * A class containing various utility functions.
 */
class Utils {
    /**
     * Log a debug message or payload to the console (if debug is enabled only).
     * @param {*} payload The message string or payload to log to the console
     */
    static debug(payload) {
        if (!DEBUG) return;
        if (typeof payload === 'string') {
            // eslint-disable-next-line no-console
            console.info(`[YRF] ${payload}`);
        } else {
            // eslint-disable-next-line no-console
            console.info(payload);
        }
    }

    /**
     * Create an instance of the URL object from an URL string.
     * @param {string} urlString URL in a string format
     * @returns {?URL} The constructed URL object or `null` if the URL is invalid
     */
    static buildUrlObject(urlString) {
        try {
            return new URL(urlString);
        } catch (e) {
            return null;
        }
    }

    /**
     * Check if the provided URL is valid (HTTP-based URL).
     * @param {string} urlString The URL to check
     * @returns {boolean} `true` if the URL is supported, `false` otherwise
     */
    static isValidURL(urlString) {
        const supportedProtocols = ['https:', 'http:'];
        const url = Utils.buildUrlObject(urlString);
        return url === null ? false : supportedProtocols.indexOf(url.protocol) !== -1;
    }
}
