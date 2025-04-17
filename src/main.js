import { createApp } from 'vue';  // Correct way to import Vue 3
import App from './components/App.vue';       // Import the root component

const app = createApp(App);
app.mount('#app');