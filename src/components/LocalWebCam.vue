<script setup>
import {ref, onMounted} from "vue";
import { getLocalStream } from './localStream';
const localVideo = ref(null);

onMounted(async () => {
  try{
    const localStream = await getLocalStream()
    if (localVideo.value){
      localVideo.value.srcObject = localStream;
    }
    else{
      console.error("Video element is not available yet.");
    }
  }catch(error){
      console.error("Failed to access webcam:", error);
    }
  })
</script>

<template>
  <video ref="localVideo" autoplay muted playsinline></video>
</template>

<style scoped>
video {
  transform: scaleX(-1);
}
</style>