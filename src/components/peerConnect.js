import {Peer} from "https://esm.sh/peerjs@1.5.4?bundle-deps";
import {ref} from "vue";
import {getLocalStream} from "@/components/localStream.js";
export const callerID = ref(null);
export let activeCall = null;
export const localStream = await getLocalStream();
export async function sendPeerIDToServer(peerID, action) {
    let response;
    try {
        if (action === true){
            response = await fetch('http://localhost:9000/api/registerPeer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ peerID: peerID })
            });
        }
        else{
            response = await fetch('http://localhost:9000/api/destroyPeer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ peerID: peerID })
            });
        }
        const data = await response.json();
        console.log('Server Response:', data);
    } catch (error) {
        console.error('Error sending peer ID:', error);
    }
}
const peer = new Peer({
    config:{
        iceServers: [
            {
                urls: "stun:stun.relay.metered.ca:80",
            },
            {
                urls: "turn:standard.relay.metered.ca:80",
                username: "926ecda2bd43330f7c21f249",
                credential: "p0A4ccpTbwD15t6W",
            },
            {
                urls: "turn:standard.relay.metered.ca:80?transport=tcp",
                username: "926ecda2bd43330f7c21f249",
                credential: "p0A4ccpTbwD15t6W",
            },
            {
                urls: "turn:standard.relay.metered.ca:443",
                username: "926ecda2bd43330f7c21f249",
                credential: "p0A4ccpTbwD15t6W",
            },
            {
                urls: "turns:standard.relay.metered.ca:443?transport=tcp",
                username: "926ecda2bd43330f7c21f249",
                credential: "p0A4ccpTbwD15t6W",
            },
        ],
    }
});
async function fetchPeerIDs() {
    try {
        const response = await fetch('http://localhost:9000/api/getPeers');
        const data = await response.json();
        console.log('Received peer IDs from backend:', data);
        return data.idList;
    } catch (error) {
        console.error('Error fetching peer IDs:', error);
        return [];
    }
}
export async function handlePeerConnection() {
    try {
        if (activeCall) {
            activeCall.close();
            activeCall = null;
        }
        await sendPeerIDToServer(callerID.value, false);
        const peerIDs = await fetchPeerIDs();
        const destID = await generateID(peerIDs);
        if (destID) {
            console.log(localStream);
            await peerConnect(destID, localStream);
        } else {
            console.warn('No valid peer ID available for connection.');
            await sendPeerIDToServer(callerID.value, true);
        }
    } catch (error) {
        console.error('Error during peer connection:', error);
    }
}
peer.on('open', async function(id) {
    callerID.value = id;
    console.log('My peer ID is: ' + id);
    await sendPeerIDToServer(id, true);
});

export async function generateID(idList){
    console.log(idList);
    if (idList.length < 1) {
        console.warn('No other peers available to connect to.');
        return null;
    }
    let id;
    do {
        id = idList[Math.floor(Math.random() * idList.length)];
    } while (id === callerID.value);
    console.log(id);
    return id;
}
peer.on('call', function(call) {
    if (activeCall) {
        console.log("Already in a call, rejecting new one.");
        call.close()
        return;
    }
    call.answer(localStream);
    activeCall = call;
    sendPeerIDToServer(callerID.value, false);
    activeCall.on('stream', function(stream) {
        window.dispatchEvent(new CustomEvent('remote-stream', { detail: stream }));
    });
    activeCall.on('close', async () => {
        console.log('Call closed');
        activeCall = null;
        await sendPeerIDToServer(callerID.value, true);
        if (!stopRequested){
            await handlePeerConnection()
        }
    });
});
let stopRequested = false;

export async function stopConnection() {
    stopRequested = true;
    if (activeCall) {
        activeCall.close();
    }
    await sendPeerIDToServer(callerID.value, true);
    activeCall = null;
}

export async function peerConnect(destID, localStream) {
    console.log(localStream)
    activeCall = peer.call(destID,localStream);
    activeCall.on('stream', function(stream) {
        window.dispatchEvent(new CustomEvent('remote-stream', { detail: stream }));
    });
    activeCall.on('close', async () => {
        console.log('Call closed');
        activeCall = null;
        await sendPeerIDToServer(callerID.value, true);
        if (!stopRequested) {
            await handlePeerConnection();
        } else {
            stopRequested = false; // reset for future calls
        }
    });
}

window.addEventListener('beforeunload', async () => {
    if (activeCall){
        activeCall.close();
    }
    if (peer && !peer.destroyed) {
        peer.destroy();
    }
    activeCall.on('close', async () => {
        console.log('Call closed');
        activeCall = null;
    });
});
peer.on('close', async function() {
    await sendPeerIDToServer(callerID.value, false);
})
