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

function getFeed(url) {
    let channel;
    if (url.split('channel/')[1]) {
        channel = `channel_id=${url.split('channel/')[1].split('/')[0]}`;
    } else {
        channel = `user=${url.split('user/')[1].split('/')[0]}`;
    }
    return FEED_BASE_URL + channel;
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
        browser.tabs.create({
            url: feed,
            active: true,
        });
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
