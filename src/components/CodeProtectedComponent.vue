<template>
	<div>
		<!-- שדה להקשת קוד -->
		<div v-if="!isCodeValid" class="code-input-container">
			<label for="accessCode">הכנס קוד גישה:</label>
			<input type="password" id="accessCode" v-model="accessCode" placeholder="הכנס קוד" />
			<p v-if="codeError" class="error-message">קוד שגוי, נסה שוב.</p>
			<button @click="checkPass" class="submit-button">אמת קוד</button>
		</div>

		<!-- תוכן הקומפוננטה -->
		<div v-else>
			<div class="slot-container">
				<slot></slot> <!-- תוכן דינמי שיועבר מהקומפוננטה האב -->
			</div>
		</div>
	</div>
</template>

<script>
export default {
	data() {
		return {
			accessCode: "", // הקוד שהמשתמש מזין
			validCode: "", // הקוד הנכון
			isCodeValid: false, // האם הקוד אומת בהצלחה
			codeError: false, // האם הקוד שגוי
		};
	},
	methods: {
		// validateCode() {
		// 	if (this.accessCode === this.validCode) {
		// 		this.isCodeValid = true; // הקוד נכון
		// 		this.codeError = false; // אין שגיאה
		// 	} else {
		// 		this.codeError = true; // הקוד שגוי
		// 	}
		// },
		async checkPass() {
			const response = await fetch(`${process.env.VUE_APP_API_URL}/auth`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ password: this.accessCode, type: "users" }),
			});
			const data = await response.json();
			if (data.valid) {
				// save token
				localStorage.setItem("tokenUser", data.token); // שמירת הטוקן ב-localStorage
				this.isCodeValid = true; // הקוד נכון
				this.codeError = false; // אין שגיאה
			} else {
				this.codeError = true; // הקוד שגוי
			}
		},

	},
	watch: {
		accessCode() {
			this.codeError = false; // הסרת הודעת השגיאה כאשר המשתמש מתחיל להקליד מחדש
		}
	},
};
</script>

<style scoped>
.code-input-container {
	display: flex;
	flex-direction: column;
	gap: 15px;
	/* ריווח בין האלמנטים */
	max-width: 400px;
	/* רוחב מקסימלי לתיבה */
	margin: 0 auto;
	/* מיקום במרכז אופקי */
	padding: 20px;
	/* ריווח פנימי */
	border: 1px solid #ccc;
	/* מסגרת */
	border-radius: 10px;
	/* פינות מעוגלות */
	background-color: #f9f9f9;
	/* צבע רקע */
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	/* צל לתיבה */
	text-align: right;
	/* יישור טקסט לימין */
	direction: rtl;
	/* כיוון מימין לשמאל */

	/* מיקום במרכז המסך */
	position: fixed;
	top: 50%;
	/* מיקום אנכי */
	left: 50%;
	/* מיקום אופקי */
	transform: translate(-50%, -50%);
	/* הזזה כדי למרכז */
}

.code-input-container label {
	font-size: 16px;
	/* גודל טקסט */
	font-weight: bold;
	/* טקסט מודגש */
	color: #333;
	/* צבע טקסט */
}

.code-input-container input {
	padding: 10px;
	/* ריווח פנימי */
	font-size: 16px;
	/* גודל טקסט */
	border: 1px solid #ccc;
	/* מסגרת */
	border-radius: 5px;
	/* פינות מעוגלות */
	width: 100%;
	/* התאמה לרוחב מלא */
	box-sizing: border-box;
	/* כולל ריווח פנימי במסגרת */
}

.code-input-container input:focus {
	outline: none;
	/* הסרת מסגרת ברירת מחדל */
	border-color: #007bff;
	/* צבע מסגרת בעת פוקוס */
	box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
	/* צל בעת פוקוס */
}

.error-message {
	color: red;
	/* צבע טקסט אדום */
	font-size: 14px;
	/* גודל טקסט */
	margin-top: -5px;
	/* ריווח מעל ההודעה */
}

.submit-button {
	padding: 10px 20px;
	/* ריווח פנימי */
	background-color: #007bff;
	/* צבע רקע */
	color: white;
	/* צבע טקסט */
	border: none;
	/* ללא מסגרת */
	border-radius: 5px;
	/* פינות מעוגלות */
	cursor: pointer;
	/* מצביע יד */
	font-size: 16px;
	/* גודל טקסט */
	transition: background-color 0.3s ease, transform 0.2s ease;
	/* אפקט מעבר */
}

.submit-button:hover {
	background-color: #0056b3;
	/* צבע רקע בעת ריחוף */
	transform: scale(1.05);
	/* הגדלה קלה בעת ריחוף */
}
</style>