<template>
	<CodeProtectedComponent>
		<div class="home-shell">
			<VolunteerSearch />
			<myLogo />
		</div>
	</CodeProtectedComponent>
</template>

<script>
import VolunteerSearch from "./VolunteerSearch.vue";
import myLogo from "./myLogo.vue";
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
.home-shell {
	padding: 20px 0 48px;
}

@media (max-width: 768px) {
	.home-shell {
		padding-top: 14px;
	}
}
</style>
