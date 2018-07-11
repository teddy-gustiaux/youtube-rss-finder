/*
 * ================================================================================
 * CONSTANTS
 * ================================================================================
 */

const CONTENT_SCRIPT = '/content-script.js';
const FEED_BASE_URL = 'https://www.youtube.com/feeds/videos.xml?';
const YOUTUBE_WATCH = 'https://www.youtube.com/watch?';

/*
 * ================================================================================
 * UTILITIES
 * ================================================================================
 */

function onError(error) {
    console.log(`Error: ${error}`);
}

function getIdentifier(url, splitter) {
    return url.split(splitter)[1].split('/')[0];
}

function getFeed(url) {
    let channel;
    let id;
    if (url.split('channel/')[1]) {
        id = getIdentifier(url, 'channel/')
        if (id) channel = `channel_id=${id}`;
    } else if(url.split('user/')[1]) {
        id = getIdentifier(url, 'user/')
        if (id) channel = `user=${id}`;
    } else {
        id = getIdentifier(url, 'youtube.com/')
        if (id) channel = `user=${id}`;
    }
    if (channel) {
        return FEED_BASE_URL + channel;
    } else {
        return null;
    }
}

async function displayFeed(tabs) {
    if (tabs[0]) {
        const currentURL = tabs[0].url;
        let feed;
        if (currentURL.substring(0, 30) === YOUTUBE_WATCH) {
            const executing = browser.tabs.executeScript({
                file: CONTENT_SCRIPT,
            });
            await executing.then(result => {
                feed = getFeed(result[0]);
            }, onError);
        } else {
            feed = getFeed(currentURL);
        }
        if (feed !== null) {
            browser.tabs.create({
                url: feed,
                active: true,
            });
        }
    }
}

function buttonClicked() {
    const gettingActiveTab = browser.tabs.query({ active: true, currentWindow: true });
    gettingActiveTab.then(displayFeed, onError);
}

/*
 * ================================================================================
 * LISTENERS
 * ================================================================================
 */

// Listen for clicks on the button
browser.pageAction.onClicked.addListener(buttonClicked);
