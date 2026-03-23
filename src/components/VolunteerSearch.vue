<template>
	<div class="search-experience">
		<VolunteerNameInput
			:value="volunteerName"
			@update-volunteer-name="volunteerName = $event"
		/>

		<div class="layout-grid">
			<div class="layout-sidebar layout-sidebar--left">
				<StatsBox
					:total-taken="totalTaken"
					:percentage-taken="percentageTaken"
					:total-customers="totalCustomers"
				/>
				<LastReceived :last-received="lastReceived" />
			</div>

			<div
				:class="[
					'container',
					result || lastNameResults.length > 0 ? 'results-active' : 'search-active',
				]"
			>
				<div class="container-intro">
					<p class="eyebrow">חיפוש, עדכון וחלוקה</p>
					<h1>מערכת חלוקות קופת צפת</h1>
					<p class="container-copy">
						חיפוש מהיר לפי מספר זהות, טלפון או שם משפחה, עם גישה מיידית
						לעדכון נתונים ורישום לקוח חדש.
					</p>
				</div>

				<div v-if="result || lastNameResults.length > 0" class="result-toolbar">
					<button @click="resetSearch" class="back-button">חזרה לחיפוש</button>
				</div>

				<div v-if="!result && lastNameResults.length === 0" class="search-panel">
					<div class="search-fields">
						<div class="search-group">
							<label for="idNumber">חיפוש לפי מספר זהות</label>
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
							<label for="phoneNumber">חיפוש לפי מספר טלפון</label>
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
							<label for="lastName">חיפוש לפי שם משפחה</label>
							<input
								id="lastName"
								v-model="lastName"
								type="text"
								:disabled="idActive || phoneActive"
								@input="disableOther('lastName')"
								@keydown.enter="performSearch"
							/>
						</div>
					</div>
					<div class="search-actions">
						<button
							@click="performSearch"
							:disabled="!idNumber && !phoneNumber && !lastName"
						>
							חפש
						</button>
					</div>
				</div>

				<div v-if="result" class="result-box">
					<div v-if="!showUpdateForm">
						<div class="result-header">
							<div class="result-header-copy">
								<h2>תוצאות חיפוש</h2>
								<p>פרטי המשפחה כפי שהם שמורים במערכת הפעילה.</p>
								<p v-if="result.received" class="received-message">הלקוח כבר קיבל</p>
							</div>
							<div class="result-header-actions">
								<button
									v-if="!result.received"
									@click="markReceived"
									:disabled="resultTimeWindowDecision.isBlocked"
									:class="[
										'mark-button',
										{ 'mark-button--disabled': resultTimeWindowDecision.isBlocked },
									]"
								>
									{{
										resultTimeWindowDecision.isBlocked
											? "חלון הזמן לא פעיל"
											: "סמן כקיבל"
									}}
								</button>
								<button
									v-if="!result.received && resultTimeWindowDecision.isBlocked"
									@click="approveTimeWindowOverride"
									class="admin-override-button"
								>
									אישור מנהל וסימון בכל זאת
								</button>
								<button @click="openUpdateForm" class="update-button">
									עדכן נתונים
								</button>
							</div>
						</div>
						<div
							v-if="!result.received && resultTimeWindowDecision.isBlocked"
							class="time-window-warning"
						>
							<p class="time-window-warning-title">
								חלון הזמן של המשפחה עדיין לא פעיל
							</p>
							<p>{{ resultTimeWindowDecision.blockedMessage }}</p>
						</div>
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
							<li
								v-if="!result.received && resultTimeWindowDecision.primaryWindow"
							>
								<strong>חלון זמן:</strong>
								{{ formatTimeWindowLabel(resultTimeWindowDecision.primaryWindow) }}
							</li>
							<li
								v-if="!result.received && resultTimeWindowDecision.primaryWindow"
							>
								<strong>שעת יעד:</strong>
								{{ formatTimeWindowSchedule(resultTimeWindowDecision.primaryWindow) }}
							</li>
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
						<div class="update-form-heading">
							<h3>עדכון נתונים</h3>
							<p>אפשר לשנות את השדות הרלוונטיים ולשמור את הנתונים המעודכנים.</p>
						</div>
						<div class="update-grid">
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
						</div>
						<div class="update-actions">
							<button @click="updateCustomer">עדכן</button>
							<button @click="closeUpdateForm" class="cancel-button">ביטול</button>
						</div>
					</div>
				</div>

				<div
					v-if="(lastNameResults.length > 0 || lastNameSearchError) && !result"
					class="result-box last-name-results"
				>
					<div class="result-header result-header--stacked">
						<div class="result-header-copy">
							<h2 v-if="lastNameResults.length > 0">
								תוצאות חיפוש לפי שם משפחה: {{ lastName }}
							</h2>
							<p v-if="lastNameResults.length > 0">
								אפשר לבחור תעודת זהות או טלפון מתוך הרשימה ולהמשיך ישר לחיפוש.
							</p>
						</div>
						<button
							v-if="lastNameResults.length > 0"
							@click="toggleLastNameResults"
							class="toggle-results-button"
						>
							{{ lastNameResultsVisible ? "הסתר תוצאות" : "הצג תוצאות" }}
						</button>
					</div>
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

			<div class="layout-sidebar layout-sidebar--right">
				<AdminPanel />
				<button
					type="button"
					class="scan-shortcut scan-shortcut--desktop"
					@click="$router.push('/scan-id')"
				>
					<span>מסך צילום תעודה</span>
					<small>צילום, פענוח וסימון קבלה</small>
				</button>
			</div>

			<div class="add-customer">
				<RegisterCustomer :volunteer_name="volunteerName" />
			</div>
		</div>

		<div v-if="showJuicePopup" class="popup-overlay" @click.self="closeJuicePopup">
			<div class="popup-content" role="dialog" aria-modal="true" aria-labelledby="juice-title">
				<button class="popup-close" @click="closeJuicePopup" aria-label="סגור">×</button>
				<h3 id="juice-title">{{ juicePopupTitle }}</h3>
				<p>{{ juicePopupMessage }}</p>
				<p class="popup-countdown">החלונית תיסגר אוטומטית בעוד {{ juiceSecondsLeft }} שניות.</p>
			</div>
		</div>

		<div
			v-if="showTimeWindowPopup && result && resultTimeWindowDecision.isBlocked"
			class="popup-overlay"
			@click.self="closeTimeWindowPopup"
		>
			<div
				class="popup-content popup-content--warning"
				role="dialog"
				aria-modal="true"
				aria-labelledby="time-window-title"
			>
				<button class="popup-close" @click="closeTimeWindowPopup" aria-label="סגור">
					×
				</button>
				<h3 id="time-window-title">חלון הזמן עדיין לא פעיל</h3>
				<p>{{ resultTimeWindowDecision.blockedMessage }}</p>
				<p v-if="resultTimeWindowDecision.primaryBlockedWindow">
					<strong>חלון זמן:</strong>
					{{ formatTimeWindowLabel(resultTimeWindowDecision.primaryBlockedWindow) }}
				</p>
				<p v-if="resultTimeWindowDecision.primaryBlockedWindow">
					<strong>שעה מיועדת:</strong>
					{{ formatTimeWindowSchedule(resultTimeWindowDecision.primaryBlockedWindow) }}
				</p>
				<div class="update-actions">
					<button class="admin-override-button" @click="approveTimeWindowOverride">
						אישור מנהל וסימון בכל זאת
					</button>
					<button class="cancel-button" @click="closeTimeWindowPopup">סגור</button>
				</div>
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
	getStoredVolunteerName,
	loginWithRole,
	setStoredVolunteerName,
} from "../utils/api";
import {
	buildJuicePopupContent,
	evaluateCustomerTimeWindows,
	fetchDistributionSettingsFromServer,
	formatTimeWindowLabel,
	formatTimeWindowSchedule,
	getStoredJuicePopupSettings,
	getStoredTimeWindowsSettings,
	shouldShowJuicePopup,
} from "../utils/timeWindows";

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
			juicePopupSettings: getStoredJuicePopupSettings(),
			juicePopupTitle: "",
			juicePopupMessage: "",
			showJuicePopup: false,
			juiceSecondsLeft: 6,
			juicePopupIntervalId: null,
			juicePopupTimeoutId: null,
			timeWindowRefreshIntervalId: null,
			statsIntervalId: null,
			timeWindowSettings: getStoredTimeWindowsSettings(),
			showTimeWindowPopup: false,
		};
	},
	computed: {
		resultTimeWindowDecision() {
			return evaluateCustomerTimeWindows(this.result, this.timeWindowSettings);
		},
	},
	watch: {
		volunteerName(newValue) {
			setStoredVolunteerName(newValue);
		},
	},
	mounted() {
		this.volunteerName = getStoredVolunteerName();
		this.loadSharedSettings();
		this.updateTaken();
		this.statsIntervalId = window.setInterval(this.updateTaken, 60000);
		this.timeWindowRefreshIntervalId = window.setInterval(() => {
			this.syncSharedSettingsSilently();
		}, 30000);
	},
	beforeUnmount() {
		if (this.statsIntervalId) {
			clearInterval(this.statsIntervalId);
		}
		if (this.timeWindowRefreshIntervalId) {
			clearInterval(this.timeWindowRefreshIntervalId);
		}
		if (this.juicePopupIntervalId) {
			clearInterval(this.juicePopupIntervalId);
		}
		if (this.juicePopupTimeoutId) {
			clearTimeout(this.juicePopupTimeoutId);
		}
	},
	methods: {
		formatTimeWindowLabel,
		formatTimeWindowSchedule,
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
		async loadSharedSettings() {
			const sharedSettings = await fetchDistributionSettingsFromServer();
			this.timeWindowSettings = sharedSettings.timeWindowsSettings;
			this.juicePopupSettings = sharedSettings.juicePopupSettings;
		},
		async syncSharedSettingsSilently() {
			await this.loadSharedSettings();
			if (this.result) {
				this.openTimeWindowPopupForCurrentResult();
			}
		},
		openTimeWindowPopupForCurrentResult() {
			this.showTimeWindowPopup =
				Boolean(this.result) &&
				!this.result.received &&
				this.resultTimeWindowDecision.isBlocked;
		},
		closeTimeWindowPopup() {
			this.showTimeWindowPopup = false;
		},
		async requestAdminTimeWindowApproval() {
			const password = window.prompt(
				"נדרשת סיסמת מנהל כדי לאשר חריגה מחלון הזמן:"
			);
			if (!password) {
				throw new Error("האישור בוטל.");
			}

			await loginWithRole("admin", password);
		},
		async updateTaken() {
			try {
				const response = await fetch(buildApiUrl("/updateTaken"));
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
			this.closeTimeWindowPopup();

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
					this.closeTimeWindowPopup();
					return;
				}

				await this.loadSharedSettings();
				this.openTimeWindowPopupForCurrentResult();
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
			this.closeTimeWindowPopup();
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
			this.closeTimeWindowPopup();
		},
		copyMotherPhone(motherPhone) {
			this.copyFatherPhone(motherPhone);
		},
		toggleLastNameResults() {
			this.lastNameResultsVisible = !this.lastNameResultsVisible;
		},
		openJuicePopup(content = {}) {
			if (this.juicePopupIntervalId) {
				clearInterval(this.juicePopupIntervalId);
			}
			if (this.juicePopupTimeoutId) {
				clearTimeout(this.juicePopupTimeoutId);
			}
			this.juiceSecondsLeft = 6;
			this.juicePopupTitle = content.title || "הודעה";
			this.juicePopupMessage = content.message || "";
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
		async performMarkReceived(options = {}) {
			if (!this.result) {
				return;
			}

			await this.loadSharedSettings();
			const decision = evaluateCustomerTimeWindows(
				this.result,
				this.timeWindowSettings
			);
			if (!options.bypassTimeWindow && decision.isBlocked) {
				this.showTimeWindowPopup = true;
				return;
			}

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

				if (shouldShowJuicePopup(this.result, this.juicePopupSettings)) {
					this.openJuicePopup(
						buildJuicePopupContent(this.result, this.juicePopupSettings)
					);
				}

				this.closeTimeWindowPopup();
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
		async markReceived() {
			await this.performMarkReceived();
		},
		async approveTimeWindowOverride() {
			try {
				await this.requestAdminTimeWindowApproval();
				await this.performMarkReceived({ bypassTimeWindow: true });
			} catch (error) {
				if (error.message !== "האישור בוטל.") {
					alert("סיסמת המנהל שגויה או שהשרת לא זמין.");
				}
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
			this.closeTimeWindowPopup();
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
				await this.loadSharedSettings();
				this.openTimeWindowPopupForCurrentResult();
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
.search-experience {
	padding: 0 16px 12px;
}

.layout-grid {
	display: grid;
	grid-template-columns: minmax(250px, 280px) minmax(0, 1fr) minmax(250px, 280px);
	gap: 20px;
	align-items: start;
	max-width: 1500px;
	margin: 0 auto;
}

.layout-sidebar {
	display: grid;
	gap: 18px;
}

.scan-shortcut {
	display: none;
	flex-direction: column;
	align-items: flex-start;
	gap: 2px;
	width: 100%;
	padding: 16px 18px;
	border: 1px solid var(--color-border-strong);
	border-radius: var(--radius-lg);
	background: var(--color-surface);
	color: var(--color-primary);
	box-shadow: var(--shadow-soft);
	backdrop-filter: blur(16px);
	text-align: right;
}

.scan-shortcut:hover {
	background: var(--color-primary);
	color: #fffaf1;
}

.scan-shortcut small {
	font-size: 12px;
	font-weight: 600;
	opacity: 0.72;
}

@media (min-width: 1281px) {
	.scan-shortcut--desktop {
		display: inline-flex;
	}
}

.container {
	direction: rtl;
	padding: 28px;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	background:
		linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 249, 241, 0.88));
	box-shadow: var(--shadow-medium);
	backdrop-filter: blur(20px);
	text-align: right;
}

.container-intro {
	display: grid;
	gap: 10px;
}

.eyebrow {
	margin: 0;
	font-size: 12px;
	font-weight: 800;
	letter-spacing: 0.14em;
	color: var(--color-accent);
}

.container h1 {
	margin: 0;
	font-size: clamp(2rem, 4vw, 3.2rem);
	line-height: 1.05;
	color: var(--color-primary);
}

.container-copy {
	margin: 0;
	max-width: 760px;
	font-size: 16px;
	line-height: 1.8;
	color: var(--color-text-muted);
}

.result-toolbar,
.search-actions,
.update-actions {
	display: flex;
	justify-content: flex-start;
	gap: 10px;
	flex-wrap: wrap;
}

.result-toolbar {
	margin-top: 20px;
}

.search-panel {
	margin-top: 24px;
	display: grid;
	gap: 18px;
}

.search-fields {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16px;
}

.search-group,
.update-group {
	display: grid;
	gap: 8px;
}

.search-group label,
.update-group label {
	font-weight: 800;
	color: var(--color-primary);
}

.search-group input,
.update-group input {
	padding: 14px 16px;
	width: 100%;
}

button {
	padding: 14px 20px;
	border: 1px solid rgba(255, 255, 255, 0.16);
	border-radius: var(--radius-pill);
	background: linear-gradient(135deg, var(--color-primary), #21493f);
	color: #fffaf1;
	cursor: pointer;
	font-size: 15px;
	font-weight: 800;
}

button:disabled {
	opacity: 0.55;
	cursor: not-allowed;
}

.back-button,
.toggle-results-button,
.cancel-button {
	background: rgba(255, 255, 255, 0.7);
	color: var(--color-primary);
	border: 1px solid var(--color-border-strong);
}

.mark-button {
	background: linear-gradient(135deg, var(--color-success), #47a16f);
}

.mark-button--disabled {
	background: rgba(182, 79, 71, 0.24);
	color: #7a2418;
	border-color: rgba(182, 79, 71, 0.18);
}

.update-button {
	background: linear-gradient(135deg, var(--color-accent), #9f4f2b);
}

.admin-override-button {
	background: linear-gradient(135deg, #b15b35, #8a3c1a);
}

.copy-button {
	padding: 10px 14px;
	background: rgba(24, 53, 46, 0.08);
	color: var(--color-primary);
	border: 1px solid rgba(24, 53, 46, 0.14);
	font-size: 13px;
	margin-top: 0;
}

.result-box {
	margin-top: 24px;
	padding: 24px;
	border: 1px solid rgba(24, 53, 46, 0.1);
	background: rgba(255, 254, 251, 0.74);
	border-radius: 24px;
	box-sizing: border-box;
}

.result-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 16px;
	margin-bottom: 18px;
}

.result-header--stacked {
	margin-bottom: 12px;
}

.result-header-copy {
	display: grid;
	gap: 6px;
}

.result-header-copy h2 {
	margin: 0;
	font-size: 28px;
	color: var(--color-primary);
}

.result-header-copy p {
	margin: 0;
	color: var(--color-text-muted);
	line-height: 1.7;
}

.result-header-actions {
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
}

.time-window-warning {
	margin-bottom: 18px;
	padding: 16px 18px;
	border-radius: 18px;
	background: rgba(182, 79, 71, 0.14);
	border: 1px solid rgba(182, 79, 71, 0.18);
	display: grid;
	gap: 8px;
}

.time-window-warning-title {
	margin: 0;
	font-weight: 800;
	color: #7a2418;
}

.time-window-warning p:last-child {
	margin: 0;
	line-height: 1.7;
	color: #7a2418;
}

.received-message {
	font-size: 14px;
	color: var(--color-danger);
	font-weight: 800;
}

.result-list {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 12px;
	list-style: none;
	padding: 0;
	margin: 0;
}

.result-list li {
	display: grid;
	gap: 6px;
	padding: 14px 16px;
	border-radius: 18px;
	background: rgba(255, 255, 255, 0.7);
	border: 1px solid rgba(24, 53, 46, 0.08);
	font-weight: 600;
	color: var(--color-text);
}

.result-list li strong {
	color: var(--color-primary);
	font-size: 13px;
}

.update-form {
	display: grid;
	gap: 18px;
}

.update-form-heading h3 {
	margin: 0 0 6px;
	font-size: 28px;
	color: var(--color-primary);
}

.update-form-heading p {
	margin: 0;
	color: var(--color-text-muted);
	line-height: 1.7;
}

.update-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 14px;
}

.last-name-results .result-list {
	grid-template-columns: 1fr;
}

.last-name-result-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 14px;
	padding: 16px 18px;
	border-radius: 18px;
	background: rgba(255, 255, 255, 0.7);
	border: 1px solid rgba(24, 53, 46, 0.08);
	flex-wrap: wrap;
}

.last-name-result-item .customer-info {
	flex: 1 1 260px;
	text-align: right;
	word-break: break-word;
	line-height: 1.7;
}

.last-name-result-item .action-buttons {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: flex-start;
}

.add-customer {
	grid-column: 1 / -1;
}

.error-message {
	color: var(--color-danger);
	margin-top: 10px;
	font-weight: 700;
}

.popup-overlay {
	position: fixed;
	inset: 0;
	background: rgba(16, 27, 23, 0.54);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 3000;
	padding: 18px;
}

.popup-content {
	background:
		linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 246, 235, 0.94));
	border-radius: 26px;
	padding: 26px 26px 22px;
	width: min(100%, 440px);
	box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24);
	direction: rtl;
	text-align: right;
	position: relative;
	border: 1px solid rgba(24, 53, 46, 0.12);
}

.popup-content--warning {
	border-color: rgba(182, 79, 71, 0.22);
}

.popup-content h3 {
	margin: 0 0 10px;
	font-size: 28px;
	color: var(--color-primary);
}

.popup-content p {
	margin: 6px 0;
	font-size: 16px;
	color: var(--color-text);
	line-height: 1.7;
}

.popup-countdown {
	color: var(--color-text-muted);
	font-size: 14px;
}

.popup-close {
	position: absolute;
	top: 10px;
	left: 10px;
	background: transparent;
	border: none;
	font-size: 24px;
	line-height: 1;
	cursor: pointer;
	color: var(--color-primary);
	padding: 6px 8px;
	box-shadow: none;
}

.popup-close:hover {
	color: var(--color-accent);
}

@media (max-width: 1280px) {
	.layout-grid {
		grid-template-columns: minmax(0, 1fr) 280px;
	}

	.layout-sidebar--left {
		grid-column: 2;
		grid-row: 1;
	}

	.layout-sidebar--right {
		grid-column: 2;
		grid-row: 2;
	}

	.container {
		grid-column: 1;
		grid-row: 1 / span 2;
	}
}

@media (max-width: 980px) {
	.layout-grid {
		grid-template-columns: 1fr;
	}

	.layout-sidebar--left,
	.layout-sidebar--right,
	.container,
	.add-customer {
		grid-column: auto;
		grid-row: auto;
	}

	.container {
		padding: 24px 20px;
	}

	.search-fields,
	.update-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.result-header {
		flex-direction: column;
	}
}

@media (max-width: 680px) {
	.search-experience {
		padding: 0 10px 10px;
	}

	.container {
		padding: 20px 16px;
	}

	.search-fields,
	.update-grid,
	.result-list {
		grid-template-columns: 1fr;
	}

	.result-header-actions,
	.search-actions,
	.update-actions,
	.last-name-result-item .action-buttons {
		flex-direction: column;
	}

	button,
	.copy-button {
		width: 100%;
	}

	.result-header-copy h2,
	.update-form-heading h3,
	.popup-content h3 {
		font-size: 24px;
	}
}
</style>
