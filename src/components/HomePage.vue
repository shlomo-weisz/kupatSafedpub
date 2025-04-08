<template>
  <CodeProtectedComponent>
    <div>
      <VolunteerSearch />
      <myLogo />
    </div>
  </CodeProtectedComponent>
</template>

<script>
import VolunteerSearch from './components/VolunteerSearch.vue';
import myLogo from './components/myLogo.vue';
import CodeProtectedComponent from "./components/CodeProtectedComponent.vue";

export default {
  components: {
    VolunteerSearch,
    myLogo,
    CodeProtectedComponent,
  },
};
</script>

<style>
/* העיצוב נשאר כפי שהוא */
body {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)),
    url('./assets/image.png');
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-color: #f8f8f8;
}
</style>