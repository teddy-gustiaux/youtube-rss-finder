const browser = chrome;

// Disable the console warning for this file only, as it is used a lot here for the debugging tests
/* eslint no-console: 0 */

describe('Utilities', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        // When writing or debugging tests, replace `stub` by `spy` to display error messages
        sandbox.stub(console, 'info');
    });

    afterEach(() => {
        sandbox.restore();
        browser.flush();
    });

    describe('A method to check if debug is enabled', () => {
        it('should always return false during unit testing', () => {
            expect(Utils.isDebugEnabled()).to.be.equal(false);
        });
    });

    describe('A method to log a debug message or payload to the console', () => {
        it('should not do anything if debug is not enabled', () => {
            sandbox.stub(Utils, 'isDebugEnabled').returns(false);
            Utils.debug('Hello, there!');
            expect(console.info).to.have.not.been.called();
        });

        it('should log the input to the console if debug is enabled', () => {
            sandbox.stub(Utils, 'isDebugEnabled').returns(true);
            Utils.debug('Hello, there!');
            expect(console.info).to.have.been.calledOnce();
        });

        it('should log the debug message if the input is a string', () => {
            sandbox.stub(Utils, 'isDebugEnabled').returns(true);
            const message = 'Hello, there!';
            Utils.debug(message);
            expect(console.info).to.have.been.calledOnceWith(`[YRF] ${message}`);
        });

        it('should log the debug payload if the input is not a string', () => {
            sinon.stub(Utils, 'isDebugEnabled').returns(true);
            const payload = { key: 'value' };
            Utils.debug(payload);
            expect(console.info).to.have.been.calledOnceWith(payload);
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

    describe('A method to check if the provided input is nil', () => {
        it('should return false if the input is nil', () => {
            expect(Utils.isNil(null)).to.be.equal(true);
            expect(Utils.isNil(undefined)).to.be.equal(true);
        });

        it('should return true if the input is not nil', () => {
            expect(Utils.isNil('')).to.be.equal(false);
            expect(Utils.isNil('Hello, world!')).to.be.equal(false);
            expect(Utils.isNil([])).to.be.equal(false);
            expect(Utils.isNil({})).to.be.equal(false);
            expect(Utils.isNil(42)).to.be.equal(false);
        });
    });

    describe('A method to get the list of selectors', () => {
        it('should always return an array', () => {
            expect(Utils.getChannelSelectors()).to.be.an('array');
        });

        it('should always contain non-empty strings', () => {
            Utils.getChannelSelectors().every(selector => {
                expect(selector).to.be.a('string');
                expect(selector.length).to.be.greaterThan(0);
                return true;
            });
        });
    });

    describe('A method to retrieve the YouTube channel URL from the DOM', () => {
        it('should return the URL string if the channel URL was found', () => {
            const address = 'https://www.youtube.com/channel/123';
            const link = document.createElement('link');
            link.href = address;
            sandbox.stub(document, 'querySelector').returns(link);
            expect(Utils.findChannelAddress()).to.be.equal(address);
        });

        it('should return the URL string if the channel URL was found on second try', () => {
            const address = 'https://www.youtube.com/channel/123';
            const link = document.createElement('link');
            link.href = address;
            const stub = sandbox.stub(document, 'querySelector');
            stub.onCall(0).returns(null);
            stub.onCall(1).returns(link);
            expect(Utils.findChannelAddress()).to.be.equal(address);
        });

        it('should return null if the channel URL was not found', () => {
            sandbox.stub(document, 'querySelector').returns(null);
            expect(Utils.findChannelAddress()).to.be.equal(null);
        });
    });

    describe('A method to retrieve the current page canonical URL from the DOM', () => {
        it('should return the URL string if the channel URL was found', () => {
            const address = 'https://www.youtube.com/channel/123';
            const link = document.createElement('link');
            link.href = address;
            sandbox.stub(document, 'querySelector').returns(link);
            expect(Utils.findCanonicalAddress()).to.be.equal(address);
        });

        it('should return null if the channel URL was not found', () => {
            sandbox.stub(document, 'querySelector').returns(null);
            expect(Utils.findCanonicalAddress()).to.be.equal(null);
        });
    });

    describe('A method to get a promise that will resolve after the provided duration', () => {
        it('should return a promise', () => {
            const wait = Utils.delay(100);
            expect(wait).to.be.a('promise');
        });

        it('should not return before the specified time', async () => {
            const start = performance.now();
            await Utils.delay(100);
            const end = performance.now();
            expect(end - start).to.be.at.least(100);
        });
    });
});
