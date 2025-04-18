<script setup>
import { useComponentRefsStore } from './store.js'

const store = useComponentRefsStore()
</script>

<template>
  <div class="distance-slider">
    <label for="distance" class="distance-label">
      <span>Distance:</span>
      <span class="distance-value">{{store.targetDistance}} km</span>
    </label>
    <input
        type="range"
        id="distance"
        min="1"
        max="200"
        step="1"
        v-model="store.targetDistance"
        class="slider"
    />
  </div>
</template>

<style scoped>
.distance-slider {
  display:grid;
  width: 100%;
  grid-template-rows: 0.1fr 1fr;
}
.distance-label {
  background: linear-gradient(to bottom, #fff9c4, #ffe082);
  display: flex;
  justify-content: space-between;
  height: 100%;
  font-size: 2vw;
  font-weight: bold;
}
.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 100%;
  background: #d3d3d3;
  border-radius: 1vw;
  outline: none;
  transition: background 0.3s;
  margin: 0;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  border-radius: 1rem;
  appearance: none;
  width: 1.5vw;
  height: 8vw;
  background: linear-gradient(to bottom, #fff9c4, #ffe082);
  cursor: pointer;
  border: none;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  transition: transform 0.1s ease;
}
</style>
