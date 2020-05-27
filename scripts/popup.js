/* IPC - INITIALIZATION */

// Connect with background script
const port = chrome.extension.connect({ name: "MixFix" });


/* IPC - CALLBACKS */

// Listen to messages from background script
port.onMessage.addListener(message =>
{
    // Handle message depending on issue
    switch(message.issue)
    {
        // Tab data request response
        case "tab-data-request-response":
        {
            onActiveTabDataRequestResponseReceived(message);
            break;
        }
    }
});

function onActiveTabDataRequestResponseReceived(message)
{
    // Update volume slider
    if(message.value?.volume)
        volumeSlider.value = message.value.volume;

    // Update panning slider
    if(message.value?.panning)
        panningSlider.value = message.value.panning;
}


/* IPC - FUNCTIONS */

function postActiveTabDataRequest()
{
    fetchActiveTab(activeTab =>
    {
        port.postMessage
        ({
            tab: activeTab,
            issue: "tab-data-request"
        });
    });
}


/* UI - INITIALIZATION */

// Request tab data
postActiveTabDataRequest();

// Volume slider
const volumeSlider = new mdc.slider.MDCSlider(document.querySelector("#volume-slider"));
volumeSlider.listen("MDCSlider:input", () => onVolumeChanged());

// Volume reset button
const volumeResetRipple = new mdc.ripple.MDCRipple(document.querySelector("#volume-reset-button"));
volumeResetRipple.unbounded = true;
const volumeResetButton = document.querySelector("#volume-reset-button");
volumeResetButton.addEventListener("click", () => resetVolume())

// Panning slider
const panningSlider = new mdc.slider.MDCSlider(document.querySelector("#panning-slider"));
panningSlider.listen("MDCSlider:input", () => onPanningChanged());

// Panning reset button
const panningResetRipple = new mdc.ripple.MDCRipple(document.querySelector("#panning-reset-button"));
panningResetRipple.unbounded = true;
const panningResetButton = document.querySelector("#panning-reset-button");
panningResetButton.addEventListener("click", () => resetPanning())

// Author link
const authorLink = document.querySelector("#author-link");
authorLink.addEventListener("click", () => chrome.tabs.create({ url: "https://spiekermax.github.io/" }));


/* UI - CALLBACKS */

function onVolumeChanged()
{
    const volume = volumeSlider.value;

    fetchActiveTab(activeTab =>
    {
        port.postMessage
        ({
            tab: activeTab,
            issue: "volume-update",
            value: volume
        });
    });
}

function onPanningChanged()
{
    const panning = panningSlider.value;

    fetchActiveTab(activeTab =>
    {
        port.postMessage
        ({
            tab: activeTab,
            issue: "panning-update",
            value: panning
        })
    });
}


/* UI - FUNCTIONS */

function resetVolume()
{
    volumeSlider.value = 100;
    onVolumeChanged();
}

function resetPanning()
{
    panningSlider.value = 0;
    onPanningChanged();
}


/* UTILITY */

function fetchActiveTab(responseListener)
{
    chrome.tabs.query
    (
        { active: true, currentWindow: true }, 
        tabs => responseListener(tabs[0])
    );
}