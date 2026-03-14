<template>
	<div>
		<VolunteerNameInput
			:value="volunteerName"
			@update-volunteer-name="volunteerName = $event"
		/>

		<div class="layout-grid">
			<StatsBox
				:total-taken="totalTaken"
				:percentage-taken="percentageTaken"
				:total-customers="totalCustomers"
			/>

			<div
				:class="[
					'container',
					result || lastNameResults.length > 0 ? 'results-active' : 'search-active',
				]"
			>
				<h1>מערכת חלוקות קופת צפת</h1>

				<button
					v-if="result || lastNameResults.length > 0"
					@click="resetSearch"
					class="back-button"
				>
					חזרה לחיפוש
				</button>

				<div v-if="!result && lastNameResults.length === 0">
					<div class="search-group">
						<label for="idNumber">חיפוש לפי מספר זהות:</label>
						<input
							id="idNumber"
							ref="idInput"
							v-model="idNumber"
							type="text"
							:disabled="phoneActive || lastNameActive"
							@input="disableOther('id')"
							@keydown.enter="performSearch"
						/>
					</div>

					<div class="search-group">
						<label for="phoneNumber">חיפוש לפי מספר טלפון:</label>
						<input
							id="phoneNumber"
							v-model="phoneNumber"
							type="text"
							:disabled="idActive || lastNameActive"
							@input="disableOther('phone')"
							@keydown.enter="performSearch"
						/>
					</div>

					<div class="search-group">
						<label for="lastName">חיפוש לפי שם משפחה:</label>
						<input
							id="lastName"
							v-model="lastName"
							type="text"
							:disabled="idActive || phoneActive"
							@input="disableOther('lastName')"
							@keydown.enter="performSearch"
						/>
					</div>

					<button
						@click="performSearch"
						:disabled="!idNumber && !phoneNumber && !lastName"
					>
						חפש
					</button>
				</div>

				<div v-if="result" class="result-box">
					<div v-if="!showUpdateForm">
						<div class="result-header">
							<button
								v-if="!result.received"
								@click="markReceived"
								class="mark-button"
							>
								סמן כקיבל
							</button>
							<p v-if="result.received" class="received-message">הלקוח כבר קיבל</p>
							<button @click="openUpdateForm" class="update-button">
								עדכן נתונים
							</button>
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
							<li>
								<strong>מספר ילדים שאינם נשואים:</strong>
								{{ formatValue(result.unmarried_children) }}
							</li>
							<li>
								<strong>מספר ילדים נשואים:</strong>
								{{ formatValue(result.married_children) }}
							</li>
							<li><strong>סך הכל ילדים:</strong> {{ formatValue(result.total_children) }}</li>
							<li v-if="result.received">
								<strong>שם מתנדב שנתן:</strong>
								{{ formatValue(result.volunteer_name) }}
							</li>
							<li v-if="result.received">
								<strong>שעת קבלה:</strong> {{ formatTime(result.received_time) }}
							</li>
						</ul>
					</div>

					<div v-else class="update-form">
						<h3>עדכון נתונים</h3>
						<div
							v-for="(value, key) in editableFields"
							:key="key"
							class="update-group"
						>
							<label :for="key">{{ translateField(key) }}:</label>
							<input
								:id="key"
								v-model="editableFields[key]"
								type="text"
								:placeholder="translateField(key)"
							/>
						</div>
						<button @click="updateCustomer">עדכן</button>
						<button @click="closeUpdateForm" class="cancel-button">ביטול</button>
					</div>
				</div>

				<div
					v-if="(lastNameResults.length > 0 || lastNameSearchError) && !result"
					class="result-box last-name-results"
				>
					<h2 v-if="lastNameResults.length > 0">
						תוצאות חיפוש לפי שם משפחה: {{ lastName }}
					</h2>
					<button
						v-if="lastNameResults.length > 0"
						@click="toggleLastNameResults"
						class="toggle-results-button"
					>
						{{ lastNameResultsVisible ? "הסתר תוצאות" : "הצג תוצאות" }}
					</button>
					<ul
						v-if="lastNameResults.length > 0 && lastNameResultsVisible"
						class="result-list"
					>
						<li
							v-for="customer in lastNameResults"
							:key="customer.id"
							class="last-name-result-item"
						>
							<div class="customer-info">
								<span>
									{{ customer.last_name }}, {{ customer.father_first_name }}
									(אב), {{ customer.mother_first_name }} (אם) - עיר:
									{{ customer.city }}
								</span>
							</div>
							<div class="action-buttons">
								<button
									v-if="customer.father_id"
									@click="copyFatherId(customer.father_id)"
									class="copy-button"
								>
									העתק ת.ז אב
								</button>
								<button
									v-if="customer.mother_id"
									@click="copyMotherId(customer.mother_id)"
									class="copy-button"
								>
									העתק ת.ז אם
								</button>
								<button
									v-if="customer.father_phone"
									@click="copyFatherPhone(customer.father_phone)"
									class="copy-button"
								>
									העתק טלפון אב
								</button>
								<button
									v-if="customer.mother_phone"
									@click="copyMotherPhone(customer.mother_phone)"
									class="copy-button"
								>
									העתק טלפון אם
								</button>
							</div>
						</li>
					</ul>
					<p v-if="lastNameSearchError && lastNameResults.length === 0" class="error-message">
						{{ lastNameSearchError }}
					</p>
				</div>
			</div>

			<AdminPanel />
			<LastReceived :last-received="lastReceived" />

			<div class="add-customer">
				<RegisterCustomer :volunteer_name="volunteerName" />
			</div>
		</div>

		<div v-if="showJuicePopup" class="popup-overlay" @click.self="closeJuicePopup">
			<div class="popup-content" role="dialog" aria-modal="true" aria-labelledby="juice-title">
				<button class="popup-close" @click="closeJuicePopup" aria-label="סגור">×</button>
				<h3 id="juice-title">מגיע מיץ ענבים</h3>
				<p>למשפחה זו יש 7 ילדים לא נשואים או יותר.</p>
				<p class="popup-countdown">החלונית תיסגר אוטומטית בעוד {{ juiceSecondsLeft }} שניות.</p>
			</div>
		</div>
	</div>
