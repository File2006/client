import {Peer} from "https://esm.sh/peerjs@1.5.4?bundle-deps";
import {getLocalStream} from "@/components/localStream.js";
import { useComponentRefsStore } from './store.js'

let callerID = null;
let activeCall = null;
let localStream = null;
let latitude = null;
let longitude = null;
let distance = null;
let stopRequested = false;
let rejectCall = false;
let lookingError = false;
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

async function initLocalStream() {
    if (!localStream) {
        try {
            localStream = await getLocalStream();
        } catch (error) {
            console.error("Failed to get local stream:", error);
        }
    }
}

async function sendPeerIDToServer(peerID, role, action) {
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
            await fetch('https://omeetlyserver.onrender.com/api/registerPeer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ peerID, longitude, latitude, role})
            });
        }
        if (action === "change"){
            await fetch('https://omeetlyserver.onrender.com/api/updatePeerRole', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ peerID, role})
            });
        }
        if (action === "delete"){
            await fetch('https://omeetlyserver.onrender.com/api/destroyPeer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ peerID })
            });
        }
        if (!lookingError){
            window.dispatchEvent(new CustomEvent("update-role", { detail: role }));
        }
    } catch (error) {
        console.error('Error sending peer ID:', error);
    }
}

peer.on('open', async function(id) {
    try {
        await initLocalStream();
        callerID = id;
        localStorage.setItem('peerID', id);
        await sendPeerIDToServer(id, "idle", "add");
    } catch (error) {
        console.error('Error during peer connection setup:', error);
    }
});

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
        return data.distance;
    } catch (error) {
        console.error('Failed to fetch distance:', error);
        return null;
    }
}

async function fetchPeerIDs() {
    try {
        const response = await fetch('https://omeetlyserver.onrender.com/api/getPeers');
        const data = await response.json();
        return data.peers;
    } catch (error) {
        console.error('Error fetching peer IDs:', error);
        return [];
    }
}

async function generateID(peers){
    const store = useComponentRefsStore()
    const targetDistance = store.targetDistance
    if (peers.length < 1) {
        return 'no-users-online';
    }
    const searchablePeers = peers.filter(p => p.role === "searching" && p.peerID !== callerID);
    if (searchablePeers.length === 0) {
        return 'no-available-users';
    }
    const suitablePeers = [];
    for (const peer of searchablePeers) {
        try {
            distance = await getDistanceFromServer(callerID, peer.peerID);
            if (distance <= targetDistance) {
                suitablePeers.push(peer.peerID);
            }
        } catch (error) {
            console.error(`Error getting distance for peer ${peer.peerID}:`, error);
        }
    }
    if (suitablePeers.length === 0) {
        return 'no-users-in-distance';
    }
    const randomIndex = Math.floor(Math.random() * suitablePeers.length);
    return suitablePeers[randomIndex];
}

async function closeCall(){
    try {
        window.dispatchEvent(new CustomEvent('call-ended'));
        activeCall = null;

        if (stopRequested) {
            await sendPeerIDToServer(callerID, "stopIdle", "change");
            stopRequested = false;
        }
        else if (rejectCall) {
            await sendPeerIDToServer(callerID, "searching", "change");
            rejectCall = false;
            await handlePeerConnection();
        }
        else {
            await sendPeerIDToServer(callerID, "searching", "change");
            await handlePeerConnection();
        }
    } catch (error) {
        console.error('Error during closing the call:', error);
    }
}

export async function handlePeerConnection() {
    try {
        if (activeCall) {
            activeCall.close();
            activeCall = null;
        }
        await sendPeerIDToServer(callerID,"calling", "change");
        const peerIDs = await fetchPeerIDs();
        const destID = await generateID(peerIDs);
        if (destID === 'no-users-online') {
            lookingError = true;
            window.dispatchEvent(new CustomEvent("no-peers", {
                detail: "No users are currently available."
            }));
        }
        else if (destID === 'no-available-users') {
            lookingError = true;
            window.dispatchEvent(new CustomEvent("no-peers", {
                detail: "No users are available for a connection."
            }));
        }
        else if (destID === 'no-users-in-distance') {
            lookingError = true;
            window.dispatchEvent(new CustomEvent("no-peers", {
                detail: "No users found within your distance preference."
            }));
        }
        else {
            if (activeCall) return;
            lookingError = false;
            await peerConnect(destID, localStream);
            return;
        }
        await sendPeerIDToServer(callerID, "searching", "change");
    } catch (error) {
        console.error('Error during peer connection:', error);
    }
}

async function peerConnect(destID, localStream) {
    try {
        activeCall = peer.call(destID, localStream);
        let streamTimeout = setTimeout(async () => {
            try {
                console.warn("No stream received — assuming remote peer is unresponsive.");
                await sendPeerIDToServer(callerID, "searching", "change");
                await sendPeerIDToServer(destID, "calling", "change");
                await handlePeerConnection();
            } catch (error) {
                console.error('Error during timeout handling:', error);
            }
        }, 2000);
        activeCall.on('stream', function(stream) {
            clearTimeout(streamTimeout);
            window.dispatchEvent(new CustomEvent('remote-stream', { detail: stream }));
        });
        activeCall.on('close', async () => {
            try {
                await closeCall();
            } catch (error) {
                console.error('Error while closing the call:', error);
            }
        });
    } catch (error) {
        console.error('Error during peer connection setup:', error);
    }
}

peer.on('call', async function(call) {
    try {
        await sendPeerIDToServer(callerID, "calling", "change");
        if (activeCall) {
            rejectCall = true;
            activeCall.close();
            activeCall = null;
            return;
        }
        const store = useComponentRefsStore();
        const targetDistance = store.targetDistance;
        let distance;
        try {
            distance = await getDistanceFromServer(callerID, call.peer);
        } catch (error) {
            console.error('Error getting distance:', error);
            call.close();
            return;
        }
        if (distance > targetDistance) {
            call.close();
            return;
        }
        call.answer(localStream);
        activeCall = call;
        activeCall.on('stream', async function(stream) {
            window.dispatchEvent(new CustomEvent('remote-stream', { detail: stream }));
        });
        activeCall.on('close', async () => {
            try {
                await closeCall();
            } catch (error) {
                console.error('Error while closing the call:', error);
            }
        });
    } catch (error) {
        console.error('Error during call handling:', error);
    }
});

export async function stopConnection() {
    stopRequested = true;
    lookingError = false;
    if (activeCall) {
        activeCall.close();
        activeCall = null;
    }
    await sendPeerIDToServer(callerID, "stopIdle", "change");
    stopRequested = false;
}

window.addEventListener('beforeunload', async () => {
    if (activeCall) {
        activeCall.close();
        activeCall = null;
    }
    if (peer && !peer.destroyed) {
        peer.destroy();
    }
    if (callerID) {
        await sendPeerIDToServer(callerID, "", "delete");
        localStorage.removeItem('peerID');
    }
});
peer.on('close', async() => {
    console.log('Peer connection closed');
    await sendPeerIDToServer(callerID, "", "delete");
    localStorage.removeItem('peerID');
    callerID = null;
});
