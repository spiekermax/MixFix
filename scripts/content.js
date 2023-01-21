// React to fullscreen change events
document.addEventListener("fullscreenchange", () =>
{
    if(!document.fullscreenElement)
    {
        // Send window state update
        chrome.runtime.sendMessage({ issue: "window-state-update", value: "maximized" });
    }
    else
    {
        // Send window state update
        chrome.runtime.sendMessage({ issue: "window-state-update", value: "fullscreen" });
    }
});