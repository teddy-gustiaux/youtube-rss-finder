describe('Event manager', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
        browser.flush();
    });

    describe('A method to try to retrieve the RSS feed of the current YouTube page', () => {
        it('should hide the page action before trying to retrieve the feed', async () => {
            const eventManager = new EventManager();

            await eventManager._retrieveFeed(1, 'https://www.youtube.com/channel/123');

            expect(browser.pageAction.hide).to.have.been.called();
        });

        it('should do nothing if the current address is not a valid URL', async () => {
            const eventManager = new EventManager();
            const stub = sandbox.stub(Utils, 'delay');

            const res = await eventManager._retrieveFeed(1, 'www.youtube.com/channel/123');

            expect(stub).to.not.have.been.called();
            expect(eventManager.rssFeed).to.equal(null);
            expect(res).to.be.equal(false);
        });

        it('should not try to retrieve the feed before the specified time', async () => {
            const start = new Date().getTime();
            const eventManager = new EventManager();

            await eventManager._retrieveFeed(1, 'https://www.youtube.com/channel/123', 200);

            const end = new Date().getTime();
            expect(end - start).to.be.at.least(200);
        });

        it('should do nothing if the feed retrieval failed', async () => {
            const eventManager = new EventManager();
            const spy = sandbox.spy(Utils, 'delay');
            browser.tabs.executeScript.returns([null]);
            const address = 'https://www.youtube.com/watch?v=a1b2c3d5';

            const res = await eventManager._retrieveFeed(1, address, 100);

            expect(spy).to.have.been.called();
            expect(browser.pageAction.show).to.not.have.been.called();
            expect(eventManager.rssFeed).to.equal(null);
            expect(res).to.be.equal(false);
        });

        it('should set the feed if the feed retrieval succeeded', async () => {
            const eventManager = new EventManager();
            const spy = sandbox.spy(Utils, 'delay');
            const address = 'https://www.youtube.com/channel/123';

            const res = await eventManager._retrieveFeed(1, address, 100);

            expect(spy).to.have.been.called();
            expect(eventManager.rssFeed).to.not.equal(null);
            expect(res).to.be.equal(true);
        });

        it('should show the page action if the feed retrieval succeeded', async () => {
            const eventManager = new EventManager();
            const spy = sandbox.spy(Utils, 'delay');
            const address = 'https://www.youtube.com/channel/123';

            const res = await eventManager._retrieveFeed(1, address, 100);

            expect(spy).to.have.been.called();
            expect(browser.pageAction.show).to.have.been.called();
            expect(res).to.be.equal(true);
        });
    });

    describe('A method to process the change happening for the given tab ID.', () => {
        it('should do nothing if there are no active YouTube pages', async () => {
            const eventManager = new EventManager();
            browser.tabs.query.returns([]);
            const stub = sandbox.stub(eventManager, '_retrieveFeed');

            await eventManager._tabHasChanged(1, 1);

            expect(stub).to.not.have.been.called();
        });

        it('should do nothing if the YouTube page is not from the specified window', async () => {
            const eventManager = new EventManager();
            browser.tabs.query.returns([{ id: 1, windowId: 2 }]);
            const stub = sandbox.stub(eventManager, '_retrieveFeed');

            await eventManager._tabHasChanged(1, 1);

            expect(stub).to.not.have.been.called();
        });

        it('should do nothing if the YouTube page is not in the active page', async () => {
            const eventManager = new EventManager();
            browser.tabs.query.returns([{ id: 2, windowId: 1 }]);
            const stub = sandbox.stub(eventManager, '_retrieveFeed');

            await eventManager._tabHasChanged(1, null);

            expect(stub).to.not.have.been.called();
        });

        it('should try to retrieve a feed if the active tab is a YouTube page', async () => {
            const eventManager = new EventManager();
            browser.tabs.query.returns([{ id: 1, windowId: null }]);
            const stub = sandbox.stub(eventManager, '_retrieveFeed');

            await eventManager._tabHasChanged(1, null);

            expect(stub).to.have.been.calledOnce();
        });

        it('should try to retrieve a feed if the active tab/window is a YouTube page', async () => {
            const eventManager = new EventManager();
            browser.tabs.query.returns([{ id: 1, windowId: 1 }]);
            const stub = sandbox.stub(eventManager, '_retrieveFeed');

            await eventManager._tabHasChanged(1, 1);

            expect(stub).to.have.been.calledOnce();
        });
    });

    describe('A callback function executed when the page action is clicked', () => {
        it('should open the RSS feed in a new tab if it exists', async () => {
            const eventManager = new EventManager();
            eventManager.rssFeed = 'https://www.youtube.com/feeds/videos.xml?channel_id=123';

            await eventManager.onPageActionClick();

            expect(browser.tabs.create).to.have.been.calledOnce();
            expect(browser.notifications.create).to.not.have.been.called();
        });

        it('should display a notification if the RSS feed does not exist', async () => {
            const eventManager = new EventManager();
            eventManager.rssFeed = null;
            browser.runtime.getManifest.returns({ name: 'YouTube RSS Finder' });

            await eventManager.onPageActionClick();

            expect(browser.tabs.create).to.not.have.been.called();
            expect(browser.notifications.create).to.have.been.calledOnce();
        });
    });

    describe('A callback function executed when the current tab is updated', () => {
        it('should call the event handler only after the new page is loaded', async () => {
            const eventManager = new EventManager();
            const stub = sandbox.stub(eventManager, '_tabHasChanged');
            const changeInfo = {
                title: 'My channel',
                status: 'complete',
            };

            await eventManager.onTabUpdated(1, changeInfo);

            expect(stub).to.have.been.calledOnce();
        });

        it('should not call the event handler if the new page is not yet loaded', async () => {
            const eventManager = new EventManager();
            const stub = sandbox.stub(eventManager, '_tabHasChanged');
            const changeInfo = {
                title: 'YouTube',
                status: 'complete',
            };

            await eventManager.onTabUpdated(1, changeInfo);

            expect(stub).to.not.have.been.called();
        });
    });

    describe('A callback function executed when the current tab is activated', () => {
        it('should call the event handler', async () => {
            const eventManager = new EventManager();
            const stub = sandbox.stub(eventManager, '_tabHasChanged');
            const activeInfo = {
                previousTabId: 1,
                tabId: 2,
                windowId: 1,
            };

            await eventManager.onTabActivated(activeInfo);

            expect(stub).to.have.been.calledOnce();
        });
    });

    describe('A callback function executed when the currently focused window changes', () => {
        it('should call the event handler', async () => {
            const eventManager = new EventManager();
            const stub = sandbox.stub(eventManager, '_tabHasChanged');

            await eventManager.onWindowFocusChanged(1);

            expect(stub).to.have.been.calledOnce();
        });
    });
});
