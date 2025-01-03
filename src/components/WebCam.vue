<script setup>
import {ref, onMounted} from "vue";
const videoElement = ref(null);
let localStream = null;
onMounted(async () => {
  const stream = await navigator.mediaDevices.getUserMedia({'video': true, 'audio': true})
      .then(stream => {
        videoElement.value.srcObject = stream;
        localStream = stream;
      })
      .catch(err => console.error('Error accessing media devices:', err));
})
</script>

<template>
<div class="localWebcam">
  <video ref="videoElement" autoplay muted></video>
</div>
</template>

<style scoped>
.localWebcam video {
  width: 100%;
}
</style>