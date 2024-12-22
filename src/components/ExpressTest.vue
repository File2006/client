<template>
  <div id="app">
    <h1>Data from Express API:</h1>
    <div>{{ homePageContent.message }}</div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'App',
  data() {
    return {
      homePageContent: {},  // To store the home page HTML content
    };
  },
  mounted() {
    // Fetch the home page HTML content
    axios.get('/')  // Fetch the home page route
        .then(response => {
          // Assuming the response is HTML, set it as innerHTML
          this.homePageContent = response.data;
        })
        .catch(error => {
          console.error('Error fetching home page:', error);
        });
  },
};
</script>

<style>
/* Add any styling you need */
</style>
