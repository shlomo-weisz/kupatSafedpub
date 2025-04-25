import { createRouter, createWebHistory } from 'vue-router';
import HomePage from './components/HomePage.vue';
import AnotherPage from './components/AnotherPage.vue'; // דוגמה לדף נוסף
import SportLiveMatches from './components/SportLiveMatches.vue'; // דף ספורט 215
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
  {
	path: '/sport215',
	name: 'SportLiveMatches',
	component: SportLiveMatches, // דף ספורט 215
  },
  // הוספת דפים נוספים לפי הצורך
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;