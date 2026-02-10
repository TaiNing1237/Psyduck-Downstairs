document.getElementById('start-btn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'game.html' });
});
