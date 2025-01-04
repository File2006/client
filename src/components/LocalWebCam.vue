<script setup>
import {ref, onMounted} from "vue";
import { getLocalStream } from './localStream';
const localVideo = ref(null);
onMounted(async () => {
  const localStream = await getLocalStream()
  localVideo.value.srcObject = localStream;
})
</script>

<template>
  <video ref="localVideo" autoplay muted></video>
</template>

<style scoped>
video {
  width: 100%;
}
</style>