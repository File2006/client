<script setup>
import {onBeforeUnmount, onMounted, ref} from "vue";
const remoteVideo = ref(null);

function setRemoteStream(stream) {
  console.log("Remote Stream:", stream);
  console.log(stream);
  remoteVideo.value.srcObject = stream;
}

function handleRemoteStream(event) {
  setRemoteStream(event.detail);
}
onMounted(() => {
  window.addEventListener('remote-stream', handleRemoteStream);
});

onBeforeUnmount(() => {
  window.removeEventListener('remote-stream', handleRemoteStream);
});
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