<template>
	<div>
		<button @click="toggleForm" :class="showForm ? 'close-form-button' : 'open-form-button'">
			{{ showForm ? 'סגור טופס' : 'רישום לקוח חדש' }}
		</button>

		<div v-if="showForm" class="form-container">
			<!-- שדה קוד מנהל -->
			<div v-if="!isAdminCodeValid" class="form-group">
				<label for="adminCode">קוד מנהל:</label>
				<input type="password" id="adminCode" v-model="adminCode" @keydown.enter="checkPass" />
				<p v-if="adminCodeError" class="error-message">קוד מנהל שגוי!</p>
				<button @click="checkPass" class="submit-button">אמת קוד</button>
			</div>

			<!-- שאר הטופס -->
			<div v-else>
				<h2>רישום לקוח חדש</h2>
				<div class="form-group">
					<div class="radio-group-container">
						<div class="radio-buttons">
							<label>
								<input type="radio" v-model="customer.status" value="לוקח עכשיו" />
								לוקח עכשיו
							</label>
							<label>
								<input type="radio" v-model="customer.status" value="לרשימת המתנה" />
								לרשימת המתנה
							</label>
						</div>
						<div class="checkbox-container">
							<label>
								<input type="checkbox" v-model="customer.registerForDistribution" />
								רישום למאגר החלוקות של הקופה
							</label>
						</div>
					</div>
				</div>
				<!-- שאר השדות של הטופס -->
				<form @submit.prevent="registerCustomer">
					<div class="form-group">
						<label for="lastName">שם משפחה:</label>
						<input type="text" id="lastName" v-model="customer.lastName" required />
					</div>
					<div class="form-columns">

						<!-- טור 1: פרטי האב -->
						<div class="form-column">
							<h3>פרטי האב</h3>
							<div class="form-group">
								<label for="fatherName">שם האב:</label>
								<input type="text" id="fatherName" v-model="customer.fatherName" />
							</div>
							<div class="form-group">
								<label for="fatherId">מספר זהות של האב:</label>
								<input type="text" id="fatherId" v-model="customer.fatherId" required />
							</div>
							<div class="form-group">
								<label for="fatherPhone">מספר טלפון של האב:</label>
								<input type="text" id="fatherPhone" v-model="customer.fatherPhone" />
							</div>
						</div>

						<!-- טור 2: פרטי האם -->
						<div class="form-column">
							<h3>פרטי האם</h3>
							<div class="form-group">
								<label for="motherName">שם האם:</label>
								<input type="text" id="motherName" v-model="customer.motherName" />
							</div>
							<div class="form-group">
								<label for="motherId">מספר זהות של האם:</label>
								<input type="text" id="motherId" v-model="customer.motherId" />
							</div>
							<div class="form-group">
								<label for="motherPhone">מספר טלפון של האם:</label>
								<input type="text" id="motherPhone" v-model="customer.motherPhone" />
							</div>
						</div>


					</div>
					<!-- שורה חדשה: טלפון נוסף -->
					<div class="form-columns">
						<div class="form-group">
							<label for="additionalPhone">טלפון נוסף:</label>
							<input type="text" id="additionalPhone" v-model="customer.additionalPhone" />
						</div>
					</div>
					<!-- כתובת -->
					<h3>כתובת</h3>
					<div class="form-columns address-row">
						<div class="form-group">
							<label for="city">עיר:</label>
							<input type="text" id="city" v-model="customer.address.city" />
						</div>
						<div class="form-group">
							<label for="street">רחוב:</label>
							<input type="text" id="street" v-model="customer.address.street" />
						</div>
						<div class="form-group">
							<label for="houseNumber">מספר בית:</label>
							<input type="text" id="houseNumber" v-model="customer.address.houseNumber" />
						</div>
						<div class="form-group">
							<label for="apartment">מספר דירה:</label>
							<input type="text" id="apartment" v-model="customer.address.apartment" />
						</div>
						<div class="form-group">
							<label for="entrance">כניסה:</label>
							<input type="text" id="entrance" v-model="customer.address.entrance" />
						</div>
						<div class="form-group">
							<label for="floor">קומה:</label>
							<input type="text" id="floor" v-model="customer.address.floor" />
						</div>
					</div>

					<!-- מספר ילדים -->
					<h3>מספר ילדים</h3>
					<div class="form-columns">
						<div class="form-column">
							<div class="form-group">
								<label for="marriedChildren">מספר ילדים נשואים:</label>
								<input type="number" id="marriedChildren" v-model="customer.marriedChildren" min="0" />
							</div>
						</div>
						<div class="form-column">
							<div class="form-group">
								<label for="unmarriedChildren">מספר ילדים שאינם נשואים:</label>
								<input type="number" id="unmarriedChildren" v-model="customer.unmarriedChildren"
									min="0" />
							</div>
						</div>
					</div>

					<button type="submit" class="submit-button">שלח</button>
					<button type="button" @click="closeForm" class="cancel-button">ביטול</button>
				</form>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	props: {
		baseUrl: {
			type: String,
			required: true,
		},
		volunteer_name: {
			type: String,
			required: true,
		},
	},
	data() {
		return {
			showForm: false,
			isAdminCodeValid: false, // האם קוד המנהל אומת בהצלחה
			adminCode: "", // קוד מנהל שהוזן
			adminCodeError: false, // האם הקוד שגוי

			customer: {
				status: "לוקח עכשיו", // ברירת מחדל
				registerForDistribution: false, // האם נרשם למאגר החלוקות של הקופה
				volunteer_name: this.volunteer_name, // שם המתנדב
				lastName: "",
				fatherName: "",
				fatherId: "",
				fatherPhone: "",
				motherName: "",
				motherId: "",
				motherPhone: "",
				additionalPhone: "",
				address: {
					street: "",
					houseNumber: "",
					apartment: "",
					entrance: "",
					city: "",
					floor: "",
				},
				marriedChildren: 0,
				unmarriedChildren: 0,
			},
		};
	},
	methods: {
		toggleForm() {
			if (this.showForm) {
				this.closeForm(); // סגור את הטופס ואפס את השדות
			} else {
				this.openForm(); // פתח את הטופס
			}
		},
		openForm() {
			this.showForm = true;
		},
		closeForm() {
			this.showForm = false;
			this.resetForm();
		},
		resetForm() {
			this.adminCode = ""; // איפוס קוד מנהל
			this.isAdminCodeValid = false; // איפוס מצב האימות
			this.customer = {
				status: "לוקח עכשיו",
				registerForDistribution: false,
				lastName: "",
				fatherName: "",
				fatherId: "",
				fatherPhone: "",
				motherName: "",
				motherId: "",
				motherPhone: "",
				additionalPhone: "",
				address: {
					street: "",
					houseNumber: "",
					apartment: "",
					entrance: "",
					city: "",
					floor: "",
				},
				marriedChildren: 0,
				unmarriedChildren: 0,
			};
		},
		async checkPass() {
			const response = await fetch(`${this.baseUrl}/auth`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ password: this.adminCode, type: "register" }),
			});
			const data = await response.json();
			if (data.valid) {
				// save token
				localStorage.setItem("tokenReg", data.token); // שמירת הטוקן ב-localStorage
				this.isAdminCodeValid = true; // הקוד נכון
				this.adminCodeError = false; // אין שגיאה
			} else {
				this.adminCodeError = true; // הקוד שגוי
			}
		},
		async registerCustomer() {
			if (!this.isAdminCodeValid) {
				alert("קוד מנהל שגוי! לא ניתן להמשיך ברישום.");
				return;
			}
			console.log(this.baseUrl);
			console.log(this.customer);

			try {
				const response = await fetch(`${this.baseUrl}/register`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Authorization": `Bearer ${localStorage.getItem("tokenReg")}`, // הוספת הטוקן לבקשה
					},
					body: JSON.stringify(this.customer),
				});
				const data = await response.json();
				if (data.success) {
					alert("הלקוח נרשם בהצלחה!");
				} else {
					alert("שגיאה ברישום הלקוח: " + data.message);
				}
			} catch (error) {
				console.error("Error registering customer:", error);
				alert("שגיאה ברישום הלקוח, אנא נסה שוב.");
			}
			this.closeForm();
		},
	},
};
</script>

