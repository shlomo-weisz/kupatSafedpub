<template>
  <div>
    <router-view /> <!-- כאן יוצג התוכן של הנתיב הנוכחי -->
  </div>
</template>

<script>
export default {};
</script>

<style>
/* ניתן להשאיר עיצוב כללי כאן אם יש צורך */
</style>

<style>
body {
	/* הגדרת שכבת צבע לבן חצי-שקוף ומעליה את התמונה שלך */
	background-image:
		linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)),
		/* שכבה לבנה עם 85% אטימות */
		url('./assets/image.png');
	/* שנה לנתיב הנכון של התמונה */

	/* התאמת התמונה לגודל המסך */
	background-size: cover;
	/* התמונה תכסה את כל המסך */
	background-position: center center;
	/* מיקום התמונה במרכז */
	background-repeat: no-repeat;
	/* ללא חזרה על התמונה */
	background-attachment: fixed;
	/* התמונה נשארת קבועה בעת גלילה */

	/* צבע רקע כגיבוי במקרה שהתמונה לא נטענת */
	background-color: #f8f8f8;
}
</style>