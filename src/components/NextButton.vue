<script setup>
import {handlePeerConnection} from "@/components/peerConnect.js";
</script>
<template>
<input type="button" @click="handlePeerConnection()" class="next-button" value="Next" />
</template>

<style scoped>
.next-button {
  background: linear-gradient(to bottom, #6bc38e, #3a915c);
  color: white;
  font-size: 2vw;
  font-weight: bold;
  border: none;
  cursor: pointer;
  width: 100%;
  height: 100%;
  padding: 0;
  text-align: center;
  transition: background 0.3s ease, transform 0.1s ease;
}
.next-button:hover {
  background: linear-gradient(to bottom, rgba(107, 195, 142, 0.8), rgba(58, 145, 92, 0.8));
}

.next-button:active {
  transform: scale(0.95);
}

</style>