<style>
.open-form-button {
	padding: 10px 20px;
	background-color: #007bff;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 16px;
	transition: background-color 0.3s ease;
}

.open-form-button:hover {
	background-color: #0056b3;
}

.close-form-button {
	padding: 10px 20px;
	background-color: #dc3545;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 16px;
	transition: background-color 0.3s ease;
}

.close-form-button:hover {
	background-color: #c82333;
}

.form-container {
	direction: rtl;
	/* מימין לשמאל */
	margin: 50px auto;
	/* מרכז את הטופס */
	background-color: white;
	padding: 20px;
	border-radius: 8px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	max-width: 1000px;
	/* מגביל את הרוחב המקסימלי של הטופס */
	width: 95%;
	/* הטופס יתפוס 95% מרוחב המסך */
}

.form-columns {
	display: grid;
	/* שימוש ב-Grid Layout */
	grid-template-columns: repeat(2, 1fr);
	/* שני טורים */
	gap: 20px;
	/* ריווח בין השדות */
	margin-bottom: 20px;
}

@media (max-width: 768px) {
	.form-columns {
		grid-template-columns: 1fr;
	}

	.form-container {
		margin: 20px auto;
		width: 100%;
		max-width: 100%;
	}
}

.form-group {
	margin-bottom: 15px;
}

