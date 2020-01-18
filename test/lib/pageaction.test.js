describe('Page action', () => {
    let sandbox;
    const tabId = 42;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
        browser.flush();
    });

    describe('A method to hide the page action', () => {
        it('should request to hide the page action', async () => {
            await PageAction.hide(tabId);

            expect(browser.pageAction.hide).to.have.been.calledOnceWithExactly(tabId);
        });
    });

    describe('A method to set the page action as pending status', () => {
        it('should request to show the page action', async () => {
            await PageAction.pending(tabId);

            expect(browser.pageAction.show).to.have.been.calledOnceWithExactly(tabId);
        });

        it('should request to update the page action icon', async () => {
            const sizes = ['16', '24', '32', '48', '64', '96', '128', '256', '512', '1024'];

            await PageAction.pending(tabId);
            const iconArguments = browser.pageAction.setIcon.getCall(0).args[0];

            expect(browser.pageAction.setIcon).to.have.been.calledOnce();
            expect(iconArguments).to.have.all.keys('tabId', 'path');
            expect(iconArguments.tabId).to.be.equal(tabId);
            expect(iconArguments.path).to.have.all.keys(sizes);
            sizes.forEach(size => {
                expect(iconArguments.path[size]).to.be.a('string');
            });
        });

        it('should request the translation for the page action title', async () => {
            await PageAction.pending(tabId);

            expect(browser.i18n.getMessage).to.have.been.calledOnce();
            expect(browser.i18n.getMessage.getCall(0).args[0]).to.be.a('string');
        });

        it('should request to update the page action title', async () => {
            const fakeTitle = 'A fake title';
            browser.i18n.getMessage.returns(fakeTitle);

            await PageAction.pending(tabId);
            const titleArguments = browser.pageAction.setTitle.getCall(0).args[0];

            expect(browser.pageAction.setTitle).to.have.been.calledOnce();
            expect(titleArguments).to.have.all.keys('tabId', 'title');
            expect(titleArguments.tabId).to.be.equal(tabId);
            expect(titleArguments.title).to.be.equal(fakeTitle);
        });
    });

    describe('A method to set the page action as success status', () => {
        it('should request to show the page action', async () => {
            await PageAction.success(tabId);

            expect(browser.pageAction.show).to.have.been.calledOnceWithExactly(tabId);
        });

        it('should request to update the page action icon', async () => {
            const sizes = ['16', '24', '32', '48', '64', '96', '128', '256', '512', '1024'];

            await PageAction.success(tabId);
            const iconArguments = browser.pageAction.setIcon.getCall(0).args[0];

            expect(browser.pageAction.setIcon).to.have.been.calledOnce();
            expect(iconArguments).to.have.all.keys('tabId', 'path');
            expect(iconArguments.tabId).to.be.equal(tabId);
            expect(iconArguments.path).to.have.all.keys(sizes);
            sizes.forEach(size => {
                expect(iconArguments.path[size]).to.be.a('string');
            });
        });

        it('should request the translation for the page action title', async () => {
            await PageAction.success(tabId);

            expect(browser.i18n.getMessage).to.have.been.calledOnce();
            expect(browser.i18n.getMessage.getCall(0).args[0]).to.be.a('string');
        });

        it('should request to update the page action title', async () => {
            const fakeTitle = 'A fake title';
            browser.i18n.getMessage.returns(fakeTitle);

            await PageAction.success(tabId);
            const titleArguments = browser.pageAction.setTitle.getCall(0).args[0];

            expect(browser.pageAction.setTitle).to.have.been.calledOnce();
            expect(titleArguments).to.have.all.keys('tabId', 'title');
            expect(titleArguments.tabId).to.be.equal(tabId);
            expect(titleArguments.title).to.be.equal(fakeTitle);
        });
    });
});
