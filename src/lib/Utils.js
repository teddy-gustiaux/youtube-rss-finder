/**
 * Class containing various utility functions.
 */
class Utils {
    /**
     * Intended for development purposes only. If set to `true`, debug messages will display.
     * @returns {boolean} `true` if debug is enabled, `false` otherwise
     */
    static isDebugEnabled() {
        return false;
    }

    /**
     * Log a debug message or payload to the console (only if debug is enabled).
     * @param {*} payload The message string or payload to log to the console
     */
    static debug(payload) {
        if (!Utils.isDebugEnabled()) return;
        const output = typeof payload === 'string' ? `[YRF] ${payload}` : payload;
        // eslint-disable-next-line no-console
        console.info(output);
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

    /**
     * Check if the provided input is nil (`null` or `undefined`)
     * @param {*} input The input to test
     * @returns {boolean} `true` if the input is nil, `false` otherwise
     */
    static isNil(input) {
        return input === null || input === undefined;
    }

    /**
     * Get the list of selectors to retrieve the channel homepage address from the DOM.
     * Supports both new and old YouTube layouts.
     * @returns {array} List of selectors
     */
    static getChannelSelectors() {
        return [
            '.ytp-ce-channel-title.ytp-ce-link', // New layout (faster - test)
            'yt-formatted-string#owner-name :first-child', // New layout
            '.yt-user-info :first-child', // Old layout
        ];
    }

    /**
     * Retrieve the YouTube channel URL from the DOM.
     * @returns {(string|null)} The URL of the channel or `null` if not found
     */
    static findChannelAddress() {
        Utils.debug('Trying to locate the channel URL');
        Utils.debug(`Document ready state: [${document.readyState}]`);
        let channelAddress = null;

        Utils.getChannelSelectors().some(channelSelector => {
            const container = document.querySelector(channelSelector);
            if (Utils.isNil(container)) return false;
            Utils.debug(`Successfully located the channel URL as [${container.href}]`);
            channelAddress = container.href;
            return true;
        });

        if (channelAddress === null) Utils.debug('Failed to locate the channel URL');
        return channelAddress;
    }

    /**
     * Retrieve the current page canonical URL from the DOM.
     * @returns {?string} The canonical URL of the current page or `null` if not found
     */
    static findCanonicalAddress() {
        Utils.debug('Trying to locate the canonical URL');
        const canonicalLink = document.querySelector("link[rel='canonical']");
        if (canonicalLink === null) {
            Utils.debug('Failed to locate the canonical URL');
            return null;
        }
        Utils.debug(`Successfully located the canonical URL as [${canonicalLink.href}]`);
        return canonicalLink.href;
    }
}
