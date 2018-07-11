/*
 * =================================================================================================
 * CONSTANTS
 * =================================================================================================
 */

const CONTENT_SCRIPT = '/content-script.js';
const FEED_BASE_URL = 'https://www.youtube.com/feeds/videos.xml?';
const YOUTUBE_WATCH = 'https://www.youtube.com/watch?';
let globalFeed = null;

/*
 * =================================================================================================
 * UTILITIES
 * =================================================================================================
 */

async function getActiveTab() {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (typeof tabs !== 'undefined' && tabs.length > 0) {
        return tabs[0];
    }
    return null;
}

function isValidURL(urlString) {
    const supportedProtocols = ['https:', 'http:'];
    const url = document.createElement('a');
    url.href = urlString;
    return supportedProtocols.indexOf(url.protocol) !== -1;
}

function isWatchURL(url) {
    return url.substring(0, 30) === YOUTUBE_WATCH;
}

function getIdentifier(url, splitter) {
    return url.split(splitter)[1].split('/')[0];
}

function buildFeedIdentifier(url, splitter, queryStringParameter) {
    let channel;
    if (url.split(splitter)[1]) {
        const id = getIdentifier(url, splitter);
        if (id && typeof id !== 'undefined') channel = `${queryStringParameter}=${id}`;
    }
    return channel || null;
}

function buildFeed(url) {
    let channel = null;
    if (url.split('channel/')[1]) {
        channel = buildFeedIdentifier(url, 'channel/', 'channel_id');
    } else if (url.split('user/')[1]) {
        channel = buildFeedIdentifier(url, 'user/', 'user');
    } else if (url.split('/').length === 4) {
        channel = buildFeedIdentifier(url, 'youtube.com/', 'user');
    }
    if (channel !== null) {
        return FEED_BASE_URL + channel;
    }
    return null;
}

async function getFeed(currentURL) {
    return buildFeed(currentURL);
}

async function getFeedForWatch() {
    const result = await browser.tabs.executeScript({
        file: CONTENT_SCRIPT,
    });
    return buildFeed(result[0]);
}

async function displayFeed(feed) {
    if (isValidURL(feed)) {
        browser.tabs.create({
            url: feed,
            active: true,
        });
    }
}

async function onPageActionClick(tab) {
    if (isWatchURL(tab.url)) {
        globalFeed = await getFeedForWatch();
    }
    displayFeed(globalFeed);
}

async function processUpdate() {
    const activeTab = await getActiveTab();
    if (activeTab === null) {
        browser.pageAction.hide(activeTab.id);
    } else if (isWatchURL(activeTab.url)) {
        browser.pageAction.show(activeTab.id);
    } else {
        globalFeed = await getFeed(activeTab.url);
        if (globalFeed !== null) {
            browser.pageAction.show(activeTab.id);
        } else {
            browser.pageAction.hide(activeTab.id);
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
// Listen to tab URL changes
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