</template>

<script>
import RegisterCustomer from "./RegisterCustomer.vue";
import StatsBox from "./StatsBox.vue";
import VolunteerNameInput from "./VolunteerNameInput.vue";
import LastReceived from "./LastReceived.vue";
import AdminPanel from "./AdminPanel.vue";
import {
	authHeaders,
	buildApiUrl,
	clearStoredToken,
	getStoredToken,
	loginWithRole,
} from "../utils/api";

async function readJsonResponse(response) {
	const data = await response.json();
	if (!response.ok || data.success === false) {
		const error = new Error(data.message || "הפעולה נכשלה");
		error.status = response.status;
		throw error;
	}
	return data;
}

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
			volunteerName: "",
			idNumber: "",
			phoneNumber: "",
			idActive: false,
			phoneActive: false,
			result: null,
			totalCustomers: 0,
			totalTaken: 0,
			percentageTaken: "0.00",
			lastReceived: null,
			showUpdateForm: false,
			editableFields: {},
			lastName: "",
			lastNameActive: false,
			lastNameResults: [],
			lastNameSearchError: null,
			lastNameResultsVisible: true,
			showJuicePopup: false,
			juiceSecondsLeft: 6,
			juicePopupIntervalId: null,
			juicePopupTimeoutId: null,
			statsIntervalId: null,
		};
	},
	mounted() {
		this.updateTaken();
		this.statsIntervalId = window.setInterval(this.updateTaken, 60000);
	},
	beforeUnmount() {
		if (this.statsIntervalId) {
			clearInterval(this.statsIntervalId);
		}
		if (this.juicePopupIntervalId) {
			clearInterval(this.juicePopupIntervalId);
		}
		if (this.juicePopupTimeoutId) {
			clearTimeout(this.juicePopupTimeoutId);
		}
	},
	methods: {
		async ensureUsersToken() {
			let token = getStoredToken("users");
			if (token) {
				return token;
			}

			const password = window.prompt("נדרשת סיסמת משתמש לביצוע הפעולה:");
			if (!password) {
				throw new Error("הפעולה בוטלה.");
			}

			token = await loginWithRole("users", password);
			return token;
		},
		async updateTaken() {
			try {
				const response = await fetch(buildApiUrl("/updateTaken"), {
					method: "GET",
					headers: { "Content-Type": "application/json" },
				});
				const data = await readJsonResponse(response);
				this.totalTaken = data.totalTaken;
				this.percentageTaken = data.percentageTaken;
				this.totalCustomers = data.totalCustomers;
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
			this.result = null;
			this.lastNameResults = [];
			this.lastNameSearchError = null;

			if (this.idActive && this.idNumber) {
				await this.searchByIdOrPhone("id");
			} else if (this.phoneActive && this.phoneNumber) {
				await this.searchByIdOrPhone("phone");
			} else if (this.lastNameActive && this.lastName) {
				await this.searchByLastNameInternal();
			} else if (this.idNumber) {
				await this.searchByIdOrPhone("id");
			} else if (this.phoneNumber) {
				await this.searchByIdOrPhone("phone");
			} else if (this.lastName) {
				await this.searchByLastNameInternal();
			} else {
				alert("אנא הכנס ערך לחיפוש באחד השדות.");
			}
		},
		async searchByIdOrPhone(type) {
			try {
				const searchField = type === "id" ? { id: this.idNumber } : { phone: this.phoneNumber };
				const ext = type === "id" ? "id" : "phone";
				const response = await fetch(buildApiUrl(`/search${ext}`), {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(searchField),
				});
				const data = await response.json();
				this.result = data.success ? data.customer : null;
				if (!this.result) {
					alert("לא נמצאו תוצאות לחיפוש.");
				}
			} catch (error) {
				console.error(`Error fetching data by ${type}:`, error);
				alert("שגיאה בחיפוש, אנא נסה שוב.");
			}
		},
		async searchByLastNameInternal() {
			if (!this.lastName.trim()) {
				this.lastNameSearchError = "אנא הכנס שם משפחה לחיפוש.";
				this.lastNameResults = [];
				return;
			}

			try {
				const response = await fetch(buildApiUrl("/searchlastname"), {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ lastName: this.lastName }),
				});
				const data = await response.json();
				if (response.ok && data.success) {
					this.lastNameResults = data.customers;
					if (data.customers.length === 0) {
						this.lastNameSearchError = "לא נמצאו לקוחות עם שם משפחה זה.";
					}
				} else if (response.status === 404) {
					this.lastNameResults = [];
					this.lastNameSearchError =
						data.message || "לא נמצאו לקוחות התואמים לשם המשפחה שהוזן.";
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
			this.lastNameResults = [];
			this.lastNameSearchError = null;
			this.result = null;
		},
		copyMotherId(motherId) {
			this.copyFatherId(motherId);
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
			this.copyFatherPhone(motherPhone);
		},
		toggleLastNameResults() {
			this.lastNameResultsVisible = !this.lastNameResultsVisible;
		},
		openJuicePopup() {
			if (this.juicePopupIntervalId) {
				clearInterval(this.juicePopupIntervalId);
			}
			if (this.juicePopupTimeoutId) {
				clearTimeout(this.juicePopupTimeoutId);
			}
			this.juiceSecondsLeft = 6;
			this.showJuicePopup = true;
			this.juicePopupIntervalId = setInterval(() => {
				if (this.juiceSecondsLeft > 0) {
					this.juiceSecondsLeft -= 1;
				}
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
			try {
				const token = await this.ensureUsersToken();
				const response = await fetch(buildApiUrl("/mark"), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...authHeaders(token),
					},
					body: JSON.stringify({
						id: this.result.id,
						volunteer_name: this.volunteerName,
					}),
				});
				const res = await readJsonResponse(response);

				const unmarried = parseInt(this.result?.unmarried_children, 10);
				if (!Number.isNaN(unmarried) && unmarried >= 7) {
					this.openJuicePopup();
				}

				this.totalTaken = res.totalTaken;
				this.lastReceived = this.result;
				this.percentageTaken = res.percentageTaken;
				this.totalCustomers = res.totalCustomers;
				this.resetSearch();
			} catch (error) {
				if (error.status === 401 || error.status === 403) {
					clearStoredToken("users");
				}
				alert(error.message);
			}
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
			this.showUpdateForm = false;
			this.$nextTick(() => {
				if (this.$refs.idInput && typeof this.$refs.idInput.focus === "function") {
					this.$refs.idInput.focus();
				}
			});
		},
		formatTime(dateString) {
			const date = new Date(dateString);
			return date.toLocaleTimeString("he-IL", {
				hour: "2-digit",
				minute: "2-digit",
			});
		},
		formatValue(value) {
			if (value === "NaN" || value === "nan") {
				return "";
			}
			return value;
		},
		openUpdateForm() {
			this.showUpdateForm = true;
			const allowedFields = [
				"last_name",
				"father_first_name",
				"father_id",
				"mother_first_name",
				"mother_id",
				"father_phone",
				"mother_phone",
				"additional_phone",
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
				const token = await this.ensureUsersToken();
				const updatedData = { ...this.result, ...this.editableFields };
				Object.keys(updatedData).forEach((key) => {
					updatedData[key] = this.formatValue(updatedData[key]);
				});
				const response = await fetch(buildApiUrl("/update"), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...authHeaders(token),
					},
					body: JSON.stringify(updatedData),
				});
				const data = await readJsonResponse(response);
				alert("הנתונים עודכנו בהצלחה.");
				this.result = data.customer;
				this.closeUpdateForm();
			} catch (error) {
				if (error.status === 401 || error.status === 403) {
					clearStoredToken("users");
				}
				alert(error.message);
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
};
</script>

<style>
body {
	background-color: #f0f4f8;
	font-family: Arial, sans-serif;
	margin: 0;
	padding: 0;
	-webkit-text-size-adjust: 100%;
	text-size-adjust: 100%;
}

.container {
	direction: rtl;
	max-width: 1500px;
	margin: 70px auto 20px;
	text-align: center;
	padding: 20px;
	border: 1px solid #ccc;
	border-radius: 8px;
	background-color: #ffffff;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	box-sizing: border-box;
}

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

.layout-grid .admin-panel,
.layout-grid .stats-box,
.layout-grid .container,
.layout-grid .add-customer {
	width: 100%;
}

.layout-grid > .add-customer {
	grid-column: 1 / -1;
}

@media (max-width: 1200px) {
	.layout-grid {
		grid-template-columns: 260px 1fr;
	}

	.layout-grid > .admin-panel {
		grid-column: 1 / -1;
	}
}

@media (max-width: 900px) {
	.layout-grid {
		grid-template-columns: 1fr;
	}

	.layout-grid > .admin-panel,
	.layout-grid > .stats-box,
	.layout-grid > .container {
		grid-column: 1 / -1;
	}
}

@media (max-width: 1200px) {
	.container {
		max-width: 95%;
		margin: 70px auto 15px;
	}

	.update-form {
		grid-template-columns: repeat(2, 1fr);
	}

	.result-list {
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	}
}

@media (max-width: 767px) {
	.container {
		max-width: 100%;
		margin: 20px auto 10px;
		padding: 10px;
		box-shadow: none;
		border: none;
		border-radius: 0;
	}

	.stats-box,
	.add-customer,
	.result-box,
	.update-form,
	.admin-panel {
		position: static;
		margin: 10px 0;
		width: 100%;
		box-sizing: border-box;
	}

	.result-list {
		grid-template-columns: 1fr;
	}

	button,
	.copy-button,
	.toggle-results-button,
	.mark-button,
	.update-button,
	.cancel-button,
	.back-button {
		width: calc(100% - 20px);
		margin: 10px auto;
		padding: 12px 15px;
		font-size: 1em;
		box-sizing: border-box;
	}

	.search-group {
		width: 100%;
		margin: 10px 0;
		box-sizing: border-box;
	}

	.search-group input {
		width: calc(100% - 20px);
		margin: 0 auto;
		padding: 12px;
		font-size: 1em;
		box-sizing: border-box;
	}

	.last-name-result-item {
		flex-direction: column;
		align-items: stretch;
	}

	.last-name-result-item .customer-info,
	.last-name-result-item .action-buttons {
		width: 100%;
		text-align: center;
		margin-right: 0;
	}

	.last-name-result-item .action-buttons {
		justify-content: center;
		margin-top: 10px;
	}
}

.container.search-active {
	max-width: 500px;
	transition: max-width 0.3s ease;
}

.container.results-active {
	max-width: 1500px;
	transition: max-width 0.3s ease;
}

@media (max-width: 1200px) {
	.container.results-active {
		max-width: 95%;
	}
}

@media (max-width: 767px) {
	.container.search-active,
	.container.results-active {
		max-width: 100%;
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
	margin-left: auto;
	margin-right: auto;
	box-sizing: border-box;
}

@media (max-width: 1200px) {
	.result-box {
		max-width: 100%;
	}
}

.result-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 15px;
}

.mark-button {
	padding: 10px 20px;
	background-color: #28a745;
	font-size: 14px;
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
	font-size: 14px;
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
	gap: 20px;
	box-sizing: border-box;
}

.update-group {
	display: flex;
	flex-direction: column;
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
	font-size: 14px;
}

.cancel-button:hover {
	background-color: #c82333;
}

.result-list {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
	text-align: center;
	padding: 10px;
	box-sizing: border-box;
}

.last-name-result-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10px;
	border-bottom: 1px solid #ddd;
	flex-wrap: wrap;
}

.last-name-result-item .customer-info {
	flex-grow: 1;
	margin-right: 10px;
	text-align: right;
	min-width: 200px;
	word-break: break-word;
}

.last-name-result-item .action-buttons {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: flex-start;
	margin-top: 5px;
}

.last-name-result-item:last-child {
	border-bottom: none;
}

.copy-button {
	padding: 6px 12px;
	background-color: #17a2b8;
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
	margin-top: 10px;
}

.toggle-results-button {
	margin-bottom: 10px;
	padding: 8px 15px;
	background-color: #6c757d;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 14px;
}

.toggle-results-button:hover {
	background-color: #5a6268;
}

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
