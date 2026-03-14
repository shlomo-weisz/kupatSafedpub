<template>
	<div class="register-shell">
		<button
			@click="toggleForm"
			:class="showForm ? 'close-form-button' : 'open-form-button'"
			class="register-toggle"
		>
			{{ showForm ? "סגור טופס" : "רישום לקוח חדש" }}
		</button>

		<div v-if="showForm" class="form-container">
			<div v-if="!isRegisterAuthenticated" class="register-auth-card">
				<p class="section-eyebrow">גישה מאובטחת</p>
				<h2>אימות רישום</h2>
				<p class="section-copy">
					לפני רישום לקוח חדש יש להזין את סיסמת הרישום.
				</p>
				<div class="form-group">
					<label for="registerPassword">סיסמת רישום</label>
					<input
						id="registerPassword"
						v-model="registerPassword"
						type="password"
						autocomplete="current-password"
						@keydown.enter="authenticateRegisterRole"
					/>
				</div>
				<p v-if="registerError" class="error-message">{{ registerError }}</p>
				<button @click="authenticateRegisterRole" class="submit-button">
					אמת סיסמה
				</button>
			</div>

			<div v-else class="register-content">
				<div class="register-header">
					<p class="section-eyebrow">רישום קופה</p>
					<h2>רישום לקוח חדש</h2>
					<p class="section-copy">
						מלאו את הפרטים הנדרשים, בחרו האם מדובר בלקיחה מיידית או ברשימת
						המתנה, ושלחו את הרשומה למערכת.
					</p>
				</div>
				<div class="form-group preference-row">
					<div class="radio-group-container">
						<div class="radio-buttons">
							<label>
								<input
									v-model="customer.status"
									type="radio"
									value="לוקח עכשיו"
								/>
								לוקח עכשיו
							</label>
							<label>
								<input
									v-model="customer.status"
									type="radio"
									value="לרשימת המתנה"
								/>
								לרשימת המתנה
							</label>
						</div>
						<div class="checkbox-container">
							<label>
								<input
									v-model="customer.registerForDistribution"
									type="checkbox"
								/>
								רישום למאגר החלוקות של הקופה
							</label>
						</div>
					</div>
				</div>

				<form class="register-form" @submit.prevent="registerCustomer">
					<section class="form-section">
						<div class="form-group">
							<label for="lastName">שם משפחה</label>
							<input id="lastName" v-model="customer.lastName" type="text" required />
						</div>
					</section>

					<section class="form-section">
						<div class="section-title-row">
							<h3>פרטי ההורים</h3>
						</div>
						<div class="form-columns">
							<div class="form-column">
							<h3>פרטי האב</h3>
							<div class="form-group">
								<label for="fatherName">שם האב</label>
								<input id="fatherName" v-model="customer.fatherName" type="text" />
							</div>
							<div class="form-group">
								<label for="fatherId">מספר זהות של האב</label>
								<input
									id="fatherId"
									v-model="customer.fatherId"
									type="text"
									required
								/>
							</div>
							<div class="form-group">
								<label for="fatherPhone">מספר טלפון של האב</label>
								<input id="fatherPhone" v-model="customer.fatherPhone" type="text" />
							</div>
							</div>

							<div class="form-column">
								<h3>פרטי האם</h3>
								<div class="form-group">
									<label for="motherName">שם האם</label>
									<input id="motherName" v-model="customer.motherName" type="text" />
								</div>
								<div class="form-group">
									<label for="motherId">מספר זהות של האם</label>
									<input id="motherId" v-model="customer.motherId" type="text" />
								</div>
								<div class="form-group">
									<label for="motherPhone">מספר טלפון של האם</label>
									<input id="motherPhone" v-model="customer.motherPhone" type="text" />
								</div>
							</div>
						</div>
					</section>

					<section class="form-section">
						<div class="form-group">
							<label for="additionalPhone">טלפון נוסף</label>
							<input
								id="additionalPhone"
								v-model="customer.additionalPhone"
								type="text"
							/>
						</div>
					</section>

					<section class="form-section">
						<div class="section-title-row">
							<h3>כתובת</h3>
						</div>
						<div class="form-columns address-row">
							<div class="form-group">
								<label for="city">עיר</label>
								<input id="city" v-model="customer.address.city" type="text" />
							</div>
							<div class="form-group">
								<label for="street">רחוב</label>
								<input id="street" v-model="customer.address.street" type="text" />
							</div>
							<div class="form-group">
								<label for="houseNumber">מספר בית</label>
								<input
									id="houseNumber"
									v-model="customer.address.houseNumber"
									type="text"
								/>
							</div>
							<div class="form-group">
								<label for="apartment">מספר דירה</label>
								<input
									id="apartment"
									v-model="customer.address.apartment"
									type="text"
								/>
							</div>
							<div class="form-group">
								<label for="entrance">כניסה</label>
								<input
									id="entrance"
									v-model="customer.address.entrance"
									type="text"
								/>
							</div>
							<div class="form-group">
								<label for="floor">קומה</label>
								<input id="floor" v-model="customer.address.floor" type="text" />
							</div>
						</div>
					</section>

					<section class="form-section">
						<div class="section-title-row">
							<h3>מספר ילדים</h3>
						</div>
						<div class="form-columns">
							<div class="form-column">
								<div class="form-group">
									<label for="marriedChildren">מספר ילדים נשואים</label>
									<input
										id="marriedChildren"
										v-model.number="customer.marriedChildren"
										type="number"
										min="0"
									/>
								</div>
							</div>
							<div class="form-column">
								<div class="form-group">
									<label for="unmarriedChildren">מספר ילדים שאינם נשואים</label>
									<input
										id="unmarriedChildren"
										v-model.number="customer.unmarriedChildren"
										type="number"
										min="0"
									/>
								</div>
							</div>
						</div>
					</section>

					<div class="form-actions">
						<button type="submit" class="submit-button">שלח</button>
						<button type="button" @click="closeForm" class="cancel-button">
							ביטול
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</template>

