<template>
  <div class="logo-container">
    <a href="https://example.com" target="_blank" rel="noopener noreferrer">
      <img src="../assets/myLogo.png" alt="לוגו עסקי" class="logo-image" />
    </a>
  </div>
</template>

<script>
export default {
  name: "myLogo",
};
</script>

<style scoped>
.logo-container {
  position: fixed;
  bottom: 20px; /* מרחק מהחלק התחתון */
  left: 20px; /* מרחק מהצד השמאלי */
  z-index: 1000; /* מבטיח שהלוגו יהיה מעל אלמנטים אחרים */
}

.logo-image {
  width: 50px; /* רוחב הלוגו */
  height: auto; /* התאמה אוטומטית לגובה */
  cursor: pointer; /* מצביע יד בעת מעבר על הלוגו */
  transition: transform 0.3s ease; /* אפקט מעבר */
}

.logo-image:hover {
  transform: scale(1.1); /* הגדלה קלה בעת ריחוף */
}
</style>