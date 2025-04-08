import { createRouter, createWebHistory } from 'vue-router';
import HomePage from './components/HomePage.vue';
import AnotherPage from './components/AnotherPage.vue'; // דוגמה לדף נוסף

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