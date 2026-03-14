<template>
	<div class="access-shell">
		<form v-if="!isCodeValid" class="code-input-container" @submit.prevent="checkPass">
			<p class="access-badge">גישה מאובטחת</p>
			<h1>מסך חלוקה מוגן</h1>
			<p class="access-copy">הזינו קוד משתמש כדי לפתוח את ממשק החיפוש והרישום.</p>
			<label for="accessCode">הכנס קוד גישה:</label>
			<input
				id="accessCode"
				v-model="accessCode"
				type="password"
				placeholder="הכנס קוד"
				autocomplete="current-password"
				@keydown.enter="checkPass"
			/>
			<p v-if="codeError" class="error-message">קוד שגוי, נסה שוב.</p>
			<button type="submit" class="submit-button">אמת קוד</button>
		</form>

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
.access-shell {
	min-height: 100vh;
}

.code-input-container {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: min(92vw, 460px);
	margin: 0 auto;
	padding: 28px;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	background:
		linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 248, 239, 0.9));
	box-shadow: var(--shadow-medium);
	text-align: right;
	direction: rtl;
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	backdrop-filter: blur(18px);
	z-index: 30;
}

.access-badge {
	margin: 0;
	font-size: 12px;
	font-weight: 800;
	letter-spacing: 0.14em;
	color: var(--color-accent);
}

.code-input-container h1 {
	margin: 0;
	font-size: clamp(1.8rem, 4vw, 2.35rem);
	line-height: 1.1;
	color: var(--color-primary);
}

.access-copy {
	margin: -4px 0 2px;
	font-size: 15px;
	line-height: 1.7;
	color: var(--color-text-muted);
}

.code-input-container label {
	font-size: 15px;
	font-weight: 700;
	color: var(--color-primary);
}

.code-input-container input {
	padding: 14px 16px;
	font-size: 16px;
	width: 100%;
}

.error-message {
	color: var(--color-danger);
	font-size: 14px;
	margin: -2px 0 0;
	font-weight: 700;
}

.submit-button {
	padding: 14px 18px;
	background: linear-gradient(135deg, var(--color-primary), #21493f);
	color: #fffaf1;
	border: 1px solid rgba(255, 255, 255, 0.16);
	border-radius: var(--radius-pill);
	cursor: pointer;
	font-size: 16px;
	font-weight: 800;
	box-shadow: 0 16px 28px rgba(24, 53, 46, 0.18);
}

.submit-button:hover {
	background: linear-gradient(135deg, var(--color-primary-hover), #17342d);
}

@media (max-width: 640px) {
	.code-input-container {
		position: static;
		transform: none;
		width: calc(100vw - 28px);
		margin: 18px auto;
		padding: 24px 18px;
	}
}
</style>
