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
            onTabDataRequestResponseReceived(message);
            break;
        }
    }
});

function onTabDataRequestResponseReceived(message)
{
    // Update volume slider
    if(message.value?.volume)
        volumeSlider.value = message.value.volume;

    // Update panning slider
    if(message.value?.panning)
        panningSlider.value = message.value.panning;
}


/* IPC - FUNCTIONS */

function postTabDataRequest()
{
    fetchActiveTab(tab =>
    {
        port.postMessage
        ({
            tab: tab,
            issue: "tab-data-request",
        });
    });
}

function postTabVolumeUpdate(volume)
{
    fetchActiveTab(tab =>
    {
        port.postMessage
        ({
            tab: tab,
            issue: "tab-volume-update",
            value: volume
        });
    });
}

function postTabPanningUpdate(panning)
{
    fetchActiveTab(tab =>
    {
        port.postMessage
        ({
            tab: tab,
            issue: "tab-panning-update",
            value: panning
        })
    });
}


/* BROWSER - FUNCTIONS */

function fetchActiveTab(onFetchedListener)
{
    chrome.tabs.query
    (
        { active: true, currentWindow: true }, 
        tabs => onFetchedListener(tabs[0])
    );
}


/* UI - INITIALIZATION */

// Request tab data
postTabDataRequest();

// Volume slider
const volumeSlider = new mdc.slider.MDCSlider(document.querySelector("#volume-slider"));
volumeSlider.listen("MDCSlider:input", () => onVolumeSliderChanged());

// Volume reset button
const volumeResetRipple = new mdc.ripple.MDCRipple(document.querySelector("#volume-reset-button"));
volumeResetRipple.unbounded = true;
const volumeResetButton = document.querySelector("#volume-reset-button");
volumeResetButton.addEventListener("click", () => resetVolume())

// Panning slider
const panningSlider = new mdc.slider.MDCSlider(document.querySelector("#panning-slider"));
panningSlider.listen("MDCSlider:input", () => onPanningSliderChanged());

// Panning reset button
const panningResetRipple = new mdc.ripple.MDCRipple(document.querySelector("#panning-reset-button"));
panningResetRipple.unbounded = true;
const panningResetButton = document.querySelector("#panning-reset-button");
panningResetButton.addEventListener("click", () => resetPanning())

// Author link
const authorLink = document.querySelector("#author-link");
authorLink.addEventListener("click", () => chrome.tabs.create({ url: "https://spiekermax.github.io/" }));


/* UI - CALLBACKS */

function onVolumeSliderChanged()
{
    const volume = volumeSlider.value;
    postTabVolumeUpdate(volume)
}

function onPanningSliderChanged()
{
    const panning = panningSlider.value;
    postTabPanningUpdate(panning);
}


/* UI - FUNCTIONS */

function resetVolume()
{
    volumeSlider.value = 100;
    onVolumeSliderChanged();
}

function resetPanning()
{
    panningSlider.value = 0;
    onPanningSliderChanged();
}