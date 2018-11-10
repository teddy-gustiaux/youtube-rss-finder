/*
 * =================================================================================================
 * CONSTANTS
 * =================================================================================================
 */

const CONTENT_SCRIPT = '/content-script.js';
const FEED_BASE_URL = 'https://www.youtube.com/feeds/videos.xml?';
const YOUTUBE_VIDEO_WATCHING = 'https://www.youtube.com/watch?';

/*
 * =================================================================================================
 * CLASSES
 * =================================================================================================
 */

/**
 * A class containing various utility functions.
 */
class Utils {
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
    let feed = null;
    if (Utils.isVideoWatchingURL(tab.url)) {
        feed = await getFeedFromDOM();
    } else {
        feed = await Utils.buildChannelFeed(tab.url);
    }
    if (Utils.isValidURL(feed)) {
        browser.tabs.create({
            url: feed,
            active: true,
        });
    }
}

/*
 * =================================================================================================
 * LISTENERS
 * =================================================================================================
 */

// -------------------------------------------------------------------------------------------------
// PAGE ACTION
// -------------------------------------------------------------------------------------------------
// Listen for clicks on the page action (icon in the address bar)
browser.pageAction.onClicked.addListener(onPageActionClick);
