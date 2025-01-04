import { createApp } from 'vue';  // Correct way to import Vue 3
import App from './components/ExpressTest.vue';       // Import the root component
import axios from 'axios';

axios.defaults.baseURL = 'https://omeetly-c552ec79ca41.herokuapp.com';
const app = createApp(App);
app.mount('#app');