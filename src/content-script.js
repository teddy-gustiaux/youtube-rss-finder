/**
 * List of selectors to retrieve the channel homepage address from the DOM.
 * Supports both new and old YouTube layouts.
 * @type {Array}
 */
const CHANNEL_URL_SELECTORS = [
    'yt-formatted-string#owner-name :first-child',
    '.yt-user-info :first-child',
];

/**
 * Check if the provided input is nil (`null` or `undefined`)
 * @param {*} input The input to test
 * @returns {boolean} `true` if the input is nil, `false` otherwise
 */
function isNil(input) {
    return input === null || input === undefined;
}

/**
 * Retrieve the YouTube channel URL from the DOM.
 * @returns {(string|null)} The URL of the channel or `null` if not found
 */
function findChannelAddress() {
    let channelAddress = null;
    // eslint-disable-next-line
    for (let urlSelector of CHANNEL_URL_SELECTORS) {
        if (!isNil(channelAddress)) break;
        const container = window.document.querySelector(urlSelector);
        if (!isNil(container)) channelAddress = container.href;
    }
    return channelAddress;
}

// Notify the extension by returning the found URL
findChannelAddress();
