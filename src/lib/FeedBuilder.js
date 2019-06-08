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
        this._tabId = tabId;
        /** @type {URL} The URL of the current page */
        this._currentUrl = url;
        /** @type {?URL} The URL of the channel or the playlist */
        this._contentAddress = null;
        /** @type {?string} The unique identifier of the channel or the playlist */
        this._identifier = null;
    }

    /** @type {?URL} The URL of the channel or the playlist */
    get contentAddress() {
        return this._contentAddress;
    }

    /** @type {?string} The URL of the channel or the playlist */
    set contentAddress(address) {
        this._contentAddress = Utils.buildUrlObject(address);
    }

    /** @type {?string} The unique identifier of the channel or the playlist */
    get identifier() {
        return this._identifier;
    }

    /** @type {?string} The unique identifier of the channel or the playlist */
    set identifier(identifier) {
        this._identifier = identifier;
    }

    /**
     * Execute a content script and return the result as an URL object.
     * @param {string} file Path to the content script file to be executed
     * @returns {?URL} URL object created from the content script result or `null` in case of error
     * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/executeScript `tabs.executeScript()` API definition}
     */
    async executeContentScript(file) {
        const scriptResults = await browser.tabs.executeScript(this._tabId, {
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
    async getChannelAddressfromDOM() {
        Utils.debug('Requesting the channel address from the DOM');
        return this.executeContentScript('/content-scripts/get-channel-url.js');
    }

    /**
     * Get the canonical address of the channel of the current page from the DOM.
     * The canonical address is always based on the channel ID.
     * @returns {?URL} URL object representing the channel address or `null` in case of error
     */
    async getCanonicalAddressfromDOM() {
        Utils.debug('Requesting the canonical address from the DOM');
        return this.executeContentScript('/content-scripts/get-canonical-url.js');
    }

    /**
     * Retrieve the address of the channel or playlist of the current page,
     * and set the associated property.
     * If an error happened, the internal property will be set to `null`.
     * @returns {void}
     */
    async getContentAddress() {
        const pathnameParts = this._currentUrl.pathname.split('/');
        switch (pathnameParts[1]) {
            case 'user':
                this._contentAddress = this._currentUrl;
                break;
            case 'channel':
                this._contentAddress = this._currentUrl;
                break;
            case 'watch':
                this._contentAddress = await this.getChannelAddressfromDOM();
                break;
            case 'playlist':
                this._contentAddress = this._currentUrl;
                break;
            case 'c':
                this._contentAddress = await this.getCanonicalAddressfromDOM();
                break;
            default:
                this._contentAddress = await this.getCanonicalAddressfromDOM();
                break;
        }
        Utils.debug(`Content address set to [${this._contentAddress}]`);
    }

    /**
     * Build the unique identifier of the found channel or playlist,
     * and set the associated property.
     * If an error happened, the internal property will be set to `null`.
     * @returns {FeedBuilder} Instance of the class, in order to chain methods
     */
    buildContentIdentifier() {
        const parts = this._contentAddress !== null ? this._contentAddress.pathname.split('/') : [];
        const firstPathnamePart = parts.length >= 2 ? parts[1] : '';
        let playlistId = null;
        switch (firstPathnamePart) {
            case 'channel':
                this._identifier = `channel_id=${parts[2]}`;
                break;
            case 'user':
                this._identifier = `user=${parts[2]}`;
                break;
            case 'playlist':
                playlistId = new URLSearchParams(this._currentUrl.search).get('list');
                this._identifier = `playlist_id=${playlistId}`;
                break;
            default:
                this._identifier = null;
                break;
        }
        Utils.debug(`Content identifier set to [${this._identifier}]`);
        return this;
    }

    /**
     * Build the RSS feed of the channel or playlist from the built unique identifier.
     * @returns {?string} The channel or playlist RSS feed, or `null` if an error happened
     */
    buildContentFeed() {
        return this._identifier !== null
            ? `https://www.youtube.com/feeds/videos.xml?${this._identifier}`
            : null;
    }
}
