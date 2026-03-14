<template>
	<div class="auth-container">
		<div class="auth-box">
			<p class="auth-eyebrow">גישה מוגנת</p>
			<h2 class="auth-title">גישה מוגנת</h2>
			<p class="auth-subtitle">אנא הזן את הסיסמה כדי לגשת לתוכן</p>

			<div class="form-group">
				<label for="password">סיסמה:</label>
				<input type="password" id="password" v-model="password" @keyup.enter="verifyPassword"
					class="password-input" placeholder="הקלד סיסמה" />
			</div>

			<button @click="verifyPassword" class="auth-button">
				<span v-if="loading"><i class="fas fa-circle-notch fa-spin"></i></span>
				<span v-else>כניסה</span>
			</button>

			<p v-if="error" class="error-message">{{ error }}</p>
		</div>
	</div>
</template>

<script>
export default {
	name: 'AuthScreen',
	data() {
		return {
			password: '',
			error: null,
			loading: false,
			base_url: "https://shimushon.work/sports/",
		};
	},
	methods: {
		async verifyPassword() {
			if (!this.password) {
				this.error = 'אנא הכנס סיסמה';
				return;
			}

			this.loading = true;
			this.error = null;

			try {
				const response = await fetch(`${this.base_url}auth`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						password: this.password
					}),
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || 'סיסמה שגויה');
				}

				// שמירת הטוקן ב-localStorage
				localStorage.setItem('auth_token', data.token);

				// עדכון התכונות בקומפוננטה האב
				this.$emit('auth-success', data.token);
			} catch (error) {
				this.error = error.message || 'אירעה שגיאה באימות הסיסמה';
			} finally {
				this.loading = false;
			}
		}
	}
};
</script>

<style scoped>
.auth-container {
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 100vh;
	background:
		radial-gradient(circle at top right, rgba(194, 107, 67, 0.22), transparent 30%),
		radial-gradient(circle at top left, rgba(47, 125, 89, 0.16), transparent 32%),
		linear-gradient(180deg, rgba(248, 242, 232, 0.96), rgba(237, 231, 220, 0.96));
	direction: rtl;
	padding: 20px;
}

.auth-box {
	width: 90%;
	max-width: 430px;
	background: rgba(255, 255, 255, 0.9);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-medium);
	border: 1px solid var(--color-border);
	padding: 30px;
	text-align: right;
	backdrop-filter: blur(18px);
}

.auth-eyebrow {
	margin: 0 0 8px;
	font-size: 12px;
	font-weight: 800;
	letter-spacing: 0.14em;
	color: var(--color-accent);
}

.auth-title {
	font-size: 1.8rem;
	margin: 0 0 10px;
	color: var(--color-primary);
}

.auth-subtitle {
	color: var(--color-text-muted);
	margin-bottom: 25px;
	line-height: 1.7;
}

.form-group {
	margin-bottom: 20px;
	text-align: right;
}

.form-group label {
	display: block;
	margin-bottom: 5px;
	font-weight: 800;
	color: var(--color-primary);
}

.password-input {
	width: 100%;
	padding: 12px 15px;
	font-size: 16px;
}

.auth-button {
	width: 100%;
	padding: 14px 16px;
	background: linear-gradient(135deg, var(--color-primary), #21493f);
	color: white;
	border: 1px solid rgba(255, 255, 255, 0.16);
	border-radius: var(--radius-pill);
	font-size: 16px;
	font-weight: 800;
	cursor: pointer;
}

.auth-button:hover {
	background: linear-gradient(135deg, var(--color-primary-hover), #17342d);
}

.error-message {
	color: var(--color-danger);
	margin-top: 15px;
	font-weight: 700;
}
</style>
