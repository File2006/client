<script setup>

import {stopConnection} from "@/components/peerConnect.js";
</script>

<template>
<input type="button" @click="stopConnection" class="stop-button" value="Stop" />
</template>

<style scoped>
.stop-button {
  background: linear-gradient(to bottom, #e36b6b, #913a3a);
  color: white;
  font-family: 'Kanit', sans-serif;
  font-size: 2vw;
  font-weight: 400;
  font-style: normal;
  border: none;
  cursor: pointer;
  width: 100%;
  height: 100%;
  padding: 0;
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