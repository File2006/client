<script setup>
import {stopConnection} from "@/components/peerConnect.js";
</script>

<template>
  <!-- Tlačítko stop -->
<input type="button" @click="stopConnection" class="stop-button" value="Stop" />
</template>

<style scoped>
.stop-button {
  background: linear-gradient(to bottom, #e36b6b, #913a3a);
  color: white;
  font-family: 'Kanit', sans-serif;
  font-size: 2vw;
  border: none;
  cursor: pointer;
  text-align: center;
  transition: background 0.3s ease, transform 0.1s ease;
}
.stop-button:hover {
  background: linear-gradient(to bottom, rgba(227, 107, 107, 0.8), rgba(145, 58, 58, 0.8));
}
.stop-button:active {
  transform: scale(0.95);
}
</style>