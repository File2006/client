import { createApp } from 'vue';  // Correct way to import Vue 3
import App from './components/App.vue';       // Import the root component
import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:9000';
const app = createApp(App);
app.mount('#app');