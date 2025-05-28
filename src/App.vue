<template>
	<div>
		<router-view /> <!-- כאן יוצג התוכן של הנתיב הנוכחי -->
	</div>
</template>

<script>
export default {};
</script>

<style>
html,
body {
	height: 100%;
	margin: 0;
	padding: 0;
	overflow-x: hidden;
	/* Prevent horizontal scrolling */
}

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
	font-family: Arial, sans-serif;
	/* Ensure consistent font */
	-webkit-text-size-adjust: 100%;
	/* Prevent iOS text size adjustment */
	text-size-adjust: 100%;
	/* Prevent other mobile browser text size adjustment */
}

#app {
	/* Assuming your root Vue instance mounts to an element with id="app" in index.html */
	min-height: 100%;
	display: flex;
	flex-direction: column;
}

/* Add a viewport meta tag to public/index.html if not already present */
/* <meta name="viewport" content="width=device-width, initial-scale=1.0"> */

/* General responsive typography and spacing can be added here if needed */
</style>