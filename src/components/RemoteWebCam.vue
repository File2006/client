<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

const remoteVideo = ref(null);
const overlayMessage = ref("Press next to start!");

function setRemoteStream(stream) {
  if (remoteVideo.value) {
    overlayMessage.value = "";
    remoteVideo.value.srcObject = stream;
  }
}

function resetRemoteStream() {
  if (remoteVideo.value) {
    remoteVideo.value.srcObject = null;
  }
}

//Funkce na měnění stavové obrazovky
function handleCallEnded() {
  resetRemoteStream();
}

function handleRemoteStream(event) {
  setRemoteStream(event.detail);
}

function handleNoPeers(event) {
  overlayMessage.value = event.detail;
}

function handleRoleUpdate(event) {
  const role = event.detail;
  switch (role) {
    case "idle":
      overlayMessage.value = "Press next to start!";
      break;
    case "searching":
      overlayMessage.value = "Looking for connection...";
      break;
    case "calling":
      overlayMessage.value = "";
      break;
    case "stopIdle":
      overlayMessage.value = "You are currently paused. Press next to continue searching.";
      break;
    default:
      overlayMessage.value = "Status unknown.";
  }
}

//Naslouchače eventů pro změnění stavové obrazovky
onMounted(() => {
  window.addEventListener("remote-stream", handleRemoteStream);
  window.addEventListener("call-ended", handleCallEnded);
  window.addEventListener("update-role", handleRoleUpdate);
  window.addEventListener("no-peers", handleNoPeers);
});

onBeforeUnmount(() => {
  window.removeEventListener("remote-stream", handleRemoteStream);
  window.removeEventListener("call-ended", handleCallEnded);
  window.removeEventListener("update-role", handleRoleUpdate);
  window.removeEventListener("no-peers", handleNoPeers);
});
</script>

<template>
  <div class="video-container">
    <video ref="remoteVideo" autoplay playsinline></video>
    <div v-if="overlayMessage" class="overlay">{{ overlayMessage }}</div>
  </div>
</template>

<style scoped>
.video-container {
  position: relative;
}
.overlay {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  color: white;
  background-color: gray;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8vw;
  font-family: 'Kanit', sans-serif;
}
</style>