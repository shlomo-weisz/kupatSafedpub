<template>
	<div>
		<!-- קומפוננטת שם המתנדב -->
		<VolunteerNameInput :value="volunteerName" @update-volunteer-name="volunteerName = $event" />

		<!-- קומפוננטת הסטטיסטיקות -->
		<StatsBox :total-taken="totalTaken" :percentage-taken="percentageTaken" :totalCustomers="totalCustomers"/>



		<!-- קומפוננטת כלי הניהול -->
		<AdminPanel :base-url="baseURL" />

		<div :class="['container', result ? 'results-active' : 'search-active']">

			<h1>מערכת חלוקות קופת צפת</h1>

			<!-- כפתור חזרה לחיפוש -->
			<button v-if="result" @click="resetSearch" class="back-button">חזרה לחיפוש</button>

			<!-- תיבת החיפוש -->
			<div v-if="!result">
				<div class="search-group">
					<label for="idNumber">חיפוש לפי מספר זהות:</label>
					<input type="text" v-model="idNumber" :disabled="phoneActive" @input="disableOther('id')" @keydown.enter="search" />
				</div>

				<div class="search-group">
					<label for="phoneNumber">חיפוש לפי מספר טלפון:</label>
					<input type="text" v-model="phoneNumber" :disabled="idActive" @input="disableOther('phone')" @keydown.enter="search" />
				</div>

				<button @click="search">חפש</button>
			</div>

			<!-- תוצאות חיפוש -->
			<div v-if="result" class="result-box">
				<div class="result-header">
					<button v-if="!result.received" @click="markReceived" class="mark-button">סמן כקיבל</button>
					<p v-if="result.received" class="received-message">הלקוח כבר קיבל</p>
					<button @click="openUpdateForm" class="update-button">עדכן נתונים</button>
				</div>

				<!-- תיבת עדכון נתונים -->
				<div v-if="showUpdateForm" class="update-form">
					<h3>עדכון נתונים</h3>
					<div class="update-group" v-for="(value, key) in editableFields" :key="key">
						<label :for="key">{{ translateField(key) }}:</label>
						<input type="text" :id="key" v-model="editableFields[key]" :placeholder="translateField(key)" />
					</div>
					<button @click="updateCustomer">עדכן</button>
					<button @click="closeUpdateForm" class="cancel-button">ביטול</button>
				</div>

				<h2>תוצאות חיפוש</h2>
				<ul class="result-list">
					<li><strong>קהילה:</strong> {{ formatValue(result.comunity) }}</li>
					<li><strong>שם משפחה:</strong> {{ formatValue(result.last_name) }}</li>
					<li><strong>שם האב:</strong> {{ formatValue(result.father_first_name) }}</li>
					<li><strong>מספר זהות של האב:</strong> {{ formatValue(result.father_id) }}</li>
					<li><strong>שם האם:</strong> {{ formatValue(result.mother_first_name) }}</li>
					<li><strong>מספר זהות של האם:</strong> {{ formatValue(result.mother_id) }}</li>
					<li><strong>מספר טלפון של האב:</strong> {{ formatValue(result.father_phone) }}</li>
					<li><strong>מספר טלפון של האם:</strong> {{ formatValue(result.mother_phone) }}</li>
					<li><strong>טלפון נוסף:</strong> {{ formatValue(result.additional_phone) }}</li>
					<li><strong>רחוב:</strong> {{ formatValue(result.street) }}</li>
					<li><strong>מספר בית:</strong> {{ formatValue(result.house_number) }}</li>
					<li><strong>מספר דירה:</strong> {{ formatValue(result.apartment_number) }}</li>
					<li><strong>כניסה:</strong> {{ formatValue(result.entrance) }}</li>
					<li><strong>קומה:</strong> {{ formatValue(result.floor) }}</li>
					<li><strong>עיר:</strong> {{ formatValue(result.city) }}</li>
					<li><strong>מספר ילדים שאינם נשואים:</strong> {{ formatValue(result.unmarried_children) }}</li>
					<li><strong>מספר ילדים נשואים:</strong> {{ formatValue(result.married_children) }}</li>
					<li><strong>סך הכל ילדים:</strong> {{ formatValue(result.total_children) }}</li>
					<li v-if="result.received"><strong>שם מתנדב שנתן:</strong> {{ formatValue(result.volunteer_name) }}
					</li>
					<li v-if="result.received"><strong>שעת קבלה:</strong> {{ formatTime(result.received_time) }}</li>
				</ul>
			</div>
		</div>
		<!-- קומפוננטת פרטי הלקוח האחרון -->
		<LastReceived :last-received="lastReceived" />
		<!-- קומפוננטת רישום לקוח חדש -->
		<div class="add-customer">
			<RegisterCustomer :base-url="baseURL" :volunteer_name="volunteerName" />
		</div>
	</div>
