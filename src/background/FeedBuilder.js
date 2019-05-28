/**
 * Class to build the RSS feed of a YouTube channel or a playlist from a given page.
 * For more information regarding channel addresses, please see the links below.
 * @see {@link https://support.google.com/youtube/answer/6180214 Understand your channel URLs}
 * @see {@link https://support.google.com/youtube/answer/2657968 Get a custom URL for your channel}
 */
class FeedBuilder {
    /**
     * Create a feed builder for the given page.
     * @param {number} tabID The ID of the current tab
     * @param {URL} url The URL object representing the current page
     */
    constructor(tabId, url) {
        /** @type {number} The ID of the current tab */
        this.tabId = tabId;
        /** @type {URL} The URL of the current page */
        this.currentUrl = url;
        /** @type {?URL} The URL of the channel or the playlist */
        this.contentAddress = null;
        /** @type {?string} The unique identifier of the channel (legacy user ID or channel ID) or the playlist */
        this.identifier = null;
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
        return FeedBuilder.executeContentScript('/content-scripts/get-channel-url.js');
    }

    /**
     * Get the canonical address of the channel of the current page from the DOM.
     * The canonical address is always based on the channel ID.
     * @returns {?URL} URL object representing the channel address or `null` in case of error
     */
    static async getCanonicalAddressfromDOM() {
        Utils.debug('Requesting the canonical address from the DOM');
        return FeedBuilder.executeContentScript('/content-scripts/get-canonical-url.js');
    }

    /**
     * Retrieve the address of the channel or playlist of the current page,
     * and set the associated property.
     * If an error happened, the internal property will be set to `null`.
     * @returns {FeedBuilder} Instance of the class, in order to chain methods
     */
    async getContentAddress() {
        const parts = this.currentUrl.pathname.split('/');
        const firstPathnamePart = parts.length >= 2 ? parts[1] : '';
        switch (firstPathnamePart) {
            case 'user':
                this.contentAddress = this.currentUrl;
                break;
            case 'channel':
                this.contentAddress = this.currentUrl;
                break;
            case 'watch':
                this.contentAddress = await FeedBuilder.getChannelAddressfromDOM();
                break;
            case 'playlist':
                this.contentAddress = this.currentUrl;
                break;
            default:
                this.contentAddress = await FeedBuilder.getCanonicalAddressfromDOM();
                break;
        }
        Utils.debug(`Content address set to [${this.contentAddress}]`);
        return this;
    }

    /**
     * Build the unique identifier of the found channel or playlist,
     * and set the associated property.
     * If an error happened, the internal property will be set to `null`.
     * @returns {FeedBuilder} Instance of the class, in order to chain methods
     */
    buildContentIdentifier() {
        const parts = this.contentAddress !== null ? this.contentAddress.pathname.split('/') : [];
        const firstPathnamePart = parts.length >= 2 ? parts[1] : '';
        let playlistId = null;
        switch (firstPathnamePart) {
            case 'channel':
                this.identifier = `channel_id=${parts[2]}`;
                break;
            case 'user':
                this.identifier = `user=${parts[2]}`;
                break;
            case 'playlist':
                playlistId = new URLSearchParams(this.currentUrl.search).get('list');
                this.identifier = playlistId === null ? null : `playlist_id=${playlistId}`;
                break;
            default:
                this.identifier = null;
                break;
        }
        Utils.debug(`Content identifier set to [${this.identifier}]`);
        return this;
    }

    /**
     * Build the RSS feed of the channel or playlist from the built unique identifier.
     * @returns {?string} The channel or playlist RSS feed, or `null` if an error happened
     */
    buildContentFeed() {
        return this.identifier !== null
            ? `https://www.youtube.com/feeds/videos.xml?${this.identifier}`
            : null;
    }
}
