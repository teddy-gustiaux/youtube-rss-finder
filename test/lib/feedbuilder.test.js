describe('Feed builder', () => {
    let sandbox;
    const tabId = 42;
    const currentUrl = null;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
        browser.flush();
    });

    describe('A method to execute a content script and return the result as an URL object', () => {
        it('should try to execute the given content script', async () => {
            const feedBuilder = new FeedBuilder(tabId, currentUrl);
            const fakeScriptResults = ['https://www.youtube.com/channel/123'];
            browser.tabs.executeScript.returns(fakeScriptResults);

            await feedBuilder.executeContentScript('/path/to/my/file.js');

            expect(browser.tabs.executeScript).to.have.been.calledOnceWith(tabId, {
                file: '/path/to/my/file.js',
                runAt: 'document_idle',
            });
        });

        it('should return an URL object if successful', async () => {
            const feedBuilder = new FeedBuilder(tabId, currentUrl);
            const fakeScriptResults = ['https://www.youtube.com/channel/123'];
            browser.tabs.executeScript.returns(fakeScriptResults);

            const result = await feedBuilder.executeContentScript('/path/to/my/file.js');

            expect(result).to.be.an.instanceOf(URL);
        });

        it('should return null if not successful', async () => {
            const feedBuilder = new FeedBuilder(tabId, currentUrl);
            browser.tabs.executeScript.returns([]);

            const result = await feedBuilder.executeContentScript('/path/to/my/file.js');

            expect(result).to.be.equal(null);
        });
    });

    describe('A method to get the address of the channel from the DOM', () => {
        it('should try to execute the correct content script', async () => {
            const feedBuilder = new FeedBuilder(tabId, currentUrl);
            const spy = sandbox.stub(feedBuilder, 'executeContentScript');

            await feedBuilder.getChannelAddressfromDOM();

            expect(spy).to.have.been.calledOnceWithExactly('/content-scripts/get-channel-url.js');
        });
    });

    describe('A method to get the canonical address of the channel from the DOM', () => {
        it('should try to execute the correct content script', async () => {
            const feedBuilder = new FeedBuilder(tabId, currentUrl);
            const spy = sandbox.stub(feedBuilder, 'executeContentScript');

            await feedBuilder.getCanonicalAddressfromDOM();

            expect(spy).to.have.been.calledOnceWithExactly('/content-scripts/get-canonical-url.js');
        });
    });

    describe('A method to retrieve the address of the channel or playlist', () => {
        it('should set the proper content URL when at a legacy username channel URL', async () => {
            const legacyUsernameChannelAddress = new URL('https://www.youtube.com/user/123');
            const feedBuilder = new FeedBuilder(tabId, legacyUsernameChannelAddress);

            await feedBuilder.getContentAddress();

            expect(feedBuilder.contentAddress).to.be.equal(legacyUsernameChannelAddress);
        });

        it('should set the proper content URL when at a username-based URL', async () => {
            const legacyUsernameChannelAbout = new URL('https://www.youtube.com/user/123/about');
            const feedBuilder = new FeedBuilder(tabId, legacyUsernameChannelAbout);

            await feedBuilder.getContentAddress();

            expect(feedBuilder.contentAddress).to.be.equal(legacyUsernameChannelAbout);
        });

        it('should set the proper content URL when at an ID-based channel URL', async () => {
            const idChannelAddress = new URL('https://www.youtube.com/channel/123');
            const feedBuilder = new FeedBuilder(tabId, idChannelAddress);

            await feedBuilder.getContentAddress();

            expect(feedBuilder.contentAddress).to.be.equal(idChannelAddress);
        });

        it('should set the proper content URL when at an ID-based URL', async () => {
            const idChannelAbout = new URL('https://www.youtube.com/channel/123/about');
            const feedBuilder = new FeedBuilder(tabId, idChannelAbout);

            await feedBuilder.getContentAddress();

            expect(feedBuilder.contentAddress).to.be.equal(idChannelAbout);
        });

        it('should set the proper content URL when at a video URL', async () => {
            const videoAddress = new URL('https://www.youtube.com/watch?v=a1b2c3d5');
            const feedBuilder = new FeedBuilder(tabId, videoAddress);
            const fakeChannelAddress = new URL('https://www.youtube.com/channel/123');
            sandbox.stub(feedBuilder, 'getChannelAddressfromDOM').returns(fakeChannelAddress);

            await feedBuilder.getContentAddress();

            expect(feedBuilder.contentAddress).to.be.equal(fakeChannelAddress);
        });

        it('should set the proper content URL when at a playlist URL', async () => {
            const playlistAddress = new URL('https://www.youtube.com/playlist?list=e6f7g8');
            const feedBuilder = new FeedBuilder(tabId, playlistAddress);

            await feedBuilder.getContentAddress();

            expect(feedBuilder.contentAddress).to.be.equal(playlistAddress);
        });

        it('should set the proper content URL when at a custom channel URL', async () => {
            const customChannelAddress = new URL('https://www.youtube.com/c/creatoracademy');
            const feedBuilder = new FeedBuilder(tabId, customChannelAddress);
            const fakeChannelAddress = new URL('https://www.youtube.com/channel/123');
            sandbox.stub(feedBuilder, 'getCanonicalAddressfromDOM').returns(fakeChannelAddress);

            await feedBuilder.getContentAddress();

            expect(feedBuilder.contentAddress).to.be.equal(fakeChannelAddress);
        });

        it('should set the proper content URL when at any other URL of a channel', async () => {
            const usernameChannelAddress = new URL('https://www.youtube.com/username');
            const feedBuilder = new FeedBuilder(tabId, usernameChannelAddress);
            const fakeChannelAddress = new URL('https://www.youtube.com/channel/123');
            sandbox.stub(feedBuilder, 'getCanonicalAddressfromDOM').returns(fakeChannelAddress);

            await feedBuilder.getContentAddress();

            expect(feedBuilder.contentAddress).to.be.equal(fakeChannelAddress);
        });

        it('should set the content URL to null when at the homepage URL', async () => {
            const homepageAddress = new URL('https://www.youtube.com');
            const feedBuilder = new FeedBuilder(tabId, homepageAddress);
            sandbox.stub(feedBuilder, 'getCanonicalAddressfromDOM').returns(null);

            await feedBuilder.getContentAddress();

            expect(feedBuilder.contentAddress).to.be.equal(null);
        });

        it('should set the content URL to null when at any other URL', async () => {
            const otherAddress = new URL('https://www.youtube.com/404');
            const feedBuilder = new FeedBuilder(tabId, otherAddress);
            sandbox.stub(feedBuilder, 'getCanonicalAddressfromDOM').returns(null);

            await feedBuilder.getContentAddress();

            expect(feedBuilder.contentAddress).to.be.equal(null);
        });
    });

    describe('A method to build the unique identifier of the found channel or playlist', () => {
        it('should always return the class instance', async () => {
            const feedBuilder = new FeedBuilder(tabId, currentUrl);
            feedBuilder.contentAddress = null;

            const result = feedBuilder.buildContentIdentifier();

            expect(result).to.be.an.instanceOf(FeedBuilder);
            expect(result).to.be.deep.equal(feedBuilder);
        });

        it('should build the correct identifier for a legacy username channel URL', async () => {
            const feedBuilder = new FeedBuilder(tabId, currentUrl);
            feedBuilder.contentAddress = 'https://www.youtube.com/user/123';

            feedBuilder.buildContentIdentifier();

            expect(feedBuilder.identifier).to.be.equal('user=123');
        });

        it('should build the correct identifier for an ID-based channel URL', async () => {
            const feedBuilder = new FeedBuilder(tabId, currentUrl);
            feedBuilder.contentAddress = 'https://www.youtube.com/channel/123';

            feedBuilder.buildContentIdentifier();

            expect(feedBuilder.identifier).to.be.equal('channel_id=123');
        });

        it('should build the correct identifier for a playlist URL', async () => {
            const playlistAddress = 'https://www.youtube.com/playlist?list=123';
            const feedBuilder = new FeedBuilder(tabId, new URL(playlistAddress));
            feedBuilder.contentAddress = playlistAddress;

            feedBuilder.buildContentIdentifier();

            expect(feedBuilder.identifier).to.be.equal('playlist_id=123');
        });

        it('should set the identifier to null when no content URL was set', async () => {
            const feedBuilder = new FeedBuilder(tabId, currentUrl);
            feedBuilder.contentAddress = null;

            feedBuilder.buildContentIdentifier();

            expect(feedBuilder.identifier).to.be.equal(null);
        });
    });

    describe('A method to build the RSS feed from the built unique identifier', () => {
        it('should return the RSS feed address if the identifier was set', async () => {
            const feedBuilder = new FeedBuilder(tabId, currentUrl);
            feedBuilder.identifier = 'unique_id';

            const result = feedBuilder.buildContentFeed();

            expect(result).to.be.equal('https://www.youtube.com/feeds/videos.xml?unique_id');
        });

        it('should return null when no identifier was set', async () => {
            const feedBuilder = new FeedBuilder(tabId, currentUrl);
            feedBuilder.identifier = null;

            const result = feedBuilder.buildContentFeed();

            expect(result).to.be.equal(null);
        });
    });
});
