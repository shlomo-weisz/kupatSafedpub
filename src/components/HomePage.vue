<template>
	<!-- <CodeProtectedComponent>
    <div>
      <VolunteerSearch />
      <myLogo />
    </div>
  </CodeProtectedComponent> -->
	<div>
		<VolunteerSearch />
		<myLogo />
	</div>
</template>

<script>
import VolunteerSearch from './VolunteerSearch.vue';
import myLogo from './myLogo.vue';
//import CodeProtectedComponent from "./CodeProtectedComponent.vue";

export default {
	components: {
		VolunteerSearch,
		myLogo,
		//CodeProtectedComponent,
	},
};
</script>

<style>
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