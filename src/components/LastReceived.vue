<template>
    <div class="last-received-box" v-if="lastReceived">
        <h3>פרטי הלקוח האחרון</h3>
        <p><strong>שם משפחה:</strong> {{ lastReceived.last_name }}</p>
        <p><strong>שם האב:</strong> {{ lastReceived.father_first_name }}</p>
        <p><strong>שם האם:</strong> {{ lastReceived.mother_first_name }}</p>
        <p><strong>ילדים נשואים:</strong> {{ lastReceived.married_children }}</p>
        <p><strong>ילדים לא נשואים:</strong> {{ lastReceived.unmarried_children }}</p>
        <p><strong>סה"כ ילדים:</strong> {{ lastReceived.unmarried_children + lastReceived.married_children }}</p>
    </div>
</template>

<script>
export default {
    props: {
        lastReceived: {
            type: Object,
            required: false, // יכול להיות ריק אם אין נתונים
        },
    },
};
</script>

<style scoped>
.last-received-box {
    position: fixed;
    top: 240px; /* הורדנו את הקומפוננטה למטה יותר */
    left: 20px; /* צמוד לשמאל */
    background-color: #f9f9f9; /* רקע אפור בהיר */
    border: 1px solid #ddd; /* גבול אפור עדין */
    border-radius: 12px; /* פינות מעוגלות */
    padding: 15px; /* ריווח פנימי */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* צל עדין */
    width: 300px; /* רוחב הקומפוננטה */
    font-family: Arial, sans-serif; /* גופן מודרני */
    text-align: right; /* יישור לימין */
}

.last-received-box h3 {
    margin: 0 0 10px; /* ריווח מתחת לכותרת */
    font-size: 18px; /* גודל טקסט של הכותרת */
    color: #333; /* צבע טקסט כהה */
    font-weight: bold; /* טקסט מודגש */
}

.last-received-box p {
    margin: 5px 0; /* ריווח בין הפסקאות */
    font-size: 14px; /* גודל טקסט של הפסקאות */
    color: #555; /* צבע טקסט אפור כהה */
}
</style>