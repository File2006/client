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

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
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
        if (action === true){
            response = await fetch('https://omeetlyserver.onrender.com/api/registerPeer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ peerID, longitude, latitude, role})
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
let savedPeerID = localStorage.getItem('peerID');
const peer = new Peer(savedPeerID || undefined, {
    config:{
        iceServers: [
            {
                urls: "stun:stun.relay.metered.ca:80",
            },
            {
                urls: "turn:standard.relay.metered.ca:80",
                username: "895ef7a59277ee4b13e876ff",
                credential: "hFWn4sRWym295EBg",
            },
            {
                urls: "turn:standard.relay.metered.ca:80?transport=tcp",
                username: "895ef7a59277ee4b13e876ff",
                credential: "hFWn4sRWym295EBg",
            },
            {
                urls: "turn:standard.relay.metered.ca:443",
                username: "895ef7a59277ee4b13e876ff",
                credential: "hFWn4sRWym295EBg",
            },
            {
                urls: "turns:standard.relay.metered.ca:443?transport=tcp",
                username: "895ef7a59277ee4b13e876ff",
                credential: "hFWn4sRWym295EBg",
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
    await initLocalStream();
    callerID.value = id;
    localStorage.setItem('peerID', id);
    console.log('My peer ID is: ' + id);
    await sendPeerIDToServer(id, "idle", true);
});

async function generateID(peers){
    const store = useComponentRefsStore()
    const targetDistance = store.targetDistance
    console.log(targetDistance)
    console.log(peers);
    if (peers.length < 1) {
        console.warn('No other peers available to connect to.');
        return null;
    }
    let candidate;
    let distance;
    let attempts = 0;
    do {
        candidate = peers[Math.floor(Math.random() * peers.length)];
        distance = getDistance(latitude,longitude,candidate.latitude,candidate.longitude);
        console.log(candidate.latitude, candidate.longitude);
        console.log(distance)
        attempts++;
        if (attempts > 3) {
            console.warn("Couldn't find a suitable peer after 10 tries.");
            return null;
        }
    } while (candidate.peerID === callerID.value || candidate.role === "idle" || distance > targetDistance);
    console.log(candidate.peerID);
    return candidate.peerID;
}

peer.on('call', function(call) {
    if (activeCall) {
        console.log("Already in a call, rejecting new one.");
        call.close()
        return;
    }
    const remoteLatitude = call.metadata?.latitude;
    const remoteLongitude = call.metadata?.longitude;

    console.log("My location:", latitude, longitude);
    console.log("Caller location:", remoteLatitude, remoteLongitude);
    let distance;
    const store = useComponentRefsStore()
    const targetDistance = store.targetDistance
    console.log(targetDistance)
    distance = getDistance(latitude,longitude,remoteLatitude,remoteLongitude);
    console.log(distance);
    if (distance>targetDistance) {
        console.log("Refusing call, too far.")
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

export async function stopConnection() {
    stopRequested = true;
    if (activeCall) {
        activeCall.close();
    }
    await sendPeerIDToServer(callerID.value, "idle", true);
    activeCall = null;
}

async function peerConnect(destID, localStream) {
    console.log(localStream)
    activeCall = peer.call(destID, localStream, {
        metadata: {
            latitude: latitude,
            longitude: longitude
        }
    });
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
            stopRequested = false;
        }
    });
}

window.addEventListener('beforeunload', (event) => {
    // Synchronous cleanup to maximize reliability
    if (activeCall) {
        activeCall.close();
        activeCall = null;
    }
    if (peer && !peer.destroyed) {
        peer.destroy();
    }
    // Send a synchronous beacon for peer ID removal
    if (callerID.value) {
        navigator.sendBeacon('https://omeetlyserver.onrender.com/api/destroyPeer', JSON.stringify({ peerID: callerID.value }));
        localStorage.removeItem('peerID');
    }
});
peer.on('close', () => {
    console.log('Peer connection closed');
    callerID.value = null;
});
