chrome.webNavigation.onErrorOccurred.addListener((details) => {
    if (details.frameId === 0) {
        // Check if error is connection related
        const error = details.error || '';
        if (
            error.includes('net::ERR_INTERNET_DISCONNECTED') ||
            error.includes('net::ERR_CONNECTION_RESET') ||
            error.includes('net::ERR_NAME_NOT_RESOLVED')
        ) {
            chrome.tabs.update(details.tabId, { url: 'game.html' });
        }
    }
});