.form-group label {
	display: block;
	font-weight: bold;
	margin-bottom: 5px;
}

.form-group input {
	width: 100%;
	padding: 8px;
	border: 1px solid #ccc;
	border-radius: 4px;
	box-sizing: border-box;
}

.submit-button {
	padding: 10px 20px;
	background-color: #28a745;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 16px;
	transition: background-color 0.3s ease;
	width: 100%;
}

.submit-button:hover {
	background-color: #218838;
}

.cancel-button {
	margin-top: 10px;
	padding: 10px 20px;
	background-color: #dc3545;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 16px;
	transition: background-color 0.3s ease;
	width: 100%;
}

.cancel-button:hover {
	background-color: #c82333;
}

.address-row {
	display: flex;
	gap: 20px;
	/* ריווח בין השדות */
	flex-wrap: wrap;
	/* מאפשר מעבר לשורה חדשה אם אין מקום */
	direction: rtl;
	/* כיוון מימין לשמאל */
	justify-content: flex-start;
	/* יישור השדות להתחלה */
}

.address-row .form-group {
	flex: 1 1 150px;
	/* כל שדה תופס מינימום 150px */
	min-width: 150px;
	/* רוחב מינימלי לשדה */
}

.error-message {
	color: red;
	font-size: 14px;
	margin-top: 5px;
}

.form-group .radio-group {
	display: flex;
	/* שימוש ב-Flexbox */
	gap: 20px;
	/* ריווח בין האלמנטים */
	align-items: center;
	/* יישור אנכי */
}

.radio-group label {
	display: flex;
	/* מאפשר יישור של כפתור הרדיו/צ'קבוקס עם הטקסט */
	align-items: center;
	gap: 5px;
	/* ריווח בין כפתור הרדיו/צ'קבוקס לטקסט */
}

.radio-group {
	display: flex;
	/* שימוש ב-Flexbox */
	gap: 20px;
	/* ריווח בין האלמנטים */
	align-items: center;
	/* יישור אנכי */
}

.radio-group label:last-child {
	margin-left: auto;
	/* יישור הכפתור השלישי לשמאל */
}

/* מסגרת סביב כפתורי הרדיו */
.radio-buttons {
	border: 1px solid #ccc;
	border-radius: 8px;
	padding: 10px;
	display: flex;
	gap: 20px;
	align-items: center;
}

/* מסגרת סביב הצ'קבוקס */
.checkbox-container {
	border: 1px solid #ccc;
	border-radius: 8px;
	padding: 10px;
	margin-top: 10px;
	display: flex;
	align-items: center;
}

/* עיצוב כללי לכפתורי הרדיו והצ'קבוקס */
.radio-group-container {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.radio-group label {
	display: flex;
	align-items: center;
	gap: 5px;
}

/* עיצוב כללי לקבוצה המכילה */
.radio-group-container {
	display: flex;
	/* שימוש ב-Flexbox */
	gap: 20px;
	/* ריווח בין המסגרות */
	align-items: center;
	/* יישור אנכי */
}

/* מסגרת סביב כפתורי הרדיו */
.radio-buttons {
	border: 1px solid #ccc;
	border-radius: 8px;
	padding: 10px;
	display: flex;
	gap: 20px;
	align-items: center;
}

/* מסגרת סביב הצ'קבוקס */
.checkbox-container {
	border: 1px solid #ccc;
	border-radius: 8px;
	padding: 10px;
	display: flex;
	align-items: center;
}
</style>