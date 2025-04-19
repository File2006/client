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
}
.distance-label {
  padding-left: 10px;
  padding-right: 10px;
  background: linear-gradient(to bottom, #00AEEF, #0077B6);
  color: white;
  display: flex;
  justify-content: space-between;
  font-size: 2vw;
  font-family: 'Kanit', sans-serif;
}
.slider {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background: #d3d3d3;
  margin: 0;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  border-radius: 2vw;
  width: 1.5vw;
  height: 5vw;
  background: linear-gradient(to bottom, #00AEEF, #0077B6);
  cursor: pointer;
  min-height: 70px;
}
</style>
