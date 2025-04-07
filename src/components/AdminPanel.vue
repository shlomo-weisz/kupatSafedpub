<template>
	<div class="admin-panel">
		<div v-if="!isAuthenticated" class="auth-section">
			<h3>כלי ניהול</h3>
			<label for="adminPassword">סיסמת ניהול:</label>
			<input type="password" id="adminPassword" v-model="adminPassword" placeholder="הכנס סיסמת ניהול" @keydown.enter="checkPass"/>
			<button @click="checkPass">כניסה</button>
			<p v-if="authError" class="error-message">סיסמה שגויה!</p>
		</div>

		<div v-else class="menu-section">
			<h3>תפריט ניהול</h3>
			<button @click="sendReport('all')">שלח דוח: כל המקבלים</button>
			<button @click="sendReport('received')">שלח דוח: אלו שכבר לקחו</button>
			<button @click="sendReport('notReceived')">שלח דוח: אלו שלא לקחו</button>
			<button @click="sendReport('phones')">שלח דוח: טלפונים של אלו שלא לקחו</button>
		
			<button @click="sendReport('waites')">שלח דוח: רשימת המתנה</button>
			<button @click="sendReport('phonesW')">שלח דוח: טלפונים של רשימת המתנה</button>
			<button @click="logout">התנתק</button>
		</div>
	</div>
</template>

<script>
export default {
	name: "AdminPanel",
	props: {
		baseUrl: {
			type: String,
			required: true,
		},
	},
	data() {
		return {
			adminPassword: "",
			isAuthenticated: false,
			authError: false,
		};
	},
	methods: {
		
		async checkPass() {
			const response = await fetch(`${this.baseUrl}/auth`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ password: this.adminPassword, type: "admin" }),
			});
			const data = await response.json();
			if (data.valid) {
				// save token
				localStorage.setItem("tokenAdmin", data.token); // שמירת הטוקן ב-localStorage
				
				this.isAuthenticated = true; // הקוד נכון
				this.authError = false; // אין שגיאה
			} else {
				this.authError = true; // הקוד שגוי
			}
		},
		async sendReport(type) {
			try {
				// שליחת בקשה לשרת לשליחת דוח
				console.log(`שליחת דוח מסוג: ${type}`);
				console.log(this.baseUrl);
				
				const response = await fetch(`${this.baseUrl}/report`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Authorization": `Bearer ${localStorage.getItem("tokenAdmin")}`, // הוספת הטוקן לבקשה
					},
					body: JSON.stringify({ "type": type, token: localStorage.getItem("tokenAdmin") }), // הוספת הטוקן לבקשה
				});
				const data = await response.json();
				if (data.success) {
					const translate = {
						all: "כל המקבלים",
						received: "אלו שכבר לקחו",
						notReceived: "אלו שלא לקחו",
						phones: "טלפונים של אלו שלא לקחו",
						waites: "רשימת המתנה",
						phonesW: "טלפונים של רשימת המתנה",
					};
					alert(`הדוח מסוג "${translate[type]}" נשלח בהצלחה!`);
				} else {
					alert(`שגיאה בשליחת הדוח: ${data.message}`);
				}
			} catch (error) {
				console.log("Error sending report:", error);

			}

		},
		logout() {
			this.isAuthenticated = false;
			this.adminPassword = "";
		},
	},
};
</script>

<style scoped>
.admin-panel {
  position: fixed;
  top: 15%;
  right: 20px;
  transform: translateY(-50%);
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 250px;
  font-family: Arial, sans-serif;
  text-align: center;
  direction: rtl;
  z-index: 1;
}

.auth-section h3,
.menu-section h3 {
  margin-bottom: 15px;
  font-size: 18px;
  color: #333;
}

.auth-section input {
  width: 90%; /* שינוי הרוחב ל-90% */
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

button {
  width: 90%; /* שינוי הרוחב ל-90% */
  padding: 10px;
  margin-bottom: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #0056b3;
}

.error-message {
  color: red;
  font-size: 14px;
  margin-top: 5px;
}

/* רספונסיביות למסכים קטנים */
@media (max-width: 768px) {
  .admin-panel {
    position: static; /* הסרת המיקום הקבוע */
    transform: none; /* ביטול ההזזה */
    width: 90%; /* התאמה לרוחב המסך */
    margin: 20px auto; /* מיקום במרכז */
    box-shadow: none; /* הסרת הצל */
    border: 1px solid #ccc; /* מסגרת פשוטה */
  }

  button {
    width: 90%; /* שינוי הרוחב ל-90% */
    font-size: 16px; /* הגדלת הטקסט בכפתורים */
  }

  .auth-section input {
    width: 90%; /* שינוי הרוחב ל-90% */
  }
}
</style>