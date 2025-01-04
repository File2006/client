<script setup>
import { ref, onMounted} from "vue";
import {getLocalStream} from "@/components/localStream.js";
const signalingServer = new WebSocket('wss://omeetly-c552ec79ca41.herokuapp.com');

signalingServer.onopen = () => {
  console.log('Connected to signaling server');
};

signalingServer.onmessage = (message) => {

  console.log('Received client message:', message);
  const data = message;
  if (data.offer) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
        .then(() => peerConnection.createAnswer())
        .then(answer => peerConnection.setLocalDescription(answer))
        .then(() => {
          signalingServer.send(JSON.stringify({ answer: peerConnection.localDescription }));
        });
  } else if (data.answer) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
  } else if (data.candidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
};


const remoteVideo = ref(null);

const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
});

peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    signalingServer.send(JSON.stringify({ candidate: event.candidate }));
  }
};

async function createOffer() {
  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    signalingServer.send(JSON.stringify({ offer: peerConnection.localDescription }));
  } catch (error) {
    console.error("Error creating offer:", error);
  }
}

onMounted (async () => {
  const localStream = await getLocalStream();
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = event => {
    const [remoteStream] = event.streams;
    remoteVideo.value.srcObject = remoteStream;
  }
  await createOffer();
});
</script>

<template>
<video ref="remoteVideo" autoplay></video>
</template>

<style scoped>
video {
  width: 100%;
}
</style>