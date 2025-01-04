<script setup>
import LocalWebCam from './LocalWebCam.vue';
import RemoteWebCam from "@/components/RemoteWebCam.vue";
</script>
<template>
    <div class="top-bar">
      <img class ="icon" src="./icons/omeetly_text_final.png" alt="Omeetly_logo">
    </div>
     <local-web-cam></local-web-cam>
  <remote-web-cam></remote-web-cam>
 </template>
 <style>
@import "./../assets/main.css";
 </style>