<script>
import {
	authHeaders,
	buildApiUrl,
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

function buildInitialCustomer(volunteerName) {
	return {
		status: "לוקח עכשיו",
		registerForDistribution: false,
		volunteer_name: volunteerName,
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
}

export default {
	props: {
		volunteer_name: {
			type: String,
			required: true,
		},
	},
	data() {
		return {
			showForm: false,
			isRegisterAuthenticated: false,
			registerPassword: "",
			registerError: "",
			customer: buildInitialCustomer(this.volunteer_name),
		};
	},
	watch: {
		volunteer_name(newValue) {
			this.customer.volunteer_name = newValue;
		},
	},
	methods: {
		toggleForm() {
			if (this.showForm) {
				this.closeForm();
			} else {
				this.openForm();
			}
		},
		openForm() {
			this.showForm = true;
			this.isRegisterAuthenticated = Boolean(getStoredToken("register"));
		},
		closeForm() {
			this.showForm = false;
			this.resetForm();
		},
		resetForm() {
			this.registerPassword = "";
			this.registerError = "";
			this.isRegisterAuthenticated = Boolean(getStoredToken("register"));
			this.customer = buildInitialCustomer(this.volunteer_name);
		},
		async authenticateRegisterRole() {
			try {
				await loginWithRole("register", this.registerPassword);
				this.registerPassword = "";
				this.registerError = "";
				this.isRegisterAuthenticated = true;
			} catch (error) {
				this.registerError = "סיסמת הרישום שגויה או שהשרת לא זמין.";
			}
		},
		async registerCustomer() {
			try {
				const token = getStoredToken("register");
				if (!token) {
					throw new Error("נדרשת התחברות רישום לפני שליחת הטופס.");
				}

				this.customer.volunteer_name = this.volunteer_name;
				const response = await fetch(buildApiUrl("/register"), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...authHeaders(token),
					},
					body: JSON.stringify(this.customer),
				});
				const data = await readJsonResponse(response);
				alert(data.message || "הלקוח נרשם בהצלחה!");
				this.closeForm();
			} catch (error) {
				if (error.status === 401 || error.status === 403) {
					this.isRegisterAuthenticated = false;
				}
				alert(error.message);
			}
		},
	},
};
</script>

<style>
.register-shell {
	display: grid;
	gap: 18px;
}

.register-toggle {
	width: 100%;
}

