/* BROWSER - CALLBACKS */

chrome.tabs.onRemoved.addListener(tabId =>
{
    chrome.runtime.sendMessage({ issue: "tab-delete", tabId });
});

chrome.tabs.onUpdated.addListener((_, updateInfo, tab) =>
{
    const muted = updateInfo?.mutedInfo?.muted;
    if(muted === undefined) return;

    chrome.runtime.sendMessage({ issue: "tab-mute-update", tab, muted });
});


/* IPC - CALLBACKS */

chrome.runtime.onMessage.addListener(request =>
{
    switch(request.issue)
    {
        // Window state update
        case "window-state-update":
        {
            // Update window state
            chrome.windows.getCurrent().then(window =>
            {
                chrome.windows.update(window.id, { state: request.value });
            });
            break;
        }
    }
});