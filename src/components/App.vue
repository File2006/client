<script setup>
import LocalWebCam from './LocalWebCam.vue';
import RemoteWebCam from "./RemoteWebCam.vue";
import NextButton from "@/components/NextButton.vue";
import StopButton from "@/components/StopButton.vue";
import DistanceSlider from "@/components/DistanceSlider.vue";
</script>

<template>
    <div class="top-bar">
      <img class ="icon" src="./icons/omeetly_text_final.png" alt="Omeetly_logo">
    </div>
    <local-web-cam class="local-web-cam"></local-web-cam>
    <remote-web-cam class="remote-web-cam"></remote-web-cam>
    <div class="buttons-div">
      <next-button class="next-button"></next-button>
      <stop-button class="stop-button"></stop-button>
      <distance-slider class="distance-slider"></distance-slider>
    </div>
 </template>

 <style>
@import "./../assets/main.css";
 </style>
