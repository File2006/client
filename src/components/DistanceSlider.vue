<script setup>
import { useComponentRefsStore } from './store.js'

const store = useComponentRefsStore()
</script>

<template>
  <div class="distance-slider">
    <label for="distance" class="distance-label">Distance: {{store.targetDistance}} km</label>
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
  height: 100%;
  font-size: 2.5rem;
  font-weight: bold;
}
.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 100%;
  background: #d3d3d3;
  border-radius: 1rem;
  outline: none;
  transition: background 0.3s;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  border-radius: 1rem;
  appearance: none;
  width: 2rem;
  height: 10rem;
  background: linear-gradient(to bottom, #fff9c4, #ffe082);
  cursor: pointer;
  border: none;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  transition: transform 0.1s ease;
}

.slider::-webkit-slider-thumb:active {
  transform: scale(1.1);
}

.slider::-moz-range-thumb {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: linear-gradient(to bottom, #6bc38e, #3a915c);
  cursor: pointer;
  border: none;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  transition: transform 0.1s ease;
}

.slider::-moz-range-thumb:active {
  transform: scale(1.1);
}
</style>
