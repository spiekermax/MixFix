main();

async function main()
{
    /* OFFSCREEN - INITIALIZATION */
    
    await initOffscreen();

    async function initOffscreen()
    {
        const existingContexts = await chrome.runtime.getContexts({});
        const offscreenDocument = existingContexts.find(it => it.contextType === "OFFSCREEN_DOCUMENT");
    
        if(!offscreenDocument)
        {
            await chrome.offscreen.createDocument
            ({
                url: "offscreen.html",
                reasons: [chrome.offscreen.Reason.USER_MEDIA],
                justification: "Modify volume and/or panning of tabs."
            });
        }
    
        return offscreenDocument;
    }

    
    /* IPC - INITIALIZATION */
    
    // Connect with background script
    const port = chrome.runtime.connect({ name: "MixFix" });
    
    
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
        if(message.value?.volume !== undefined)
            volumeSlider.value = sliderValueFromVolume(message.value.volume);
    
        // Update panning slider
        if(message.value?.panning !== undefined)
            panningSlider.value = sliderValueFromPanning(message.value.panning);
    }
    
    
    /* IPC - FUNCTIONS */

    let wasMediaStreamPosted = false;
    function postTabMediaStream()
    {
        if (wasMediaStreamPosted) return;

        fetchActiveTab(async tab =>
        {
            const streamId = await chrome.tabCapture.getMediaStreamId({});

            port.postMessage
            ({
                streamId,
                tab,
                issue: "tab-media-stream",
            });

            wasMediaStreamPosted = true;
        });
    }
    
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
    const volumeSliderText = document.querySelector("#volume-slider .mdc-slider__pin-value-marker-custom");
    
    // Volume reset button
    const volumeResetRipple = new mdc.ripple.MDCRipple(document.querySelector("#volume-reset-button"));
    volumeResetRipple.unbounded = true;
    const volumeResetButton = document.querySelector("#volume-reset-button");
    volumeResetButton.addEventListener("click", () => resetVolume())
    
    // Panning slider
    const panningSlider = new mdc.slider.MDCSlider(document.querySelector("#panning-slider"));
    panningSlider.listen("MDCSlider:input", () => onPanningSliderChanged());
    const panningSliderText = document.querySelector("#panning-slider .mdc-slider__pin-value-marker-custom");
    
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
        const sliderValue = volumeSlider.value;
        const volume = volumeFromSliderValue(sliderValue);
    
        volumeSliderText.innerHTML = volume.toFixed(0);
    
        postTabMediaStream();
        postTabVolumeUpdate(volume);
    }
    
    function onPanningSliderChanged()
    {
        const sliderValue = panningSlider.value;
        const panning = panningFromSliderValue(sliderValue);
    
        panningSliderText.innerHTML = panning.toFixed(0);
    
        postTabMediaStream();
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
    
    
    /* UTILITY */
    
    function sliderValueFromVolume(volume)
    {
        return volume <= 100 ? volume : 100 + (volume - 100) / 2;
    }
    
    function volumeFromSliderValue(sliderValue)
    {
        return sliderValue <= 100 ? sliderValue : 100 + (sliderValue - 100) * 2;
    }
    
    function sliderValueFromPanning(panning)
    {
        return panning;
    }
    
    function panningFromSliderValue(sliderValue)
    {
        return sliderValue;
    }
}