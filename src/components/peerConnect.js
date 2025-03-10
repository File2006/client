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
                urls: "turn:global.relay.metered.ca:80",
                username: "b66374b10890b26574f55beb",
                credential: "e7x9yR2QU1z/42jp",
            },
            {
                urls: "turn:global.relay.metered.ca:80?transport=tcp",
                username: "b66374b10890b26574f55beb",
                credential: "e7x9yR2QU1z/42jp",
            },
            {
                urls: "turn:global.relay.metered.ca:443",
                username: "b66374b10890b26574f55beb",
                credential: "e7x9yR2QU1z/42jp",
            },
            {
                urls: "turns:global.relay.metered.ca:443?transport=tcp",
                username: "b66374b10890b26574f55beb",
                credential: "e7x9yR2QU1z/42jp",
            },
        ],
    }
});

peer.on('open', async function(id) {
    callerID.value = id;
    console.log('My peer ID is: ' + id);
    await sendPeerIDToServer(id, true);
});

export async function generateID(idList){
    console.log(idList);
    if (idList.length <= 1) {
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
    call.answer(localStream);
    sendPeerIDToServer(callerID.value, false);
    activeCall = call;
    call.on('stream', function(stream) {
        window.dispatchEvent(new CustomEvent('remote-stream', { detail: stream }));
    });
});

export async function peerConnect(destID, localStream) {
    if (activeCall){
        console.log("Connected", activeCall);
        activeCall.close();
    }
    console.log(localStream)
    activeCall = peer.call(destID,localStream);
    await sendPeerIDToServer(callerID.value, false);
    activeCall.on('stream', function(stream) {
        window.dispatchEvent(new CustomEvent('remote-stream', { detail: stream }));
    });
    activeCall.on('close', async () => {
        console.log('Call closed');
        activeCall = null;
        await sendPeerIDToServer(callerID.value, true);
        await sendPeerIDToServer(destID, true);
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
