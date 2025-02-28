<script setup>
import { ref, onMounted } from "vue";
import { getLocalStream } from "@/components/localStream.js";
import {Peer} from "https://esm.sh/peerjs@1.5.4?bundle-deps";
import axios from "axios";
const peer = new Peer({
  config: {'iceServers': [
      { url: 'stun:stun.l.google.com:19302' },
    ]}
});
const remoteVideo = ref(null);
onMounted(() => {
  const responseMessage = ref(null);
  axios.get('/api/test')
      .then(response => {
        responseMessage.value = response.data.message;
        console.log(responseMessage.value);
      })
      .catch(error => {
        responseMessage.value = 'Error: ' + error.message;
        console.log(responseMessage.value);
      });
})
</script>

<template>
  <video ref="remoteVideo" autoplay></video>
</template>

<style scoped>
video {
  width: 100%;
  object-fit: cover;
  height: 100%;
}
</style>