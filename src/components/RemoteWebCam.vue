<script setup>
import { ref, onMounted} from "vue";
import {getLocalStream} from "@/components/localStream.js";
const signalingServer = new WebSocket('ws://localhost:3000');

const remoteVideo = ref(null);

const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
});

onMounted (async () => {
  const localStream = await getLocalStream();
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = event => {
    const [remoteStream] = event.streams;
    remoteVideo.value.src = remoteStream.value;
  }
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