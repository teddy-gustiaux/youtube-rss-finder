'use strict'

/*
 * ================================================================================
 * CONSTANTS
 * ================================================================================
 */

const FEED_BASE_URL = 'https://www.youtube.com/feeds/videos.xml?';

/*
 * ================================================================================
 * UTILITIES
 * ================================================================================
 */

function getFeed(url) {
  let channel;
  if (url.split('channel/')[1]) {
      channel = 'channel_id=' + url.split('channel/')[1].split('/')[0];
  } else {
      channel = 'user=' + url.split('user/')[1].split('/')[0];
  }
  return FEED_BASE_URL + channel;
}

function buttonClicked() {
    let gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
    gettingActiveTab.then(displayFeed, onError);
}

function displayFeed(tabs) {
    if (tabs[0]) {
        let currentURL = tabs[0].url;
        let feed = getFeed(currentURL);
        console.log(feed)
        var creating = browser.tabs.create({
            url: feed,
            active: true,
          });
          creating.then(onCreated, onError);
          function onCreated(tab) {
            console.log(`Created new tab: ${tab.id}`)
          }
      }
}

function onError(error) {
    console.log(`Error: ${error}`);
  }

/*
 * ================================================================================
 * LISTENERS
 * ================================================================================
 */

// Listen for clicks on the button
browser.pageAction.onClicked.addListener(buttonClicked)