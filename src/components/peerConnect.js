import {Peer} from "https://esm.sh/peerjs@1.5.4?bundle-deps";
import {getLocalStream} from "@/components/localStream.js";
import {ref} from "vue";
import { useComponentRefsStore } from './store.js'
let callerID = ref(null);
let activeCall = null;
let localStream = null;
let latitude = null;
let longitude = null;
let stopRequested = false;
let rejectCall = false;

async function initLocalStream() {
    if (!localStream) {
        try {
            localStream = await getLocalStream();
            console.log("Local stream initialized", localStream);
        } catch (err) {
            console.error("Failed to get local stream:", err);
        }
    }
}

async function sendPeerIDToServer(peerID, role, action) {
    let response;
    const getLocation = () => {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
    };
    try {
        const position = await getLocation();
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
    } catch (error) {
        console.error("Geolocation error:", error);
    }
    try {
        if (action === "add"){
            response = await fetch('https://omeetlyserver.onrender.com/api/registerPeer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ peerID, longitude, latitude, role})
            });
        }
        if (action === "change"){
            console.log(peerID,role)
            response = await fetch('https://omeetlyserver.onrender.com/api/updatePeerRole', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ peerID, role})
            });
        }
        if (action === "delete"){
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
async function getDistanceFromServer(callerID, destID) {
    try {
        const response = await fetch('https://omeetlyserver.onrender.com/api/getDistance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ callerID, destID })
        });

        const data = await response.json();
        console.log('Distance from server:', data.distance);
        return data.distance;
    } catch (error) {
        console.error('Failed to fetch distance:', error);
        return null;
    }
}
let savedPeerID = localStorage.getItem('peerID');
const peer = new Peer(savedPeerID || undefined, {
    config:{
        iceServers: [
            {
                urls: "stun:stun.relay.metered.ca:80",
            },
            {
                urls: "turn:standard.relay.metered.ca:80",
                username: "bbd225f2e3de8a6f79571228",
                credential: "FgUf6sBZjcY4m4bP",
            },
            {
                urls: "turn:standard.relay.metered.ca:80?transport=tcp",
                username: "bbd225f2e3de8a6f79571228",
                credential: "FgUf6sBZjcY4m4bP",
            },
            {
                urls: "turn:standard.relay.metered.ca:443",
                username: "bbd225f2e3de8a6f79571228",
                credential: "FgUf6sBZjcY4m4bP",
            },
            {
                urls: "turns:standard.relay.metered.ca:443?transport=tcp",
                username: "bbd225f2e3de8a6f79571228",
                credential: "FgUf6sBZjcY4m4bP",
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
        await sendPeerIDToServer(callerID.value,"calling", "change");
        const peerIDs = await fetchPeerIDs();
        const destID = await generateID(peerIDs);
        if (destID) {
            if (activeCall){
                return;
            }
            await peerConnect(destID, localStream);
        } else {
            console.warn('No valid peer ID available for connection.');
            await sendPeerIDToServer(callerID.value,"searching", "change");
        }
    } catch (error) {
        console.error('Error during peer connection:', error);
    }
}
peer.on('open', async function(id) {
    await initLocalStream();
    callerID.value = id;
    localStorage.setItem('peerID', id);
    console.log('My peer ID is: ' + id);
    await sendPeerIDToServer(id, "idle", "add");
});

async function generateID(peers){
    const store = useComponentRefsStore()
    const targetDistance = store.targetDistance
    if (peers.length < 1) {
        console.warn('No other peers available to connect to.');
        return null;
    }
    let candidate;
    let distance;
    let attempts = 0;
    do {
        candidate = peers[Math.floor(Math.random() * peers.length)];
        distance = await getDistanceFromServer(callerID.value,candidate.peerID);
        console.log(distance)
        attempts++;
        if (attempts > 10) {
            console.warn("Couldn't find a suitable peer after 10 tries.");
            return null;
        }
    } while (candidate.peerID === callerID.value || candidate.role === "idle" || candidate.role === "stopIdle" || candidate.role === "calling" || distance > targetDistance);
    console.log(candidate.peerID);
    return candidate.peerID;
}

peer.on('call', function(call) {
    if (activeCall) {
        console.log("Already in a call, rejecting new one.");
        rejectCall = true;
        activeCall.close()
        return;
    }
    let distance;
    const store = useComponentRefsStore()
    const targetDistance = store.targetDistance
    console.log(targetDistance)
    distance = getDistanceFromServer(callerID.value,call.peer)
    console.log(distance);
    if (distance>targetDistance) {
        console.log("Refusing call, too far.")
        call.close()
        return;
    }
    call.answer(localStream);
    activeCall = call;
    activeCall.on('stream', async function(stream) {
        await sendPeerIDToServer(callerID.value,"calling", "change");
        window.dispatchEvent(new CustomEvent('remote-stream', { detail: stream }));
    });
    activeCall.on('close', async () => {
        await closeCall()
    });
});
async function closeCall(){
    console.log('Call closed');
    activeCall = null;
    if (stopRequested){
        await sendPeerIDToServer(callerID.value, "stopIdle", "change")
        stopRequested = false;
    }
    else if (rejectCall){
        await sendPeerIDToServer(callerID.value, "searching", "change")
        rejectCall = false;
        await handlePeerConnection()
    }
    else{
        await sendPeerIDToServer(callerID.value, "searching", "change")
        await handlePeerConnection()
    }
}

export async function stopConnection() {
    stopRequested = true;
    if (activeCall) {
        activeCall.close();
    }
    await sendPeerIDToServer(callerID.value, "stopIdle", "change");
    stopRequested = false;
}

async function peerConnect(destID, localStream) {
    console.log(localStream)
    activeCall = peer.call(destID, localStream);
    let streamTimeout = setTimeout(async () => {
        console.warn("No stream received — assuming remote peer is unresponsive.");
        await sendPeerIDToServer(destID, "", "delete");
        await sendPeerIDToServer(callerID.value, "searching", "change");
        await handlePeerConnection()
    }, 2000);
    activeCall.on('stream', function(stream) {
        clearTimeout(streamTimeout);
        window.dispatchEvent(new CustomEvent('remote-stream', { detail: stream }));
    });
    activeCall.on('close', async () => {
        await closeCall()
    });
}

window.addEventListener('beforeunload', () => {
    if (activeCall) {
        activeCall.close();
        activeCall = null;
    }
    if (peer && !peer.destroyed) {
        peer.destroy();
    }
    if (callerID.value) {
        navigator.sendBeacon('https://omeetlyserver.onrender.com/api/destroyPeer', JSON.stringify({ peerID: callerID.value }));
        localStorage.removeItem('peerID');
    }
});
peer.on('close', () => {
    console.log('Peer connection closed');
    callerID.value = null;
});
