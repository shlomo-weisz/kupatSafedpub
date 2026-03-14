<template>
	<div>
		<div v-if="!isCodeValid" class="code-input-container">
			<label for="accessCode">הכנס קוד גישה:</label>
			<input
				id="accessCode"
				v-model="accessCode"
				type="password"
				placeholder="הכנס קוד"
				@keydown.enter="checkPass"
			/>
			<p v-if="codeError" class="error-message">קוד שגוי, נסה שוב.</p>
			<button @click="checkPass" class="submit-button">אמת קוד</button>
		</div>

		<div v-else class="slot-container">
			<slot></slot>
		</div>
	</div>
</template>

<script>
import { getStoredToken, loginWithRole } from "../utils/api";

export default {
	data() {
		return {
			accessCode: "",
			isCodeValid: false,
			codeError: false,
		};
	},
	mounted() {
		this.isCodeValid = Boolean(getStoredToken("users"));
	},
	methods: {
		async checkPass() {
			try {
				await loginWithRole("users", this.accessCode);
				this.isCodeValid = true;
				this.codeError = false;
			} catch (error) {
				this.codeError = true;
			}
		},
	},
	watch: {
		accessCode() {
			this.codeError = false;
		},
	},
};
</script>

<style scoped>
.code-input-container {
	display: flex;
	flex-direction: column;
	gap: 15px;
	max-width: 400px;
	margin: 0 auto;
	padding: 20px;
	border: 1px solid #ccc;
	border-radius: 10px;
	background-color: #f9f9f9;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	text-align: right;
	direction: rtl;
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}

.code-input-container label {
	font-size: 16px;
	font-weight: bold;
	color: #333;
}

.code-input-container input {
	padding: 10px;
	font-size: 16px;
	border: 1px solid #ccc;
	border-radius: 5px;
	width: 100%;
	box-sizing: border-box;
}

.code-input-container input:focus {
	outline: none;
	border-color: #007bff;
	box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
}

.error-message {
	color: red;
	font-size: 14px;
	margin-top: -5px;
}

.submit-button {
	padding: 10px 20px;
	background-color: #007bff;
	color: white;
	border: none;
	border-radius: 5px;
	cursor: pointer;
	font-size: 16px;
	transition: background-color 0.3s ease, transform 0.2s ease;
}

.submit-button:hover {
	background-color: #0056b3;
	transform: scale(1.05);
}
</style>
