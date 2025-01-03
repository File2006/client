<script setup>
videoElement =  document.getElementById('videoElement');
const stream = await navigator.mediaDevices.getUserMedia({'video': true, 'audio': true})
  .then(stream => {
    videoElement.srcObject = stream;
    localStream = stream;
  })
.catch(err => console.error('Error accessing media devices:', err));
</script>

<template>
<video id="videoElement" autoplay muted></video>
</template>

<style scoped>

</style>