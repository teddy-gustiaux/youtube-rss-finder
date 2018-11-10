/**
 * Retrieve the YouTube channel URL from the DOM.
 * @returns {(string|null)} The URL of the channel or `null` if not found
 */
function findChannelAddress() {
    const ELEMENT = 'yt-formatted-string';
    const ID = 'owner-name';
    const container = window.document.querySelector(`${ELEMENT}#${ID}`);
    if (container !== undefined && container.firstChild.href !== undefined) {
        return container.firstChild.href;
    }
    return null;
}

// Notify the extension by returning the found URL
findChannelAddress();
