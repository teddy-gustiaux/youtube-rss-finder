const eventManager = new EventManager();

// Listen to tab URL changes (if version supports it, limit to necessary URLs and events)
browser.runtime.getBrowserInfo().then(info => {
    const mainVersion = parseInt(info.version.split('.')[0], 10);
    if (mainVersion >= 61) {
        browser.tabs.onUpdated.addListener(eventManager.onTabUpdated, {
            urls: ['https://www.youtube.com/*'],
            properties: ['title'],
        });
    } else {
        browser.tabs.onUpdated.addListener(eventManager.onTabUpdated);
    }
});

// Listen to tab activation and tab switching
browser.tabs.onActivated.addListener(eventManager.onTabActivated);

// Listen for window activation and window switching
browser.windows.onFocusChanged.addListener(eventManager.onWindowFocusChanged);

// Listen for clicks on the page action (icon in the address bar)
browser.pageAction.onClicked.addListener(eventManager.onPageActionClick);
