import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // ייבוא ה-Router

const app = createApp(App);

app.use(router); // שימוש ב-Router
app.mount('#app');
