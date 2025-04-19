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
,
<style scoped>
video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
  aspect-ratio: 16 / 9;
}
</style>