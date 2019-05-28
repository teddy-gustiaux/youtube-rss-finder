const browser = chrome;

describe('Content-scripts utilities', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
        browser.flush();
    });

    describe('A method to check if debug is enabled', () => {
        it('should always return false during unit testing', () => {
            expect(isDebugEnabled()).to.be.equal(false);
        });
    });
});
