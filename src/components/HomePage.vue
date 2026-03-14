<template>
	<CodeProtectedComponent>
		<div>
			<div class="page-actions">
				<button class="admin-link" @click="$router.push('/admin')">ניהול מסד</button>
			</div>
			<VolunteerSearch />
			<myLogo />
		</div>
	</CodeProtectedComponent>
	<!-- <div>
		<VolunteerSearch />
		<myLogo />
	</div> -->
</template>

<script>
import VolunteerSearch from './VolunteerSearch.vue';
import myLogo from './myLogo.vue';
import CodeProtectedComponent from "./CodeProtectedComponent.vue";

export default {
	components: {
		VolunteerSearch,
		myLogo,
		CodeProtectedComponent,
	},
};
</script>

<style>
.page-actions {
	max-width: 1500px;
	margin: 18px auto 0;
	padding: 0 12px;
	display: flex;
	justify-content: flex-start;
}

.admin-link {
	border: 1px solid #17342d;
	background: rgba(255, 250, 241, 0.92);
	color: #17342d;
	padding: 10px 16px;
	border-radius: 999px;
	cursor: pointer;
	font-size: 14px;
	font-weight: bold;
	box-shadow: 0 10px 24px rgba(23, 52, 45, 0.12);
}

.admin-link:hover {
	background: #17342d;
	color: #fffaf1;
}

/* העיצוב נשאר כפי שהוא */
/* body {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)),
    url('./assets/image.png');
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-color: #f8f8f8;
} */
</style>