.open-form-button {
	padding: 16px 22px;
	background: linear-gradient(135deg, var(--color-primary), #21493f);
	color: #fffaf1;
	border: 1px solid rgba(255, 255, 255, 0.16);
	border-radius: var(--radius-pill);
	cursor: pointer;
	font-size: 16px;
	font-weight: 800;
}

.open-form-button:hover {
	background: linear-gradient(135deg, var(--color-primary-hover), #17342d);
}

.close-form-button {
	padding: 16px 22px;
	background: rgba(255, 255, 255, 0.74);
	color: var(--color-primary);
	border: 1px solid var(--color-border-strong);
	border-radius: var(--radius-pill);
	cursor: pointer;
	font-size: 16px;
	font-weight: 800;
}

.close-form-button:hover {
	background: rgba(24, 53, 46, 0.1);
}

.form-container {
	direction: rtl;
	background:
		linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 249, 241, 0.9));
	padding: 24px;
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-soft);
	border: 1px solid var(--color-border);
	width: 100%;
	backdrop-filter: blur(18px);
}

.register-auth-card,
.register-content,
.register-form {
	display: grid;
	gap: 18px;
}

.register-header {
	display: grid;
	gap: 10px;
}

.section-eyebrow {
	margin: 0;
	font-size: 12px;
	font-weight: 800;
	letter-spacing: 0.14em;
	color: var(--color-accent);
}

.section-copy {
	margin: 0;
	color: var(--color-text-muted);
	line-height: 1.7;
}

.register-content h2,
.register-auth-card h2 {
	margin: 0;
	font-size: 30px;
	color: var(--color-primary);
}

.form-section {
	display: grid;
	gap: 16px;
	padding: 20px;
	border-radius: 22px;
	background: rgba(255, 255, 255, 0.56);
	border: 1px solid rgba(24, 53, 46, 0.08);
}

.section-title-row h3 {
	margin: 0;
	font-size: 22px;
	color: var(--color-primary);
}

.form-columns {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 20px;
}

.form-group {
	display: grid;
	gap: 8px;
}

.form-group label {
	display: block;
	font-weight: 800;
	color: var(--color-primary);
}

.form-group input {
	width: 100%;
	padding: 14px 16px;
}

.submit-button {
	padding: 14px 18px;
	background: linear-gradient(135deg, var(--color-success), #47a16f);
	color: white;
	border: 1px solid rgba(255, 255, 255, 0.16);
	border-radius: var(--radius-pill);
	cursor: pointer;
	font-size: 16px;
	width: 100%;
	font-weight: 800;
}

.submit-button:hover {
	background: linear-gradient(135deg, #26684a, var(--color-success));
}

.cancel-button {
	padding: 14px 18px;
	background: rgba(255, 255, 255, 0.72);
	color: var(--color-primary);
	border: 1px solid var(--color-border-strong);
	border-radius: var(--radius-pill);
	cursor: pointer;
	font-size: 16px;
	width: 100%;
	font-weight: 800;
}

.cancel-button:hover {
	background: rgba(24, 53, 46, 0.08);
}

.address-row {
	grid-template-columns: repeat(3, minmax(0, 1fr));
}

.form-actions {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px;
}

.error-message {
	color: var(--color-danger);
	font-size: 14px;
	margin: 0;
	font-weight: 700;
}

.radio-group-container {
	display: flex;
	gap: 16px;
	align-items: stretch;
}

.radio-buttons,
.checkbox-container {
	border: 1px solid rgba(24, 53, 46, 0.1);
	border-radius: 18px;
	padding: 14px 16px;
	display: flex;
	gap: 16px;
	align-items: center;
	background: rgba(255, 255, 255, 0.6);
	flex-wrap: wrap;
}

.preference-row {
	margin-bottom: 0;
}

.radio-buttons label,
.checkbox-container label {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	margin: 0;
	font-weight: 700;
}

.radio-buttons input,
.checkbox-container input {
	width: auto;
	margin: 0;
}

.form-column h3 {
	margin: 0 0 10px;
	font-size: 20px;
	color: var(--color-primary);
}

@media (max-width: 900px) {
	.radio-group-container {
		flex-direction: column;
		align-items: stretch;
	}

	.form-columns,
	.address-row,
	.form-actions {
		grid-template-columns: 1fr;
	}

	.form-container {
		padding: 18px;
	}

	.register-content h2,
	.register-auth-card h2 {
		font-size: 26px;
	}
}
</style>