</template>

<script>
import RegisterCustomer from './RegisterCustomer.vue';
import StatsBox from './StatsBox.vue';
import VolunteerNameInput from './VolunteerNameInput.vue';
import LastReceived from './LastReceived.vue';
import AdminPanel from './AdminPanel.vue';

export default {
	components: {
		RegisterCustomer,
		StatsBox,
		VolunteerNameInput,
		LastReceived,
		AdminPanel,
	},
	data() {
		return {
			baseURL: process.env.VUE_APP_API_URL,
			volunteerName: "",
			idNumber: "",
			phoneNumber: "",
			idActive: false,
			phoneActive: false,
			result: null,
			totalCustomers: 0,
			totalTaken: 0,
			percentageTaken: 0,
			lastReceived: null, // פרטי הלקוח האחרון
			showUpdateForm: false, // מציין אם תיבת העדכון פתוחה
			editableFields: {}, // שדות הניתנים לעריכה
		};
	},
	mounted() {
		this.updateTaken(); // עדכון מספר האנשים שלקחו
		setInterval(this.updateTaken, 60000); // עדכון כל דקה
	},
	methods: {
		async updateTaken() {
			try {
				const response = await fetch(`${this.baseURL}/updateTaken`, {
					method: "GET",
					headers: { "Content-Type": "application/json" },

				});
				const data = await response.json();
				this.totalTaken = data.totalTaken;
				this.percentageTaken = data.percentageTaken;
				this.totalCustomers = data.totalCustomers; // עדכון מספר הלקוחות
				console.log("totalCustomers:", this.totalCustomers);
				
			} catch (error) {
				console.error("Error updating taken:", error);
			}
		},
		disableOther(field) {
			if (field === "id") {
				this.idActive = this.idNumber.length > 0;
			} else if (field === "phone") {
				this.phoneActive = this.phoneNumber.length > 0;
			}
			if (field === "phone") this.idNumber = "";
		},
		async search() {
			try {
				console.log('Base URL:', this.baseURL);
				if (!this.idActive && !this.phoneActive) {
					alert("אנא הכנס מספר זהות או מספר טלפון לחיפוש.");
					return;
				}
				const searchField = this.idActive ? { id: this.idNumber } : { phone: this.phoneNumber };
				const ext = this.idActive ? "id" : "phone";
				const response = await fetch(`${this.baseURL}/search${ext}`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(searchField),

				});
				const data = await response.json();
				this.result = data.success ? data.customer : null; // עדכון התוצאה
				if (!this.result) {
					alert("לא נמצאו תוצאות לחיפוש.");
				}

			} catch (error) {
				console.error("Error fetching data:", error);
				alert("שגיאה בחיפוש, אנא נסה שוב.");
			}
		},
		async markReceived() {
			console.log("Volunteer Name:", this.volunteerName);
			const response = await fetch(`${this.baseURL}/mark`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${localStorage.getItem("tokenUser")}`, // הוספת הטוקן לבקשה
				},
				body: JSON.stringify({ id: this.result.id, volunteer_name: this.volunteerName }),
			});
			const res = await response.json();
			console.log(res.message);
			console.log("Total taken:", res.totalTaken);

			this.totalTaken = await res.totalTaken; // עדכון מספר האנשים שלקחו
			this.lastReceived = this.result; // עדכון פרטי הלקוח האחרון
			this.percentageTaken = await res.percentageTaken; // עדכון האחוזים
			this.totalCustomers = await res.totalCustomers; // עדכון מספר הלקוחות
			this.resetSearch(); // איפוס החיפוש
			console.log("Total taken:", this.totalTaken);
			console.log("Percentage taken:", this.percentageTaken);
			//alert("הלקוח סומן כקיבל בהצלחה.");

		},
		resetSearch() {
			this.result = null;
			this.idNumber = "";
			this.phoneNumber = "";
			this.idActive = false;
			this.phoneActive = false;
		},
		formatTime(dateString) {
			const date = new Date(dateString);
			return date.toLocaleTimeString('he-IL', {
				hour: '2-digit',
				minute: '2-digit',
			});
		},
		formatValue(value) {
			//console.log("Value received:", value); // הדפסת הערך לקונסולה
			if (value === "NaN" || value === "nan") {
				//console.log("Invalid value detected, returning empty string.");
				return ""; // מחזיר מחרוזת ריקה אם הערך אינו תקין
			}
			return value; // מחזיר את הערך כמחרוזת
		},
		openUpdateForm() {
			this.showUpdateForm = true;
			// העתקת השדות הניתנים לעריכה, רק השדות הרצויים
			const allowedFields = [
				"last_name",
				"father_first_name",
				"father_id",
				"mother_first_name",
				"mother_id",
				"father_phone", // מספר טלפון של האב
				"mother_phone", // מספר טלפון של האם
				"additional_phone", // טלפון נוסף
				"street",
				"house_number",
				"apartment_number",
				"entrance",
				"floor",
				"city",
				"unmarried_children",
				"married_children",
			];
			this.editableFields = Object.keys(this.result)
				.filter((key) => allowedFields.includes(key))
				.reduce((obj, key) => {
					obj[key] = this.formatValue(this.result[key]);
					return obj;
				}, {});
		},
		closeUpdateForm() {
			this.showUpdateForm = false;
		},
		async updateCustomer() {
			try {
				// שילוב כל השדות (כולל אלה שלא ניתנים לעריכה) עם השדות הניתנים לעריכה
				const updatedData = { ...this.result, ...this.editableFields };
				// use formatValue to format the values
				Object.keys(updatedData).forEach((key) => {
					updatedData[key] = this.formatValue(updatedData[key]);
				});
				const response = await fetch(`${this.baseURL}/update`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Authorization": `Bearer ${localStorage.getItem("tokenUser")}`, // הוספת הטוקן לבקשה
					},
					body: JSON.stringify(updatedData),
				});

				const data = await response.json();
				if (data.success) {
					alert("הנתונים עודכנו בהצלחה.");
					this.result = data.castomer; // עדכון התוצאה עם הנתונים החדשים
					this.closeUpdateForm();
				} else {
					alert("שגיאה בעדכון הנתונים.");
				}
			} catch (error) {
				console.error("Error updating data:", error);
				alert("שגיאה בעדכון הנתונים, אנא נסה שוב.");
			}
		},
		translateField(field) {
			const translations = {
				last_name: "שם משפחה",
				father_first_name: "שם האב",
				father_id: "מספר זהות של האב",
				mother_first_name: "שם האם",
				mother_id: "מספר זהות של האם",
				father_phone: "מספר טלפון של האב",
				mother_phone: "מספר טלפון של האם",
				additional_phone: "טלפון נוסף",
				street: "רחוב",
				house_number: "מספר בית",
				apartment_number: "מספר דירה",
				entrance: "כניסה",
				floor: "קומה",
				city: "עיר",
				unmarried_children: "מספר ילדים שאינם נשואים",
				married_children: "מספר ילדים נשואים",
			};
			return translations[field] || field;
		},
	},
	watch: {
		volunteerName(newValue) {
			console.log("Volunteer Name in Parent:", newValue);
		},
	},
};
</script>

<style>
/* עיצוב כללי */
body {
	background-color: #f0f4f8;
	font-family: Arial, sans-serif;
	margin: 0;
	padding: 0;
}

/* עיצוב לקומפוננטות */
.container {
	direction: rtl;
	max-width: 1500px;
	margin: 120px auto;
	text-align: center;
	padding: 20px;
	border: 1px solid #ccc;
	border-radius: 8px;
	background-color: #ffffff;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* עיצוב רספונסיבי */
@media (max-width: 768px) {
	body {
		margin: 0;
		padding: 0;
	}

	.container {
		max-width: 90%;
		/* שינוי הרוחב ל-90% */
		margin: 20px auto;
		padding: 10px;
		box-shadow: none;
		border: none;
	}

	.stats-box,
	.add-customer,
	.result-box,
	.update-form {
		position: static;
		/* הסרת מיקום קבוע */
		margin: 10px 0;
		width: 90%;
		/* שינוי הרוחב ל-90% */
	}

	.header {
		position: static;
		/* הסרת מיקום קבוע */
		text-align: center;
		padding: 10px;
		font-size: 16px;
	}

	.result-list {
		grid-template-columns: 1fr;
		/* עמודה אחת */
	}

	button {
		width: 90%;
		/* שינוי הרוחב ל-90% */
		font-size: 14px;
	}

	.search-group {
		width: 90%;
		/* שינוי הרוחב ל-90% */
		margin: 10px 0;
	}

	.search-group input {
		width: 90%;
		/* שינוי הרוחב ל-90% */
	}
}

.header {
	position: fixed;
	/* קובע את המיקום כקבוע */
	top: 0;
	width: 100%;
	z-index: 1000;
	/* מבטיח שהשורה תהיה מעל כל האלמנטים */
	text-align: right;
	padding: 10px 20px;
	background-color: #007bff;
	color: white;
	font-size: 14px;
	font-weight: bold;
	border-bottom: 2px solid #0056b3;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 10px;
}

.header input {
	padding: 5px;
	border: 1px solid #ccc;
	border-radius: 4px;
	font-size: 14px;
	width: 200px;
}

.stats-box {
	position: fixed;
	top: 60px;
	/* מתחת לשורת שם המתנדב */
	left: 10px;
	background-color: #ffffff;
	border: 1px solid #ccc;
	border-radius: 8px;
	padding: 15px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	width: 200px;
	text-align: center;
}

.stats-box h3 {
	margin: 0 0 10px;
	font-size: 16px;
	color: #333;
}

/* מצב חיפוש פעיל */
.container.search-active {
	max-width: 500px;
	/* רוחב תיבת החיפוש */
	transition: max-width 0.3s ease;
	/* אנימציה לשינוי הרוחב */
}

/* מצב תוצאות מוצגות */
.container.results-active {
	max-width: 1500px;
	/* רוחב תיבת התוצאות */
	transition: max-width 0.3s ease;
	/* אנימציה לשינוי הרוחב */
}

h1 {
	color: #333;
	margin-bottom: 20px;
}

.search-group {
	margin: 15px 0;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
}

.search-group label {
	font-weight: bold;
	margin-bottom: 5px;
}

.search-group input {
	padding: 10px;
	border: 1px solid #ccc;
	border-radius: 4px;
	width: 100%;
	box-sizing: border-box;
	font-size: 14px;
}

button {
	margin-top: 20px;
	padding: 10px 20px;
	background-color: #007bff;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 16px;
	transition: background-color 0.3s ease;
}

button:hover {
	background-color: #0056b3;
}

.back-button {
	margin-bottom: 20px;
	padding: 10px 20px;
	background-color: #6c757d;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 16px;
	transition: background-color 0.3s ease;
}

.back-button:hover {
	background-color: #5a6268;
}

.result-box {
	margin-top: 20px;
	padding: 15px;
	border: 1px solid #007bff;
	background: #e9f5ff;
	border-radius: 4px;
	text-align: right;
	/* יישור לימין */
	direction: rtl;
	/* כיוון כתיבה מימין לשמאל */
	max-width: 1200px;
	/* הגדלת רוחב התיבה */
	margin-left: auto;
	/* מרכז את התיבה */
	margin-right: auto;
	/* מרכז את התיבה */
}

.result-header {
	display: flex;
	justify-content: space-between;
	/* מרווח בין הכפתור להודעה */
	align-items: center;
	margin-bottom: 15px;
}

.mark-button {
	padding: 10px 20px;
	background-color: #28a745;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 14px;
	transition: background-color 0.3s ease;
}

.mark-button:hover {
	background-color: #218838;
}

.received-message {
	font-size: 14px;
	color: #dc3545;
	font-weight: bold;
}

.update-button {
	margin-left: 10px;
	padding: 10px 20px;
	background-color: #ffc107;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 14px;
	transition: background-color 0.3s ease;
}

.update-button:hover {
	background-color: #e0a800;
}

.update-form {
	margin-top: 20px;
	padding: 15px;
	border: 1px solid #007bff;
	background: #f9f9f9;
	border-radius: 4px;
	text-align: right;
	direction: rtl;
	display: grid;
	/* שימוש ב-Grid Layout */
	grid-template-columns: repeat(3, 1fr);
	/* 3 עמודות */
	gap: 20px;
	/* ריווח בין השדות */
}

.update-group {
	display: flex;
	flex-direction: column;
}

.update-group {
	margin-bottom: 10px;
}

.update-group label {
	display: block;
	font-weight: bold;
	margin-bottom: 5px;
}

.update-group input {
	width: 100%;
	padding: 8px;
	border: 1px solid #ccc;
	border-radius: 4px;
	box-sizing: border-box;
}

.cancel-button {
	margin-left: 10px;
	padding: 10px 20px;
	background-color: #dc3545;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 14px;
	transition: background-color 0.3s ease;
}

.cancel-button:hover {
	background-color: #c82333;
}

.result-list {
	display: grid;
	/* שימוש ב-Grid Layout */
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	/* התאמה אוטומטית של העמודות */
	gap: 20px;
	/* ריווח בין הפריטים */
	list-style-type: none;
	/* הסרת סימוני העיגולים */
	padding: 0;
	margin: 0;
}

.result-list li {
	font-size: 16px;
	padding: 10px;
	/* ריווח פנימי */
	border: 1px solid #ccc;
	/* גבול מסביב */
	border-radius: 4px;
	/* פינות מעוגלות */
	background-color: #ffffff;
	/* רקע לבן */
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	/* צל קל */
	text-align: right;
	/* יישור לימין */
}

.add-customer {
	margin-top: 80px;
	/* מרווח מתחת לסטטיסטיקות */
	text-align: center;
}
</style>