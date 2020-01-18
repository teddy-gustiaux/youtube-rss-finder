class EventManager {
    constructor() {
        this._rssFeed = null;
        this.onTabUpdated = this.onTabUpdated.bind(this);
        this.onTabActivated = this.onTabActivated.bind(this);
        this.onWindowFocusChanged = this.onWindowFocusChanged.bind(this);
        this.onPageActionClick = this.onPageActionClick.bind(this);
    }

    get rssFeed() {
        return this._rssFeed;
    }

    set rssFeed(feedAddress) {
        this._rssFeed = feedAddress;
    }

    /**
     * Set the initial state before doing anything else.
     * @param {number} tabId The ID of the current tab
     * @param {URL} urlString An instance of the URL object for the current tab address
     */
    async _setInitialState(tabId, urlString) {
        Utils.debug('Hiding icon');
        await PageAction.hide(tabId);
        this.rssFeed = null;

        const knownSupportedUrls = [
            'https://www.youtube.com/channel/',
            'https://www.youtube.com/watch?',
            'https://www.youtube.com/user/',
            'https://www.youtube.com/c/',
            'https://www.youtube.com/playlist?',
        ];
        const knownSupportedUrl = knownSupportedUrls.some(url => {
            return urlString.substring(0, url.length) === url;
        });
        if (knownSupportedUrl === true) {
            Utils.debug('Address is supported - Showing disabled icon');
            await PageAction.pending(tabId);
        }
    }

    /**
     * Try to retrieve the RSS feed of the current YouTube page.
     * Show the page action to the user if it exists, and hide it if does not.
     * @param {number} tabId The ID of the current tab
     * @param {URL} urlString An instance of the URL object for the current tab address
     * @param {number} [delay=1000] Minimum time to wait before trying to retrieve the feed
     * @returns {Promise<boolean>} `true` if the feed retrieval succeeded, `false` otherwise
     */
    async _retrieveFeed(tabId, urlString, delay = 1000) {
        const url = Utils.buildUrlObject(urlString);
        if (url === null) return false;

        Utils.debug(`Trying to retrieve the feed for the current page [${urlString}]`);
        return Utils.delay(delay).then(async () => {
            const feedBuilder = new FeedBuilder(tabId, url);
            await feedBuilder.getContentAddress();
            const feed = feedBuilder.buildContentIdentifier().buildContentFeed();

            if (!Utils.isValidURL(feed)) {
                Utils.debug(`Feed is invalid - determined as [${feed}] - Hiding icon`);
                await PageAction.hide(tabId);
                return false;
            }

            Utils.debug(`Feed has been determined as [${feed}] - Showing enabled icon`);
            this.rssFeed = feed;
            await PageAction.success(tabId);
            return true;
        });
    }

    /**
     * Process the change happening for the given tab ID.
     * This can be either a change of address within the tab or activating a new one.
     * If applicable, will call the function trying to retrieve the feed.
     * @param {?number} tabId ID of the current tab (set to `null` if called from window focus change)
     * @param {?number} windowId ID of the current window (set to `null` if called from tab update)
     */
    async _tabHasChanged(tabId, windowId) {
        const tabs = await browser.tabs.query({
            active: true,
            currentWindow: true,
            url: 'https://www.youtube.com/*',
        });
        if (tabs.length === 0) return;
        if (windowId !== null && tabs[0].windowId !== windowId) return;
        if (tabId !== null && tabs[0].id !== tabId) return;
        await this._setInitialState(tabs[0].id, tabs[0].url);
        await this._retrieveFeed(tabs[0].id, tabs[0].url);
    }

    /**
     * Callback function executed when the page action is clicked.
     * Open the RSS feed in a new tab if it exists.
     * Otherwise, displays a notification error message to the user.
     */
    async onPageActionClick() {
        if (this.rssFeed !== null) {
            Utils.debug('Feed exists - Opening in new tab');
            browser.tabs.create({
                url: this.rssFeed,
                active: true,
            });
        } else {
            Utils.debug('Feed does not exist - Displaying notification');
            browser.notifications.create('', {
                type: 'basic',
                title: browser.runtime.getManifest().name,
                message: browser.i18n.getMessage('notification_feed_retrieval_error'),
                iconUrl: browser.extension.getURL('icons/error/error-96.png'),
            });
        }
    }

    /**
     * Callback function executed when the current tab is updated.
     * If the URL of the current tab changes, try to retrieve the RSS feed for it.
     * @param {number} tabId The ID of the current tab
     * @param {Object} changeInfo Contains properties for the tab properties that have changed
     * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onUpdated#changeInfo `changeInfo` object definition}
     * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab `Tab` type definition}
     */
    async onTabUpdated(tabId, changeInfo) {
        /**
         * Only listening to changes in the `status` property.
         * Waiting until the tab has finished loading (status `complete`).
         */
        if (changeInfo.status !== 'complete') return;
        Utils.debug(`Tab with ID [${tabId}] has been updated`);
        await this._tabHasChanged(tabId, null);
    }

    /**
     * Callback function executed when the current tab is activated.
     * @param {Object} activeInfo Contains properties regarding the current tab
     * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onActivated#activeInfo `activeInfo` object definition}
     */
    async onTabActivated(activeInfo) {
        Utils.debug(`Tab with ID [${activeInfo.tabId}] has been activated`);
        await this._tabHasChanged(activeInfo.tabId, activeInfo.windowId);
    }

    /**
     * Callback function executed when the currently focused window changes.
     * @param {number} windowId ID of the newly focused window
     */
    async onWindowFocusChanged(windowId) {
        Utils.debug(`Window with ID [${windowId}] has been gained focus`);
        await this._tabHasChanged(null, windowId);
    }
}
