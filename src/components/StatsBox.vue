<!-- filepath: c:\networks\kupat\my-vue-app\src\components\StatsBox.vue -->
<template>
    <div class="stats-box">
        <h3>סטטיסטיקות</h3>
        <p>מספר אנשים שלקחו: <span class="highlight">{{ totalTaken }}</span></p>
        <p>אחוזים: <span class="highlight">{{ percentageTaken }}%</span></p>
		
   </div>
</template>

<script>
export default {
    props: {
        totalTaken: {
            type: Number,
            required: true,
        },
        percentageTaken: {
            type: Number,
            required: true,
        },
    },
	
};
</script>

<style scoped>
.stats-box {
    position: fixed;
    top: 80px; /* מתחת לשורת שם המתנדב */
    left: 20px; /* צמוד לשמאל עם מרווח של 20px */
    background-color: #f9f9f9; /* רקע אפור בהיר */
    border: 1px solid #ddd; /* גבול אפור עדין */
    border-radius: 12px; /* פינות מעוגלות */
    padding: 20px; /* ריווח פנימי */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* צל עדין */
    width: 300px; /* רוחב הקומפוננטה */
    text-align: center; /* יישור טקסט למרכז */
    font-family: Arial, sans-serif; /* גופן מודרני */
	z-index: -1;
}

.stats-box h3 {
    margin: 0 0 15px; /* ריווח מתחת לכותרת */
    font-size: 18px; /* גודל טקסט של הכותרת */
    color: #333; /* צבע טקסט כהה */
    font-weight: bold; /* טקסט מודגש */
}

.stats-box p {
    margin: 10px 0; /* ריווח בין הפסקאות */
    font-size: 16px; /* גודל טקסט של הפסקאות */
    color: #555; /* צבע טקסט אפור כהה */
}

.stats-box .highlight {
    font-weight: bold; /* טקסט מודגש */
    color: #007bff; /* צבע כחול מודגש */
    font-size: 18px; /* גודל טקסט גדול יותר */
}
</style>