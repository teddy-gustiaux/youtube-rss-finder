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
 * Retrieve the current page canonical URL from the DOM.
 * @returns {?string} The canonical URL of the current page or `null` if not found
 */
function findCanonicalAddress() {
    debug('Trying to locate the canonical URL');
    const canonicalLink = document.querySelector("link[rel='canonical']");
    if (canonicalLink === null) {
        debug('Failed to locate the canonical URL');
        return null;
    }
    debug(`Successfully located the canonical URL as [${canonicalLink.href}]`);
    return canonicalLink.href;
}

// Notify the extension by returning the result
debug('Content script execution was requested');
findCanonicalAddress();
