/* IPC - CALLBACKS */

// Listen to connection requests
chrome.extension.onConnect.addListener(port => 
{
    // Listen to messages
    port.onMessage.addListener(message =>
    {
        // Handle message depending on issue
        switch(message.issue)
        {
            // Tab volume update
            case "tab-volume-update":
            {
                // Update tab volume
                updateTabVolume(message.tab, message.value);
                break;
            }
            
            // Tab panning update
            case "tab-panning-update":
            {
                // Update tab panning
                updateTabPanning(message.tab, message.value);
                break;
            }

            // Tab data request
            case "tab-data-request":
            {
                // Post tab data
                postTabDataRequestResponse(port, tabData[message.tab.id]);
                break;
            }
        }
    });
});

// Listen to connectionless messages
chrome.runtime.onMessage.addListener(request =>
{
    switch(request.issue)
    {
        // Window state update
        case "window-state-update":
        {
            // Update window state
            chrome.windows.getCurrent(window =>
            {
                chrome.windows.update(window.id, { state: request.value });
            });
            break;
        }
    }
});


/* IPC - FUNCTIONS */

function postTabDataRequestResponse(port, tabData)
{
    port.postMessage
    ({
        issue: "tab-data-request-response",
        value: tabData
    });
}


/* BROWSER INITIALIZATION */

const theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
changeIcon(theme);


/* BROWSER - CALLBACKS */

// Remove data of closed tabs
chrome.tabs.onRemoved.addListener(tabId => delete tabData[tabId]);

chrome.tabs.onUpdated.addListener((_, changeInfo, tab) =>
{
    const muted = changeInfo?.mutedInfo?.muted;
    if(muted === undefined) return;

    updateTabMuted(tab, changeInfo.mutedInfo.muted);
});


/* BROWSER - FUNCTIONS */

function changeIcon(theme)
{
    chrome.browserAction.setIcon
    ({
        path:
        {
            "16": `images/icon16-${theme}.png`,
            "32": `images/icon32-${theme}.png`,
            "48": `images/icon48-${theme}.png`,
            "64": `images/icon64-${theme}.png`,
            "128": `images/icon128-${theme}.png`
        }
    });
}


/* TABS - DATA */

// Initialize tab data
const tabData = {};


/* TABS - FUNCTIONS */

async function updateTabMuted(tab, muted)
{
    // Initialize tab data
    if(!tabData[tab.id]) tabData[tab.id] = {};

    // Store if tab is muted
    tabData[tab.id].muted = muted;

    // Derrive effective volume
    const volume = muted ? 0 : tabData[tab.id].volume ?? 100;

    try
    {
        // Await tab audio context
        await readyTabAudioContext(tab);

        // Update tab volume
        tabData[tab.id].gainNode.gain.setValueAtTime(volume / 100, tabData[tab.id].audioContext.currentTime);
    }
    catch(error) {}
}

async function updateTabVolume(tab, volume)
{
    // Initialize tab data
    if(!tabData[tab.id]) tabData[tab.id] = {};

    // Store tab volume
    tabData[tab.id].volume = volume;

    // Derrive effective volume
    volume = tabData[tab.id].muted ? 0 : volume;

    try
    {
        // Ready tab audio context
        await readyTabAudioContext(tab);

        // Update tab volume
        tabData[tab.id].gainNode.gain.setValueAtTime(volume / 100, tabData[tab.id].audioContext.currentTime);
    }
    catch(error) {}
}

async function updateTabPanning(tab, panning)
{
    // Initialize tab data
    if(!tabData[tab.id]) tabData[tab.id] = {};

    // Store tab panning
    tabData[tab.id].panning = panning;

    try
    {
        // Ready tab audio context
        await readyTabAudioContext(tab);

        // Update tab panning
        tabData[tab.id].panNode.pan.setValueAtTime(panning / 100, tabData[tab.id].audioContext.currentTime);
    }
    catch(error) {}
}

function readyTabAudioContext(tab)
{
    // Immediately resolve if audio context already bound
    if(tabData[tab.id].audioContext !== undefined)
        return Promise.resolve();

    // Wait for audio context when one is already being instantiated
    if(tabData[tab.id].awaitAudioContext !== undefined)
        return tabData[tab.id].awaitAudioContext;

    // Create promise for audio context
    tabData[tab.id].awaitAudioContext = new Promise((resolve, reject) =>
    {
        // Immediately resolve if audio context already bound
        if(tabData[tab.id].audioContext !== undefined) resolve();

        // Bind audio context to tab
        chrome.tabCapture.capture
        ({ 
            audio: true,
            video: false,
        }, stream =>
        {
            // Prevent invalid initializations
            if(!(stream instanceof MediaStream))
            {
                // Remove the promise since instantiation failed and should be retried
                tabData[tab.id].awaitAudioContext = undefined;

                // Indicate something went wrong
                reject(); return;
            }
    
            // Initialize audio context
            tabData[tab.id].audioContext = new AudioContext();
            tabData[tab.id].audioSource = tabData[tab.id].audioContext.createMediaStreamSource(stream);
                
            // Initialize gain node
            tabData[tab.id].gainNode = tabData[tab.id].audioContext.createGain();
                
            // Initialize pan node
            tabData[tab.id].panNode = tabData[tab.id].audioContext.createStereoPanner();
                
            // Integrate nodes
            tabData[tab.id].audioSource.connect(tabData[tab.id].gainNode).connect(tabData[tab.id].panNode).connect(tabData[tab.id].audioContext.destination);
    
            // Resolve promise
            resolve();
        });
    });

    return tabData[tab.id].awaitAudioContext;
}