function notifyExtension() {
    const ELEMENT = 'yt-formatted-string';
    const ID = 'owner-name';
    const container = window.document.querySelector(`${ELEMENT}#${ID}`);
    let url;
    if (container !== undefined) {
        url = container.firstChild.href;
        if (url === undefined) url = '';
    } else {
        url = '';
    }
    return url;
}

notifyExtension();
