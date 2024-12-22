import { createApp } from 'vue';  // Correct way to import Vue 3
import App from './components/ExpressTest.vue';       // Import the root component
import axios from 'axios';

// Set up a base URL for Axios to point to your backend API
axios.defaults.baseURL = 'http://localhost:3000';

// Example of making a GET request to fetch data from the backend
axios.get('/')
    .then(response => {
        console.log('Data received:', response.data);
    })
    .catch(error => {
        console.error('There was an error!', error);
    });

createApp(App).mount('#app');