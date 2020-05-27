/* DATA */

// Initialize tab data map
const tabDataMap = {};


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
            // Volume update
            case "volume-update":
            {
                // Update tab volume
                updateTabVolume(message.tab, message.value);

                break;
            }
            
            // Panning update
            case "panning-update":
            {
                // Update tab panning
                updateTabPanning(message.tab, message.value);

                break;
            }

            // Tab data request
            case "tab-data-request":
            {
                port.postMessage
                ({
                    tab: message.tab,
                    issue: "tab-data-request-response",
                    value: tabDataMap[message.tab.id]
                });

                break;
            }
        }
    });
});


/* METHODS */

function updateTabVolume(tab, volume)
{
    // Initialize tab data
    if(!tabDataMap[tab.id]) tabDataMap[tab.id] = {};

    // Store tab volume
    tabDataMap[tab.id].volume = volume;

    // Ready tab audio context
    readyTabAudioContext(tab, () =>
    {
        // Update tab volume
        tabDataMap[tab.id].gainNode.gain.setValueAtTime(volume / 100, tabDataMap[tab.id].audioContext.currentTime);
    });
}

function updateTabPanning(tab, panning)
{
    // Initialize tab data
    if(!tabDataMap[tab.id]) tabDataMap[tab.id] = {};

    // Store tab panning
    tabDataMap[tab.id].panning = panning;

    // Ready tab audio context
    readyTabAudioContext(tab, () =>
    {
        // Update tab panning
        tabDataMap[tab.id].panNode.pan.setValueAtTime(panning / 100, tabDataMap[tab.id].audioContext.currentTime);
    });
}

function readyTabAudioContext(tab, onReadyListener)
{
    if(tabDataMap[tab.id].isAudioContextReady)
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
        tabDataMap[tab.id].audioContext = new AudioContext();
        tabDataMap[tab.id].audioSource = tabDataMap[tab.id].audioContext.createMediaStreamSource(stream);
            
        // Initialize gain node
        tabDataMap[tab.id].gainNode = tabDataMap[tab.id].audioContext.createGain();
            
        // Initialize pan node
        tabDataMap[tab.id].panNode = tabDataMap[tab.id].audioContext.createStereoPanner();
            
        // Integrate nodes
        tabDataMap[tab.id].audioSource.connect(tabDataMap[tab.id].gainNode).connect(tabDataMap[tab.id].panNode).connect(tabDataMap[tab.id].audioContext.destination);

        // Notify listener
        onReadyListener();
    });

    // Indicate the audio context is (being) initialized
    tabDataMap[tab.id].isAudioContextReady = true;
}