<template>
	<div>
		<button
			@click="toggleForm"
			:class="showForm ? 'close-form-button' : 'open-form-button'"
		>
			{{ showForm ? "סגור טופס" : "רישום לקוח חדש" }}
		</button>

		<div v-if="showForm" class="form-container">
			<div v-if="!isRegisterAuthenticated" class="form-group">
				<label for="registerPassword">סיסמת רישום:</label>
				<input
					id="registerPassword"
					v-model="registerPassword"
					type="password"
					@keydown.enter="authenticateRegisterRole"
				/>
				<p v-if="registerError" class="error-message">{{ registerError }}</p>
				<button @click="authenticateRegisterRole" class="submit-button">
					אמת סיסמה
				</button>
			</div>

			<div v-else>
				<h2>רישום לקוח חדש</h2>
				<div class="form-group">
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

				<form @submit.prevent="registerCustomer">
					<div class="form-group">
						<label for="lastName">שם משפחה:</label>
						<input id="lastName" v-model="customer.lastName" type="text" required />
					</div>
					<div class="form-columns">
						<div class="form-column">
							<h3>פרטי האב</h3>
							<div class="form-group">
								<label for="fatherName">שם האב:</label>
								<input id="fatherName" v-model="customer.fatherName" type="text" />
							</div>
							<div class="form-group">
								<label for="fatherId">מספר זהות של האב:</label>
								<input
									id="fatherId"
									v-model="customer.fatherId"
									type="text"
									required
								/>
							</div>
							<div class="form-group">
								<label for="fatherPhone">מספר טלפון של האב:</label>
								<input id="fatherPhone" v-model="customer.fatherPhone" type="text" />
							</div>
						</div>

						<div class="form-column">
							<h3>פרטי האם</h3>
							<div class="form-group">
								<label for="motherName">שם האם:</label>
								<input id="motherName" v-model="customer.motherName" type="text" />
							</div>
							<div class="form-group">
								<label for="motherId">מספר זהות של האם:</label>
								<input id="motherId" v-model="customer.motherId" type="text" />
							</div>
							<div class="form-group">
								<label for="motherPhone">מספר טלפון של האם:</label>
								<input id="motherPhone" v-model="customer.motherPhone" type="text" />
							</div>
						</div>
					</div>

					<div class="form-columns">
						<div class="form-group">
							<label for="additionalPhone">טלפון נוסף:</label>
							<input
								id="additionalPhone"
								v-model="customer.additionalPhone"
								type="text"
							/>
						</div>
					</div>

					<h3>כתובת</h3>
					<div class="form-columns address-row">
						<div class="form-group">
							<label for="city">עיר:</label>
							<input id="city" v-model="customer.address.city" type="text" />
						</div>
						<div class="form-group">
							<label for="street">רחוב:</label>
							<input id="street" v-model="customer.address.street" type="text" />
						</div>
						<div class="form-group">
							<label for="houseNumber">מספר בית:</label>
							<input
								id="houseNumber"
								v-model="customer.address.houseNumber"
								type="text"
							/>
						</div>
						<div class="form-group">
							<label for="apartment">מספר דירה:</label>
							<input
								id="apartment"
								v-model="customer.address.apartment"
								type="text"
							/>
						</div>
						<div class="form-group">
							<label for="entrance">כניסה:</label>
							<input
								id="entrance"
								v-model="customer.address.entrance"
								type="text"
							/>
						</div>
						<div class="form-group">
							<label for="floor">קומה:</label>
							<input id="floor" v-model="customer.address.floor" type="text" />
						</div>
					</div>

					<h3>מספר ילדים</h3>
					<div class="form-columns">
						<div class="form-column">
							<div class="form-group">
								<label for="marriedChildren">מספר ילדים נשואים:</label>
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
								<label for="unmarriedChildren">מספר ילדים שאינם נשואים:</label>
								<input
									id="unmarriedChildren"
									v-model.number="customer.unmarriedChildren"
									type="number"
									min="0"
								/>
							</div>
						</div>
					</div>

					<button type="submit" class="submit-button">שלח</button>
					<button type="button" @click="closeForm" class="cancel-button">
						ביטול
					</button>
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
	margin: 50px auto;
	background-color: white;
	padding: 20px;
	border-radius: 8px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	max-width: 1000px;
	width: 95%;
}

.form-columns {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20px;
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
	flex-wrap: wrap;
	direction: rtl;
	justify-content: flex-start;
}

.address-row .form-group {
	flex: 1 1 150px;
	min-width: 150px;
}

.error-message {
	color: red;
	font-size: 14px;
	margin-top: 5px;
}

.radio-group-container {
	display: flex;
	gap: 20px;
	align-items: center;
}

.radio-buttons,
.checkbox-container {
	border: 1px solid #ccc;
	border-radius: 8px;
	padding: 10px;
	display: flex;
	gap: 20px;
	align-items: center;
}

@media (max-width: 900px) {
	.radio-group-container {
		flex-direction: column;
		align-items: stretch;
	}
}
</style>
