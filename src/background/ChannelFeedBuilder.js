/**
 * A class containing the logic to build the RSS feed of a YouTube channel from a given page.
 * For more information regarding channel addresses, please see the links below.
 * @see {@link https://support.google.com/youtube/answer/6180214 Understand your channel URLs}
 * @see {@link https://support.google.com/youtube/answer/2657968 Get a custom URL for your channel}
 */
class ChannelFeedBuilder {
    /**
     * Create a channel feed builder for the given page.
     * @param {number} tabID The ID of the current tab
     * @param {URL} url The URL object representing the current page
     */
    constructor(tabId, url) {
        /** @type {number} The ID of the current tab */
        this.tabId = tabId;
        /** @type {URL} The URL of the current page */
        this.url = url;
        /** @type {?URL} The URL of the channel */
        this.channelAddress = null;
        /** @type {?string} The unique identifier of the channel (legacy user ID or channel ID) */
        this.channelIdentifier = null;
    }

    /**
     * Execute a content script and return the result as an URL object.
     * @param {string} file Path to the content script file to be executed
     * @returns {?URL} URL object created from the content script result or `null` in case of error
     */
    static async executeContentScript(file) {
        const scriptResults = await browser.tabs.executeScript(this.tabId, {
            file,
            runAt: 'document_idle',
        });
        return Utils.buildUrlObject(scriptResults[0]);
    }

    /**
     * Get the address of the channel of the current page from the DOM.
     * The address channel can be based on the legacy user ID or the channel ID.
     * @returns {?URL} URL object representing the channel address or `null` in case of error
     */
    static async getChannelAddressfromDOM() {
        Utils.debug('Requesting the channel address from the DOM');
        return ChannelFeedBuilder.executeContentScript('/content-scripts/get-channel-url.js');
    }

    /**
     * Get the canonical address of the channel of the current page from the DOM.
     * The canonical address is always based on the channel ID.
     * @returns {?URL} URL object representing the channel address or `null` in case of error
     */
    static async getCanonicalAddressfromDOM() {
        Utils.debug('Requesting the canonical address from the DOM');
        return ChannelFeedBuilder.executeContentScript('/content-scripts/get-canonical-url.js');
    }

    /**
     * Retrieve the address of the channel of the current page, and set the associated property.
     * If an error happened, the internal property will be set to `null`.
     * @returns {ChannelFeedBuilder} Instance of the class, in order to chain methods
     */
    async getChannelAddress() {
        const parts = this.url.pathname.split('/');
        const firstPathnamePart = parts.length >= 2 ? parts[1] : '';
        switch (firstPathnamePart) {
            case 'user':
                this.channelAddress = this.url;
                break;
            case 'channel':
                this.channelAddress = this.url;
                break;
            case 'watch':
                this.channelAddress = await ChannelFeedBuilder.getChannelAddressfromDOM();
                break;
            default:
                this.channelAddress = await ChannelFeedBuilder.getCanonicalAddressfromDOM();
                break;
        }
        Utils.debug(`Channel address set to [${this.channelAddress}]`);
        return this;
    }

    /**
     * Build the unique identifier of the found channel, and set the associated property.
     * If an error happened, the internal property will be set to `null`.
     * @returns {ChannelFeedBuilder} Instance of the class, in order to chain methods
     */
    buildChannelIdentifier() {
        const parts = this.channelAddress !== null ? this.channelAddress.pathname.split('/') : [];
        const firstPathnamePart = parts.length >= 2 ? parts[1] : '';
        switch (firstPathnamePart) {
            case 'channel':
                this.channelIdentifier = `channel_id=${parts[2]}`;
                break;
            case 'user':
                this.channelIdentifier = `user=${parts[2]}`;
                break;
            default:
                this.channelIdentifier = null;
                break;
        }
        Utils.debug(`Channel identifier set to [${this.channelIdentifier}]`);
        return this;
    }

    /**
     * Build the RSS feed of the channel from the built unique identifier.
     * @returns {?string} The channel RSS feed, or `null` if an error happened
     */
    buildChannelFeed() {
        return this.channelIdentifier !== null
            ? `https://www.youtube.com/feeds/videos.xml?${this.channelIdentifier}`
            : null;
    }
}
