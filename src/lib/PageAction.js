class PageAction {
    /**
     * Get the list of available icon sizes for the page action.
     * @returns {array} List of sizes as integers
     */
    static _getIconSizes() {
        return [16, 24, 32, 48, 64, 96, 128, 256, 512, 1024];
    }

    /**
     * Build object of page action icon files.
     * @param {string} iconPath The path of the icon folder from the source files directory
     * @param {string} baseFileName The base filename of the icon (without extension or size)
     * @returns {Object} The object with multiple icon files in available sizes
     */
    static _iconPathBuilder(path, baseFileName) {
        return (accumulator, currentValue) => {
            accumulator[currentValue] = `${path}/${baseFileName}-${currentValue}.png`;
            return accumulator;
        };
    }

    /**
     * Set the title of the page action.
     * @param {integer} tabId The current tab ID
     * @param {string} title The title to set
     */
    static async _setTitle(tabId, title) {
        await browser.pageAction.setTitle({
            title,
            tabId,
        });
    }

    /**
     * Set the icon of the page action.
     * @param {integer} tabId The current tab ID
     * @param {string} iconPath The path of the icon folder from the source files directory
     * @param {string} baseFileName The base filename of the icon (without extension or size)
     */
    static async _setIcon(tabId, iconPath, baseFileName) {
        await browser.pageAction.setIcon({
            path: this._getIconSizes().reduce(this._iconPathBuilder(iconPath, baseFileName), {}),
            tabId,
        });
    }

    /**
     * Hide completely the page action.
     * @param {integer} tabId The current tab ID
     */
    static async hide(tabId) {
        await browser.pageAction.hide(tabId);
    }

    /**
     * Show the page action when no RSS feed has been found.
     * @param {integer} tabId The current tab ID
     */
    static async pending(tabId) {
        const setIcon = this._setIcon(tabId, 'icons/pending', 'pending');
        const setTitle = this._setTitle(
            tabId,
            browser.i18n.getMessage('page_action_title_pending'),
        );
        const setPageAction = browser.pageAction.show(tabId);
        Promise.all([setIcon, setTitle, setPageAction]);
    }

    /**
     * Show the page action when an RSS feed has been found.
     * @param {integer} tabId The current tab ID
     */
    static async success(tabId) {
        const setIcon = this._setIcon(tabId, 'icons/logo', 'youtube-rss-finder');
        const setTitle = this._setTitle(
            tabId,
            browser.i18n.getMessage('page_action_title_success'),
        );
        const setPageAction = browser.pageAction.show(tabId);
        Promise.all([setIcon, setTitle, setPageAction]);
    }
}
