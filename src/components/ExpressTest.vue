<script setup>
import LocalWebcam from './WebCam.vue';
</script>
<template>
    <div class="top-bar">
      <img class ="icon" src="./icons/omeety_text_final.png" alt="Omeetly_logo">
    </div>
     <local-webcam></local-webcam>
 </template>
 <style>
 body{
   margin: 0;
 }
 .top-bar{
   background-color: #009fe3;
   grid-area: header;
   text-align: center;
 }
 .icon{
   width: 300px;
   padding-top: 10px;
 }
 #app{
   display: grid;
   grid-template-rows: auto 1fr;
   grid-template-columns: 1fr 1fr;
   grid-template-areas:
         "header header"
         "video1 video2"
         "buttons chat";
   height: 100%;
 }
 </style>
