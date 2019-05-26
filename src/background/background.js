/**
 * Global variable.
 * Hold the resolved channel RSS feed for the curent YouTube page if it exists or `null` otherwise.
 * @type {?string}
 */
let rssFeed = null;
/**
 * Global constant.
 * Intended for development purposes only. If set to `true`, debug messages will display.
 * @type {boolean}
 */
const DEBUG = false;

/*
 * =================================================================================================
 * EXTENSION LOGIC
 * =================================================================================================
 */

/**
 * Tru to retrieve the channel RSS feed of the current YouTube page.
 * If it exists, shows the page action to the user.
 * @param {number} tabId The ID of the current tab
 * @param {URL} url An instance of the URL object for the current tab address
 */
async function retrieveFeed(tabId, urlString) {
    const url = Utils.buildUrlObject(urlString);
    if (url === null) return;

    Utils.debug(`Trying to retrieve the feed for the current page [${urlString}]`);
    const feedBuilder = new FeedBuilder(tabId, url);
    const feed = (await feedBuilder.getContentAddress())
        .buildContentIdentifier()
        .buildContentFeed();

    if (!Utils.isValidURL(feed)) {
        rssFeed = null;
        Utils.debug(`Feed is invalid - determined as [${feed}]`);
        return;
    }

    Utils.debug(`Feed has been determined as [${feed}]`);
    rssFeed = feed;
    browser.pageAction.show(tabId);
}

/**
 * Process the change happening for the given tab ID.
 * This can be either a change of address within the tab or activating a new one.
 * Disable the page action icon and try to retrieve the channel feed if applicable.
 * @param {?number} tabId ID of the current tab (set to `null` if called from window focus change)
 * @param {?number} windowId ID of the current window (set to `null` if called from tab update)
 */
async function tabHasChanged(tabId, windowId) {
    const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
        url: 'https://www.youtube.com/*',
    });
    if (windowId !== null && tabs[0].windowId !== windowId) return;
    if (tabs.length === 0 || (tabId !== null && tabs[0].id !== tabId)) return;
    rssFeed = null;
    browser.pageAction.hide(tabs[0].id);
    await retrieveFeed(tabs[0].id, tabs[0].url);
}

/**
 * Callback function executed when the page action is clicked.
 * Open the YouTube channel RSS feed in a new tab if it exists.
 * Otherwise, displays a notification error message to the user.
 */
async function onPageActionClick() {
    if (rssFeed !== null) {
        Utils.debug('Feed exists - Opening in new tab');
        browser.tabs.create({
            url: rssFeed,
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
async function onTabUpdated(tabId, changeInfo) {
    /**
     * Only listening to changes in the `title` property, once the proper page title has been set.
     * Before the page title is set, it will default to 'YouTube'
     * Listening to `status` property changes (either `loading` or `complete`) will fail,
     * as the content page script will be executed before the DOM has actually been updated.
     */
    if (!changeInfo.title || changeInfo.title === 'YouTube') return;
    Utils.debug(`Tab with ID [${tabId}] has been updated`);
    await tabHasChanged(tabId, null);
}

/**
 * Callback function executed when the current tab is activated.
 * @param {Object} activeInfo Contains properties regarding the current tab
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onActivated#activeInfo `activeInfo` object definition}
 */
async function onTabActivated(activeInfo) {
    Utils.debug(`Tab with ID [${activeInfo.tabId}] has been activated`);
    await tabHasChanged(activeInfo.tabId, activeInfo.windowId);
}

/**
 * Callback function executed when the currently focused window changes.
 * @param {number} windowId ID of the newly focused window
 */
async function onWindowFocusChanged(windowId) {
    Utils.debug(`Window with ID [${windowId}] has been gained focus`);
    await tabHasChanged(null, windowId);
}

/*
 * =================================================================================================
 * LISTENERS
 * =================================================================================================
 */

// -------------------------------------------------------------------------------------------------
// TABS
// -------------------------------------------------------------------------------------------------
// Listen to tab URL changes (if version supports it, limit to necessary URLs and events)
browser.runtime.getBrowserInfo().then(info => {
    const mainVersion = parseInt(info.version.split('.')[0], 10);
    if (mainVersion >= 61) {
        browser.tabs.onUpdated.addListener(onTabUpdated, {
            urls: ['https://www.youtube.com/*'],
            properties: ['title'],
        });
    } else {
        browser.tabs.onUpdated.addListener(onTabUpdated);
    }
});
// Listen to tab activation and tab switching
browser.tabs.onActivated.addListener(onTabActivated);

// -------------------------------------------------------------------------------------------------
// WINDOWS
// -------------------------------------------------------------------------------------------------
// Listen for window activation and window switching
browser.windows.onFocusChanged.addListener(onWindowFocusChanged);

// -------------------------------------------------------------------------------------------------
// PAGE ACTION
// -------------------------------------------------------------------------------------------------
// Listen for clicks on the page action (icon in the address bar)
browser.pageAction.onClicked.addListener(onPageActionClick);
