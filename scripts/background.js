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


/* IPC - FUNCTIONS */

function postTabDataRequestResponse(port, tabData)
{
    port.postMessage
    ({
        issue: "tab-data-request-response",
        value: tabData
    });
}


/* BROWSER - CALLBACKS */

// Remove data of closed tabs
chrome.tabs.onRemoved.addListener(tabId => delete tabData[tabId]);


/* TABS - DATA */

// Initialize tab data
const tabData = {};


/* TABS - FUNCTIONS */

function updateTabVolume(tab, volume)
{
    // Initialize tab data
    if(!tabData[tab.id]) tabData[tab.id] = {};

    // Store tab volume
    tabData[tab.id].volume = volume;

    // Ready tab audio context
    readyTabAudioContext(tab, () =>
    {
        // Update tab volume
        tabData[tab.id].gainNode.gain.setValueAtTime(volume / 100, tabData[tab.id].audioContext.currentTime);
    });
}

function updateTabPanning(tab, panning)
{
    // Initialize tab data
    if(!tabData[tab.id]) tabData[tab.id] = {};

    // Store tab panning
    tabData[tab.id].panning = panning;

    // Ready tab audio context
    readyTabAudioContext(tab, () =>
    {
        // Update tab panning
        tabData[tab.id].panNode.pan.setValueAtTime(panning / 100, tabData[tab.id].audioContext.currentTime);
    });
}

function readyTabAudioContext(tab, onReadyListener)
{
    if(tabData[tab.id].isAudioContextReady)
    {
        // Notify listener
        onReadyListener();
        return;
    }

    chrome.tabCapture.capture
    ({ 
        audio: true,
        video: false,
    }, stream =>
    {
        // Initialize audio context
        tabData[tab.id].audioContext = new AudioContext();
        tabData[tab.id].audioSource = tabData[tab.id].audioContext.createMediaStreamSource(stream);
            
        // Initialize gain node
        tabData[tab.id].gainNode = tabData[tab.id].audioContext.createGain();
            
        // Initialize pan node
        tabData[tab.id].panNode = tabData[tab.id].audioContext.createStereoPanner();
            
        // Integrate nodes
        tabData[tab.id].audioSource.connect(tabData[tab.id].gainNode).connect(tabData[tab.id].panNode).connect(tabData[tab.id].audioContext.destination);

        // Notify listener
        onReadyListener();
    });

    // Indicate the audio context is (being) initialized
    tabData[tab.id].isAudioContextReady = true;
}