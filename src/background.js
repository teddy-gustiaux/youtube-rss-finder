/*
 * =================================================================================================
 * CONSTANTS
 * =================================================================================================
 */

const CONTENT_SCRIPT = '/content-script.js';
const FEED_BASE_URL = 'https://www.youtube.com/feeds/videos.xml?';
const YOUTUBE_VIDEO_WATCHING = 'https://www.youtube.com/watch?';
let globalFeed = null;

/*
 * =================================================================================================
 * CLASSES
 * =================================================================================================
 */

/**
 * A class to manipulate the page action.
 */
class PageAction {
    /**
     * Hide completely the page action.
     * @param {integer} tabId The ID of the tab for which to hide the page action
     */
    static hide(tabId) {
        browser.pageAction.hide(tabId);
    }

    /**
     * Show the page action.
     * @param {integer} tabId The ID of the tab for which to show the page action
     */
    static show(tabId) {
        browser.pageAction.show(tabId);
    }
}

/**
 * A class containing various utility functions.
 */
class Utils {
    /**
     * Get the current tab information.
     * @returns {(Tab|null)} The information of the tab or `null` in case of error
     * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab `Tab` type definition}
     */
    static async getActiveTab() {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (typeof tabs !== 'undefined' && tabs.length > 0) {
            return tabs[0];
        }
        return null;
    }

    /**
     * Check if the provided URL is valid (HTTP-based URL).
     * @param {string} urlString The URL to check
     * @returns {boolean} `true` if the URL is supported, `false` otherwise
     */
    static isValidURL(urlString) {
        const supportedProtocols = ['https:', 'http:'];
        const url = new URL(urlString);
        return supportedProtocols.indexOf(url.protocol) !== -1;
    }

    /**
     * Check if the provided URL is corresponding to a video being watched on YouTube
     * @param {string} url The URL to check
     * @returns {boolean} `true` if the URL is one of a video being watched, `false` otherwise
     */
    static isVideoWatchingURL(url) {
        return url.substring(0, 30) === YOUTUBE_VIDEO_WATCHING;
    }

    /**
     * Build the channel RSS feed unique identifier.
     * @param {string} url The YouTube channel URL
     * @param {string} splitter Divider used to break down the channel URL
     * @param {string} queryStringParameter The parameter to indicate the type of content to retrieve
     * @returns {(string|null)} The identifier of the channel or `null` in case of error
     */
    static buildFeedIdentifier(url, splitter, queryStringParameter) {
        let channel;
        const test = url.split(splitter)[1];
        if (test) {
            const id = test.split('/')[0];
            if (id && typeof id !== 'undefined') channel = `${queryStringParameter}=${id}`;
        }
        return channel || null;
    }

    /**
     * Build the URL of the RSS feed of a YouTube channel.
     * @param {string} url The YouTube channel URL
     * @returns {(string|null)} The URL of the channel RSS feed or `null` in case of error
     */
    static buildChannelFeed(url) {
        let channel = null;
        if (url.split('channel/')[1]) {
            channel = Utils.buildFeedIdentifier(url, 'channel/', 'channel_id');
        } else if (url.split('user/')[1]) {
            channel = Utils.buildFeedIdentifier(url, 'user/', 'user');
        } else if (url.split('/').length === 4) {
            channel = Utils.buildFeedIdentifier(url, 'youtube.com/', 'user');
        }
        if (channel !== null) return FEED_BASE_URL + channel;
        return null;
    }
}

/*
 * =================================================================================================
 * EXTENSION LOGIC
 * =================================================================================================
 */

/**
 * Retrieve the RSS feed of the channel when watching a video of said channel.
 * Executes content script to retrieve the channel URL from the DOM.
 * @returns {(string|null)} The URL of the channel RSS feed or `null` in case of error
 */
async function getFeedFromDOM() {
    const result = await browser.tabs.executeScript({
        file: CONTENT_SCRIPT,
    });
    return Utils.buildChannelFeed(result[0]);
}

/**
 * Callback function executed when the page action is clicked.
 * Retrieves the YouTube channel RSS feed and opens it in a new tab.
 * @param {Tab} tab The tab whose page action was clicked
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab `Tab` type definition}
 */
async function onPageActionClick(tab) {
    if (Utils.isVideoWatchingURL(tab.url)) globalFeed = await getFeedFromDOM();
    if (Utils.isValidURL(globalFeed)) {
        browser.tabs.create({
            url: globalFeed,
            active: true,
        });
    }
}

/**
 * Callback function executed when the tab is updated, or when changing window or tab.
 * Hide the icon in case of error, or show it if a video is being watched.
 * If the user is elsewhere on YouTube, try to retrieve the RSS feed from the current URL
 * and display the icon accordingly.
 */
async function processUpdate() {
    const activeTab = await Utils.getActiveTab();
    if (activeTab === null) {
        PageAction.hide(activeTab.id);
    } else if (Utils.isVideoWatchingURL(activeTab.url)) {
        PageAction.show(activeTab.id);
    } else {
        // Try to retrieve the RSS feed from the current URL
        globalFeed = await Utils.buildChannelFeed(activeTab.url);
        if (globalFeed !== null) {
            PageAction.show(activeTab.id);
        } else {
            PageAction.hide(activeTab.id);
        }
    }
}

/*
 * =================================================================================================
 * LISTENERS
 * =================================================================================================
 */

// -------------------------------------------------------------------------------------------------
// TABS
// -------------------------------------------------------------------------------------------------
// Listen to tab URL changes (if version supports it, limit to necessary events)
browser.tabs.onUpdated.addListener(processUpdate, {
    urls: ['https://youtube.com/*'],
    properties: ['status'],
});
// Listen to tab activation and tab switching
browser.tabs.onActivated.addListener(processUpdate);

// -------------------------------------------------------------------------------------------------
// WINDOWS
// -------------------------------------------------------------------------------------------------
// Listen for window activation and window switching
browser.windows.onFocusChanged.addListener(processUpdate);

// -------------------------------------------------------------------------------------------------
// PAGE ACTION
// -------------------------------------------------------------------------------------------------
// Listen for clicks on the button
browser.pageAction.onClicked.addListener(onPageActionClick);
