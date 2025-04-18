import {Peer} from "https://esm.sh/peerjs@1.5.4?bundle-deps";
import {ref} from "vue";
import {getLocalStream} from "@/components/localStream.js";
export const callerID = ref(null);
export let activeCall = null;
export const localStream = await getLocalStream();
export async function sendPeerIDToServer(peerID, role, action) {
    let response;
    try {
        if (action === true){
            response = await fetch('https://omeetlyserver.onrender.com/api/registerPeer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ peerID,role})
            });
        }
        else{
            response = await fetch('https://omeetlyserver.onrender.com/api/destroyPeer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ peerID })
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
        const response = await fetch('https://omeetlyserver.onrender.com/api/getPeers');
        const data = await response.json();
        console.log('Received peer IDs from backend:', data);
        return data.peers;
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
        await sendPeerIDToServer(callerID.value,"", false);
        const peerIDs = await fetchPeerIDs();
        const destID = await generateID(peerIDs);
        if (destID) {
            console.log(localStream);
            if (activeCall){
                return;
            }
            await peerConnect(destID, localStream);
        } else {
            console.warn('No valid peer ID available for connection.');
            await sendPeerIDToServer(callerID.value,"searching", true);
        }
    } catch (error) {
        console.error('Error during peer connection:', error);
    }
}
peer.on('open', async function(id) {
    callerID.value = id;
    console.log('My peer ID is: ' + id);
    await sendPeerIDToServer(id, "idle", true);
});

export async function generateID(peers){
    console.log(peers);
    if (peers.length < 1) {
        console.warn('No other peers available to connect to.');
        return null;
    }
    let candidate;
    let attempts = 0;
    do {
        candidate = peers[Math.floor(Math.random() * peers.length)];
        attempts++;
        if (attempts > 10) {
            console.warn("Couldn't find a suitable peer after 10 tries.");
            return null;
        }
    } while (candidate.peerID === callerID.value || candidate.role === "idle");
    console.log(candidate.peerID);
    return candidate.peerID;
}
peer.on('call', function(call) {
    if (activeCall) {
        console.log("Already in a call, rejecting new one.");
        call.close()
        return;
    }
    call.answer(localStream);
    activeCall = call;
    sendPeerIDToServer(callerID.value,"", false);
    activeCall.on('stream', function(stream) {
        window.dispatchEvent(new CustomEvent('remote-stream', { detail: stream }));
    });
    activeCall.on('close', async () => {
        console.log('Call closed');
        activeCall = null;
        if (!stopRequested){
            await sendPeerIDToServer(callerID.value, "searching", true)
            await handlePeerConnection()
        }
        else{
            await sendPeerIDToServer(callerID.value, "idle", true)
        }
    });
});
let stopRequested = false;

export async function stopConnection() {
    stopRequested = true;
    if (activeCall) {
        activeCall.close();
    }
    await sendPeerIDToServer(callerID.value, "idle", true);
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
        if (!stopRequested) {
            await sendPeerIDToServer(callerID.value, "searching", true);
            await handlePeerConnection();
        } else {
            await sendPeerIDToServer(callerID.value, "idle", true);
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
    await sendPeerIDToServer(callerID.value, "",false);
})
