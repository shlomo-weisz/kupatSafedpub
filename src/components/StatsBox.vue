<!-- filepath: c:\networks\kupat\my-vue-app\src\components\StatsBox.vue -->
<template>
	<div class="stats-box">
		<h3>סטטיסטיקות</h3>
		<p>מספר אנשים שלקחו: <span class="highlight">{{ totalTaken }}</span> </p>
		<p>מתוך: <span class="highlight">{{ totalCustomers }}</span></p>
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
		totalCustomers: {
			type: Number,
			required: true,
		},
	},

};
</script>

<style scoped>
.stats-box {
	position: sticky;
	top: 90px;
	/* stays below volunteer header */
	left: auto;
	background-color: #f9f9f9;
	/* רקע אפור בהיר */
	border: 1px solid #ddd;
	/* גבול אפור עדין */
	border-radius: 12px;
	/* פינות מעוגלות */
	padding: 20px;
	/* ריווח פנימי */
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	/* צל עדין */
	width: 300px;
	/* רוחב הקומפוננטה */
	text-align: center;
	/* יישור טקסט למרכז */
	font-family: Arial, sans-serif;
	/* גופן מודרני */
	z-index: 2;
}

/* רספונסיביות למסכים קטנים */
@media (max-width: 768px) {
	.stats-box {
		position: static;
		/* הסרת המיקום הקבוע */
		transform: none;
		/* ביטול ההזזה */
		width: 100%;
		/* התאמה לרוחב המסך */
		margin: 20px auto;
		/* מיקום במרכז */
		box-shadow: none;
		/* הסרת הצל */
		border: 1px solid #ccc;
		/* מסגרת פשוטה */
		padding: 15px;
		/* ריווח פנימי גדול יותר */
	}
}
</style>