const browser = chrome;

// Disable the console warning for this file only, as it is used a lot here for the debugging tests
/* eslint no-console: 0 */

describe('Background utilities', () => {
    let sandbox;

    function setupConsoleStubbing() {
        // When writing or debugging tests, replace `stub` by `spy` to display error messages
        sinon.stub(console, 'info');
    }

    function cleanUpConsoleStubbing() {
        console.info.restore();
    }

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
        browser.flush();
    });

    describe('A method to log a debug message or payload to the console', () => {
        it('should not do anything if debug is not enabled', () => {
            setupConsoleStubbing();
            DEBUG = false;
            Utils.debug('Hello, there!');
            expect(console.info).to.have.not.been.called();
            cleanUpConsoleStubbing();
        });

        it('should log the input to the console if debug is enabled', () => {
            setupConsoleStubbing();
            DEBUG = true;
            Utils.debug('Hello, there!');
            expect(console.info).to.have.been.calledOnce();
            cleanUpConsoleStubbing();
            DEBUG = false;
        });

        it('should log the debug message if the input is a string', () => {
            setupConsoleStubbing();
            DEBUG = true;
            const message = 'Hello, there!';
            Utils.debug(message);
            expect(console.info).to.have.been.calledOnceWith(`[YRF] ${message}`);
            cleanUpConsoleStubbing();
            DEBUG = false;
        });

        it('should log the debug payload if the input is not a string', () => {
            setupConsoleStubbing();
            DEBUG = true;
            const payload = { key: 'value' };
            Utils.debug(payload);
            expect(console.info).to.have.been.calledOnceWith(payload);
            cleanUpConsoleStubbing();
            DEBUG = false;
        });
    });

    describe('A method to create an instance of the URL object from an URL string', () => {
        it('should return an URL object if the URL is valid', () => {
            expect(Utils.buildUrlObject('http://example.com')).to.be.an.instanceOf(URL);
            expect(Utils.buildUrlObject('https://example.com')).to.be.an.instanceOf(URL);
            expect(Utils.buildUrlObject('http://www.example.com')).to.be.an.instanceOf(URL);
            expect(Utils.buildUrlObject('https://www.example.com')).to.be.an.instanceOf(URL);
            expect(Utils.buildUrlObject('file:///index.html')).to.be.an.instanceOf(URL);
            expect(Utils.buildUrlObject('ftp://ftp.example.com')).to.be.an.instanceOf(URL);
            expect(Utils.buildUrlObject('about:blank')).to.be.an.instanceOf(URL);
            expect(Utils.buildUrlObject('moz-extension://id/options.html')).to.be.an.instanceOf(
                URL,
            );
        });

        it('should return null if the URL is not valid', () => {
            expect(Utils.buildUrlObject('http//example.com')).to.be.equal(null);
            expect(Utils.buildUrlObject('https//example.com')).to.be.equal(null);
            expect(Utils.buildUrlObject('file///index.html')).to.be.equal(null);
            expect(Utils.buildUrlObject('ftp//ftp.example.com')).to.be.equal(null);
            expect(Utils.buildUrlObject('aboutblank')).to.be.equal(null);
            expect(Utils.buildUrlObject('moz-extension//id/options.html')).to.be.equal(null);
            expect(Utils.buildUrlObject('randomstring')).to.be.equal(null);
        });
    });

    describe('A method to check if an HTTP-based URL is valid', () => {
        it('should return true if the URL is valid', () => {
            expect(Utils.isValidURL('http://example.com')).to.be.true();
            expect(Utils.isValidURL('https://example.com')).to.be.true();
            expect(Utils.isValidURL('http://www.example.com')).to.be.true();
            expect(Utils.isValidURL('https://www.example.com')).to.be.true();
        });

        it('should return false if the URL is not valid', () => {
            expect(Utils.isValidURL('http//example.com')).to.be.false();
            expect(Utils.isValidURL('httpss://example.com')).to.be.false();
            expect(Utils.isValidURL('file:///index.html')).to.be.false();
            expect(Utils.isValidURL('ftp://ftp.example.com')).to.be.false();
            expect(Utils.isValidURL('about:blank')).to.be.false();
            expect(Utils.isValidURL('moz-extension://id/options.html')).to.be.false();
        });
    });
});
