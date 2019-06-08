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
     * Try to retrieve the RSS feed of the current YouTube page.
     * Show the page action to the user if it exists, and hide it if does not.
     * @param {number} tabId The ID of the current tab
     * @param {URL} url An instance of the URL object for the current tab address
     * @param {number} [delay=1000] Minimum time to wait before trying to retrieve the feed
     * @returns {Promise<boolean>} `true` if the feed retrieval succeeded, `false` otherwise
     */
    async _retrieveFeed(tabId, urlString, delay = 1000) {
        /**
         * As per the manifest, the page action icon is only shown on YouTube domain.
         * So, we only have to hide it if we are on YouTube, before trying to retrieve a feed.
         */
        browser.pageAction.hide(tabId);
        this.rssFeed = null;
        const url = Utils.buildUrlObject(urlString);
        if (url === null) return false;

        Utils.debug(`Trying to retrieve the feed for the current page [${urlString}]`);
        return Utils.delay(delay).then(async () => {
            const feedBuilder = new FeedBuilder(tabId, url);
            await feedBuilder.getContentAddress();
            const feed = feedBuilder.buildContentIdentifier().buildContentFeed();

            if (!Utils.isValidURL(feed)) {
                Utils.debug(`Feed is invalid - determined as [${feed}]`);
                return false;
            }

            Utils.debug(`Feed has been determined as [${feed}]`);
            this.rssFeed = feed;
            browser.pageAction.show(tabId);
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
                message: browser.i18n.getMessage('feedRetrievalError'),
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
         * Only listening to changes in the `title` property, once the proper page title has been set.
         * Before the page title is set, it will default to 'YouTube'
         * Listening to `status` property changes (either `loading` or `complete`) will fail,
         * as the content page script will be executed before the DOM has actually been updated.
         */
        if (!changeInfo.title || changeInfo.title === 'YouTube') return;
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
