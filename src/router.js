import { createRouter, createWebHistory } from 'vue-router';
import HomePage from './components/HomePage.vue';
import MyLogo from './components/myLogo.vue';
import AnotherPage from './components/AnotherPage.vue'; // דוגמה לדף נוסף
import App from './App.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage, // דף הבית
  },
  {
    path: '/page',
    name: 'AnotherPage',
    component: AnotherPage, // דף נוסף לדוגמה
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;