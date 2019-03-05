/**
 * Intended for development purposes only. If set to `true`, debug messages will display.
 * @returns {boolean} `true` if debug is enabled, `false` otherwise
 */
function isDebugEnabled() {
    return false;
}

/**
 * Log a debug message or payload to the console (if debug is enabled only).
 * @param {*} payload The message string or payload to log to the console
 */
function debug(payload) {
    if (!isDebugEnabled()) return;
    const output = typeof payload === 'string' ? `[YRF] ${payload}` : payload;
    // eslint-disable-next-line no-console
    console.info(output);
}

/**
 * Check if the provided input is nil (`null` or `undefined`)
 * @param {*} input The input to test
 * @returns {boolean} `true` if the input is nil, `false` otherwise
 */
function isNil(input) {
    return input === null || input === undefined;
}

/**
 * Get the list of selectors to retrieve the channel homepage address from the DOM.
 * Supports both new and old YouTube layouts.
 * @returns {array} List of selectors
 */
function getChannelSelectors() {
    return [
        'yt-formatted-string#owner-name :first-child', // New layout
        '.yt-user-info :first-child', // Old layout
    ];
}

/**
 * Retrieve the YouTube channel URL from the DOM.
 * @returns {(string|null)} The URL of the channel or `null` if not found
 */
function findChannelAddress() {
    debug('Trying to locate the channel URL');
    let channelAddress = null;

    getChannelSelectors().some(channelSelector => {
        const container = window.document.querySelector(channelSelector);
        if (isNil(container)) return false;
        debug(`Successfully located the channel URL as [${container.href}]`);
        channelAddress = container.href;
        return true;
    });

    if (channelAddress === null) debug('Failed to locate the channel URL');
    return channelAddress;
}

// Notify the extension by returning the result
debug('Content script execution was requested');
findChannelAddress();
