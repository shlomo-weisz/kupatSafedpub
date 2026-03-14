import { createRouter, createWebHistory } from "vue-router";
import HomePage from "./components/HomePage.vue";
import AnotherPage from "./components/AnotherPage.vue";
import SportLiveMatches from "./components/SportLiveMatches.vue";
import AdminWorkspace from "./components/AdminWorkspace.vue";

const routes = [
	{
		path: "/",
		name: "Home",
		component: HomePage,
	},
	{
		path: "/admin",
		name: "AdminWorkspace",
		component: AdminWorkspace,
	},
	{
		path: "/page",
		name: "AnotherPage",
		component: AnotherPage,
	},
	{
		path: "/sport215",
		name: "SportLiveMatches",
		component: SportLiveMatches,
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

export default router;
