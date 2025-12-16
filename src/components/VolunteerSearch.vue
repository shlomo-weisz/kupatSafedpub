<template>
	<div>
		<!-- קומפוננטת שם המתנדב -->
		<VolunteerNameInput :value="volunteerName" @update-volunteer-name="volunteerName = $event" />

		<!-- Responsive layout wrapper to avoid overlaps -->
		<div class="layout-grid">
			<!-- קומפוננטת הסטטיסטיקות -->
			<StatsBox :total-taken="totalTaken" :percentage-taken="percentageTaken" :totalCustomers="totalCustomers" />

			<div :class="['container', result || lastNameResults.length > 0 ? 'results-active' : 'search-active']">

				<h1>מערכת חלוקות קופת צפת</h1>

				<!-- כפתור חזרה לחיפוש -->
				<button v-if="result || lastNameResults.length > 0" @click="resetSearch" class="back-button">חזרה
					לחיפוש</button>

				<!-- תיבת החיפוש -->
				<div v-if="!result && lastNameResults.length === 0">
					<div class="search-group">
						<label for="idNumber">חיפוש לפי מספר זהות:</label>
						<input ref="idInput" type="text" v-model="idNumber" :disabled="phoneActive || lastNameActive"
							@input="disableOther('id')" @keydown.enter="performSearch" />
					</div>

					<div class="search-group">
						<label for="phoneNumber">חיפוש לפי מספר טלפון:</label>
						<input type="text" v-model="phoneNumber" :disabled="idActive || lastNameActive"
							@input="disableOther('phone')" @keydown.enter="performSearch" />
					</div>

					<div class="search-group">
						<label for="lastName">חיפוש לפי שם משפחה:</label>
						<input type="text" v-model="lastName" :disabled="idActive || phoneActive"
							@input="disableOther('lastName')" @keydown.enter="performSearch" />
					</div>

					<button @click="performSearch" :disabled="!idNumber && !phoneNumber && !lastName">חפש</button>
				</div>

				<!-- תוצאות חיפוש -->
				<div v-if="result && !showUpdateForm" class="result-box">
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
							<input type="text" :id="key" v-model="editableFields[key]"
								:placeholder="translateField(key)" />
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
						<li v-if="result.received"><strong>שם מתנדב שנתן:</strong> {{ formatValue(result.volunteer_name)
						}}
						</li>
						<li v-if="result.received"><strong>שעת קבלה:</strong> {{ formatTime(result.received_time) }}
						</li>
					</ul>
				</div>

				<!-- תוצאות חיפוש לפי שם משפחה -->
				<div v-if="(lastNameResults.length > 0 || lastNameSearchError) && !result"
					class="result-box last-name-results">
					<h2 v-if="lastNameResults.length > 0">תוצאות חיפוש לפי שם משפחה: {{ lastName }}</h2>
					<button v-if="lastNameResults.length > 0" @click="toggleLastNameResults"
						class="toggle-results-button">
						{{ lastNameResultsVisible ? 'הסתר תוצאות' : 'הצג תוצאות' }}
					</button>
					<ul v-if="lastNameResults.length > 0 && lastNameResultsVisible" class="result-list">
						<li v-for="customer in lastNameResults" :key="customer.id" class="last-name-result-item">
							<div class="customer-info">
								<span>{{ customer.last_name }}, {{ customer.father_first_name }} (אב), {{
									customer.mother_first_name }} (אם) - עיר: {{ customer.city }}</span>
							</div>
							<div class="action-buttons">
								<button v-if="customer.father_id" @click="copyFatherId(customer.father_id)"
									class="copy-button">העתק ת.ז אב</button>
								<button v-if="customer.mother_id" @click="copyMotherId(customer.mother_id)"
									class="copy-button">העתק ת.ז אם</button>
								<button v-if="customer.father_phone" @click="copyFatherPhone(customer.father_phone)"
									class="copy-button">העתק טלפון אב</button>
								<button v-if="customer.mother_phone" @click="copyMotherPhone(customer.mother_phone)"
									class="copy-button">העתק טלפון אם</button>
							</div>
						</li>
					</ul>
					<p v-if="lastNameSearchError && lastNameResults.length === 0" class="error-message">{{
						lastNameSearchError }}</p>
				</div>

			</div>

			<!-- קומפוננטת כלי הניהול -->
			<AdminPanel :base-url="baseURL" />
			<!-- קומפוננטת פרטי הלקוח האחרון (חלק מהגריד) -->
			<LastReceived :last-received="lastReceived" />
			<!-- קומפוננטת רישום לקוח חדש -->
			<div class="add-customer">
				<RegisterCustomer :base-url="baseURL" :volunteer_name="volunteerName" />
			</div>
		</div> <!-- end layout-grid -->
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
			lastName: "",
			lastNameActive: false,
			lastNameResults: [],
			lastNameSearchError: null,
			lastNameResultsVisible: true, // להצגת התוצאות כברירת מחדל
			showJuicePopup: false,
			juiceSecondsLeft: 6,
			juicePopupIntervalId: null,
			juicePopupTimeoutId: null,
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
				if (this.idActive) {
					this.phoneNumber = "";
					this.lastName = "";
					this.phoneActive = false;
					this.lastNameActive = false;
				}
			} else if (field === "phone") {
				this.phoneActive = this.phoneNumber.length > 0;
				if (this.phoneActive) {
					this.idNumber = "";
					this.lastName = "";
					this.idActive = false;
					this.lastNameActive = false;
				}
			} else if (field === "lastName") {
				this.lastNameActive = this.lastName.length > 0;
				if (this.lastNameActive) {
					this.idNumber = "";
					this.phoneNumber = "";
					this.idActive = false;
					this.phoneActive = false;
				}
			}
		},
		async performSearch() {
			this.result = null; // Clear previous single result
			this.lastNameResults = []; // Clear previous last name results
			this.lastNameSearchError = null; // Clear previous last name search error

			if (this.idActive && this.idNumber) {
				await this.searchByIdOrPhone('id');
			} else if (this.phoneActive && this.phoneNumber) {
				await this.searchByIdOrPhone('phone');
			} else if (this.lastNameActive && this.lastName) {
				await this.searchByLastNameInternal();
			} else if (this.idNumber) { // Fallback if active flags are not set but input exists
				await this.searchByIdOrPhone('id');
			} else if (this.phoneNumber) {
				await this.searchByIdOrPhone('phone');
			} else if (this.lastName) {
				await this.searchByLastNameInternal();
			} else {
				alert("אנא הכנס ערך לחיפוש באחד השדות.");
			}
		},
		async searchByIdOrPhone(type) {
			try {
				console.log('Base URL:', this.baseURL);
				const searchField = type === 'id' ? { id: this.idNumber } : { phone: this.phoneNumber };
				const ext = type === 'id' ? "id" : "phone";
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
				console.error(`Error fetching data by ${type}:`, error);
				alert("שגיאה בחיפוש, אנא נסה שוב.");
			}
		},
		async searchByLastNameInternal() { // Renamed from searchByLastName
			if (!this.lastName.trim()) {
				this.lastNameSearchError = "אנא הכנס שם משפחה לחיפוש.";
				this.lastNameResults = [];
				return;
			}
			try {
				const response = await fetch(`${this.baseURL}/searchlastname`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ lastName: this.lastName }),
				});
				const data = await response.json();
				if (response.ok && data.success) {
					this.lastNameResults = data.customers;
					if (data.customers.length === 0) {
						// This case should ideally be handled by the server sending a 404 or specific message
						this.lastNameSearchError = "לא נמצאו לקוחות עם שם משפחה זה.";
					}
				} else if (response.status === 404) {
					this.lastNameResults = [];
					this.lastNameSearchError = data.message || "לא נמצאו לקוחות התואמים לשם המשפחה שהוזן.";
				} else {
					this.lastNameResults = [];
					this.lastNameSearchError = data.message || "שגיאה בחיפוש לפי שם משפחה.";
				}
			} catch (error) {
				console.error("Error searching by last name:", error);
				this.lastNameResults = [];
				this.lastNameSearchError = "שגיאה בחיפוש, אנא נסה שוב.";
			}
		},
		copyFatherId(fatherId) {
			this.idNumber = fatherId;
			this.idActive = true;
			this.phoneActive = false;
			this.lastNameActive = false;
			this.phoneNumber = "";
			this.lastName = "";
			this.lastNameResults = []; // נקה תוצאות שם משפחה
			this.lastNameSearchError = null;
			this.result = null; // Clear single search result
		},
		copyMotherId(motherId) {
			this.idNumber = motherId;
			this.idActive = true;
			this.phoneActive = false;
			this.lastNameActive = false;
			this.phoneNumber = "";
			this.lastName = "";
			this.lastNameResults = [];
			this.lastNameSearchError = null;
			this.result = null;
		},
		copyFatherPhone(fatherPhone) {
			this.phoneNumber = fatherPhone;
			this.phoneActive = true;
			this.idActive = false;
			this.lastNameActive = false;
			this.idNumber = "";
			this.lastName = "";
			this.lastNameResults = [];
			this.lastNameSearchError = null;
			this.result = null;
		},
		copyMotherPhone(motherPhone) {
			this.phoneNumber = motherPhone;
			this.phoneActive = true;
			this.idActive = false;
			this.lastNameActive = false;
			this.idNumber = "";
			this.lastName = "";
			this.lastNameResults = [];
			this.lastNameSearchError = null;
			this.result = null;
		},
		toggleLastNameResults() {
			this.lastNameResultsVisible = !this.lastNameResultsVisible;
		},
		openJuicePopup() {
			// clear any existing timers
			if (this.juicePopupIntervalId) {
				clearInterval(this.juicePopupIntervalId);
				this.juicePopupIntervalId = null;
			}
			if (this.juicePopupTimeoutId) {
				clearTimeout(this.juicePopupTimeoutId);
				this.juicePopupTimeoutId = null;
			}
			this.juiceSecondsLeft = 6;
			this.showJuicePopup = true;
			this.juicePopupIntervalId = setInterval(() => {
				if (this.juiceSecondsLeft > 0) this.juiceSecondsLeft -= 1;
			}, 1000);
			this.juicePopupTimeoutId = setTimeout(() => {
				this.closeJuicePopup();
			}, 6000);
		},
		closeJuicePopup() {
			if (this.juicePopupIntervalId) {
				clearInterval(this.juicePopupIntervalId);
				this.juicePopupIntervalId = null;
			}
			if (this.juicePopupTimeoutId) {
				clearTimeout(this.juicePopupTimeoutId);
				this.juicePopupTimeoutId = null;
			}
			this.showJuicePopup = false;
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

			// הצגת חלונית רק אם בקשת הסימון הצליחה
			if (response.ok && res && res.success !== false) {
				const unmarried = parseInt(this.result && this.result.unmarried_children, 10);
				if (!isNaN(unmarried) && unmarried >= 7) {
					this.openJuicePopup();
				}
			}

			this.totalTaken = await res.totalTaken; // עדכון מספר האנשים שלקחו
			this.lastReceived = this.result; // עדכון פרטי הלקוח האחרון
			this.percentageTaken = await res.percentageTaken; // עדכון האחוזים
			this.totalCustomers = await res.totalCustomers; // עדכון מספר הלקוחות
			this.resetSearch(); // איפוס החיפוש
		},
		resetSearch() {
			this.result = null;
			this.idNumber = "";
			this.phoneNumber = "";
			this.lastName = "";
			this.idActive = false;
			this.phoneActive = false;
			this.lastNameActive = false;
			this.lastNameResults = [];
			this.lastNameSearchError = null;
			this.showUpdateForm = false; // סגירת טופס העדכון אם פתוח
			// Focus ID input so user can type immediately
			this.$nextTick(() => {
				if (this.$refs.idInput && typeof this.$refs.idInput.focus === 'function') {
					this.$refs.idInput.focus();
				}
			});
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
	beforeUnmount() {
		// cleanup timers
		if (this.juicePopupIntervalId) clearInterval(this.juicePopupIntervalId);
		if (this.juicePopupTimeoutId) clearTimeout(this.juicePopupTimeoutId);
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
	-webkit-text-size-adjust: 100%;
	/* Prevent iOS text size adjustment after orientation change. */
	text-size-adjust: 100%;
	/* Prevent text size adjustment on other mobile browsers. */
}

/* עיצוב לקומפוננטות */
.container {
	direction: rtl;
	max-width: 1500px;
	margin: 70px auto 20px;
	/* Adjusted top margin, auto for L/R, 20px bottom */
	text-align: center;
	padding: 20px;
	border: 1px solid #ccc;
	border-radius: 8px;
	background-color: #ffffff;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	box-sizing: border-box;
	/* Ensure padding and border are included in the element\'s total width and height */
}

/***** Layout wrapper *****/
.layout-grid {
	display: grid;
	grid-template-columns: 300px 1fr 280px;
	gap: 16px;
	align-items: start;
	max-width: 1500px;
	margin: 0 auto;
	padding: 0 12px;
	box-sizing: border-box;
}

/* Ensure children take full column width */
.layout-grid .admin-panel,
.layout-grid .stats-box,
.layout-grid .container,
.layout-grid .add-customer {
	width: 100%;
}

/* Make add-customer span full width */
.layout-grid>.add-customer {
	grid-column: 1 / -1;
}

/* Tweak columns on medium screens */
@media (max-width: 1200px) {
	.layout-grid {
		grid-template-columns: 260px 1fr;
	}

	/* Push AdminPanel to full-width next row */
	.layout-grid>.admin-panel {
		grid-column: 1 / -1;
	}
}

/* Single column stack on tablets/phones */
@media (max-width: 900px) {
	.layout-grid {
		grid-template-columns: 1fr;
	}

	.layout-grid>.admin-panel,
	.layout-grid>.stats-box,
	.layout-grid>.container {
		grid-column: 1 / -1;
	}
}

/* רספונסיביות לשורות ולתצוגות שונות */
@media (max-width: 1200px) {

	/* For laptops and larger tablets */
	.container {
		max-width: 95%;
		margin: 70px auto 15px;
		/* Adjusted top margin */
	}

	.update-form {
		grid-template-columns: repeat(2, 1fr);
		/* 2 columns for medium screens */
	}

	.result-list {
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	}
}

@media (max-width: 767px) {

	/* Adjusted from 768px for better iPad handling */
	body {
		margin: 0;
		padding: 0;
	}

	.container {
		max-width: 100%;
		/* Full width on smaller screens */
		margin: 20px auto 10px;
		/* Reduced top margin for static flow */
		/* Adjusted top margin as header becomes static */
		padding: 10px;
		box-shadow: none;
		border: none;
		border-radius: 0;
		/* No border radius for full width */
	}

	.stats-box,
	.add-customer,
	.result-box,
	.update-form {
		position: static;
		margin: 10px 0;
		width: 100%;
		/* Full width for these sections */
		box-sizing: border-box;
	}

	.admin-panel {
		position: static;
		/* Make AdminPanel static on smaller screens */
		width: 100%;
		margin: 10px 0;
		box-sizing: border-box;
	}

	.header {
		/* position: static; is already set in the main 767px block */
		/* Add any other specific adjustments for static header if needed */
		justify-content: center;
		/* Center items in static header */
		padding-top: 15px;
		/* Add more padding when static */
		padding-bottom: 15px;
		z-index: 1002;
		/* Ensure header is above other fixed elements */
	}

	/* Adjusting VolunteerNameInput specific styles if it\'s part of .header */
	.header input {
		width: calc(100% - 40px);
		/* Ensure input fits well */
		margin: 5px 20px;
	}


	.result-list {
		grid-template-columns: 1fr;
		/* Single column for result items */
	}

	.result-list li {
		font-size: 0.95em;
		/* Slightly smaller font for list items */
	}

	button,
	.copy-button,
	.toggle-results-button,
	.mark-button,
	.update-button,
	.cancel-button,
	.back-button {
		width: calc(100% - 20px);
		/* Full width buttons with some padding */
		margin: 10px auto;
		/* Centering buttons */
		padding: 12px 15px;
		/* Comfortable padding for touch targets */
		font-size: 1em;
		/* Scalable font size */
		box-sizing: border-box;
	}

	.action-buttons button,
	.action-buttons .copy-button {
		/* More specific for buttons in .action-buttons */
		width: auto;
		/* Allow multiple buttons per line if space permits */
		margin: 5px;
		/* Smaller margin for these buttons */
		padding: 8px 12px;
		font-size: 0.9em;
	}


	.search-group {
		width: 100%;
		/* Full width for search groups */
		margin: 10px 0;
		box-sizing: border-box;
	}

	.search-group input {
		width: calc(100% - 20px);
		/* Input width with padding */
		margin: 0 auto;
		/* Centering input */
		padding: 12px;
		font-size: 1em;
		box-sizing: border-box;
	}

	.search-group label {
		padding-right: 10px;
		/* Add some padding for RTL */
		padding-left: 10px;
		/* Add some padding for LTR if needed */
	}

	h1 {
		font-size: 1.5em;
		/* Responsive font size for heading */
	}

	.last-name-result-item {
		flex-direction: column;
		/* Stack info and buttons vertically */
		align-items: stretch;
		/* Stretch items to full width */
	}

	.last-name-result-item .customer-info,
	.last-name-result-item .action-buttons {
		width: 100%;
		text-align: center;
		/* Center text and buttons */
		margin-right: 0;
		/* Remove margin for stacked layout */
	}

	.last-name-result-item .action-buttons {
		justify-content: center;
		/* Center buttons in their container */
		margin-top: 10px;
	}

}

@media (max-width: 480px) {

	/* For very small mobile screens */
	.container {
		margin: 10px auto 5px;
		/* Fine-tuned margin for very small screens */
		padding: 5px;
	}

	h1 {
		font-size: 1.2em;
	}

	button,
	.copy-button,
	.toggle-results-button,
	.mark-button,
	.update-button,
	.cancel-button,
	.back-button {
		padding: 10px;
		font-size: 0.95em;
	}

	.search-group input {
		padding: 10px;
		font-size: 0.95em;
	}

	.result-list li {
		font-size: 0.9em;
		padding: 8px;
	}

	.stats-box {
		/* Ensure StatsBox is also responsive */
		width: 100%;
		padding: 10px;
		box-sizing: border-box;
		left: 0;
		/* Adjust fixed positioning if it was used */
		top: auto;
		/* Adjust fixed positioning */
		position: static;
		/* Or relative, depending on desired behavior */
	}

	.admin-panel {
		/* Assuming AdminPanel might also need adjustments */
		width: 100%;
		padding: 10px;
		box-sizing: border-box;
		position: static;
		/* Or relative */
	}

	.last-name-result-item .action-buttons button {
		width: calc(50% - 10px);
		/* Two buttons per row on small screens */
		margin: 5px;
	}
}


.header {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	width: 100%;
	z-index: 1000;
	text-align: right;
	padding: 10px 20px;
	background-color: #007bff;
	color: white;
	font-size: 14px;
	/* Base font size for header */
	line-height: 1.5;
	/* Added for better text spacing if content wraps */
	font-weight: bold;
	border-bottom: 2px solid #0056b3;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 10px;
	box-sizing: border-box;
}

@media (max-width: 767px) {

	/* Styles for when header becomes static */
	.header {
		/* position: static; is already set in the main 767px block */
		/* Add any other specific adjustments for static header if needed */
		justify-content: center;
		/* Center items in static header */
		padding-top: 15px;
		/* Add more padding when static */
		padding-bottom: 15px;
		z-index: 1001;
		/* Ensure header is above other fixed elements if any confusion */
	}

	.header input {
		width: calc(100% - 40px);
		/* Ensure input fits well */
		margin: 5px 20px;
	}
}

/* Grid layout will manage positions; avoid local fixed overrides here */


/* מצב חיפוש פעיל */
.container.search-active {
	max-width: 500px;
	transition: max-width 0.3s ease;
}

/* מצב תוצאות מוצגות */
.container.results-active {
	max-width: 1500px;
	/* Default max-width */
	transition: max-width 0.3s ease;
}

@media (max-width: 1200px) {
	.container.results-active {
		max-width: 95%;
		/* Adjust for laptops */
	}
}

@media (max-width: 767px) {

	.container.search-active,
	.container.results-active {
		max-width: 100%;
		/* Full width on smaller screens */
	}
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
	/* Default to full width within its parent */
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
	direction: rtl;
	max-width: 1200px;
	/* Default max-width */
	margin-left: auto;
	margin-right: auto;
	box-sizing: border-box;
	/* Added for consistency */
}

@media (max-width: 1200px) {
	.result-box {
		max-width: 100%;
		/* Adjust for laptops, take full width of its container part */
	}
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
	grid-template-columns: repeat(3, 1fr);
	/* Default 3 columns */
	gap: 20px;
	box-sizing: border-box;
	/* Added for consistency */
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
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	/* Default responsive grid */
	gap: 20px;
	list-style-type: none;
	padding: 0;
	margin: 0;
}

.last-name-results .result-list {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.add-customer {
	margin-top: 20px;
	/* Reduced margin for better spacing on mobile */
	text-align: center;
	padding: 10px;
	/* Added padding */
	box-sizing: border-box;
}

.last-name-result-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10px;
	border-bottom: 1px solid #ddd;
	flex-wrap: wrap;
	/* Allow wrapping for responsiveness */
}

.last-name-result-item .customer-info {
	flex-grow: 1;
	margin-right: 10px;
	/* Default for larger screens */
	text-align: right;
	min-width: 200px;
	/* Default min-width */
	word-break: break-word;
	/* Prevent long strings from breaking layout */
}

.last-name-result-item .action-buttons {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: flex-start;
	/* Default for larger screens */
	margin-top: 5px;
	/* Default margin */
}

.last-name-result-item:last-child {
	border-bottom: none;
}

.copy-button {
	/* Renamed from copy-id-button and generalized */
	padding: 6px 12px;
	background-color: #17a2b8;
	/* Info blue */
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 13px;
	margin-top: 0;
	transition: background-color 0.3s ease;
}

.copy-button:hover {
	background-color: #138496;
}

.error-message {
	color: #dc3545;
	/* Red for errors */
	margin-top: 10px;
}

.toggle-results-button {
	margin-bottom: 10px;
	padding: 8px 15px;
	background-color: #6c757d;
	/* Secondary gray */
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 14px;
}

.toggle-results-button:hover {
	background-color: #5a6268;
}

/* Popup styles */
.popup-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.45);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 3000;
	/* Above header/admin */
}

.popup-content {
	background: #ffffff;
	border-radius: 8px;
	padding: 20px 24px;
	width: min(90%, 420px);
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
	direction: rtl;
	text-align: right;
	position: relative;
	border: 1px solid #dee2e6;
}

.popup-content h3 {
	margin: 0 0 10px 0;
	color: #343a40;
}

.popup-content p {
	margin: 6px 0;
	font-size: 16px;
	color: #212529;
}

.popup-countdown {
	color: #6c757d;
	font-size: 14px;
}

.popup-close {
	position: absolute;
	top: 8px;
	left: 8px;
	/* RTL close on left */
	background: transparent;
	border: none;
	font-size: 22px;
	line-height: 1;
	cursor: pointer;
	color: #333;
}

.popup-close:hover {
	color: #000;
}
</style>