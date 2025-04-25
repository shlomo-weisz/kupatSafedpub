<template>
	<div class="auth-container">
		<div class="auth-box">
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
	background: linear-gradient(to bottom right, #3498db, #8e44ad);
	direction: rtl;
}

.auth-box {
	width: 90%;
	max-width: 400px;
	background-color: white;
	border-radius: 10px;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
	padding: 30px;
	text-align: center;
}

.auth-title {
	font-size: 1.8rem;
	margin-bottom: 10px;
	color: #2c3e50;
}

.auth-subtitle {
	color: #7f8c8d;
	margin-bottom: 25px;
}

.form-group {
	margin-bottom: 20px;
	text-align: right;
}

.form-group label {
	display: block;
	margin-bottom: 5px;
	font-weight: bold;
	color: #34495e;
}

.password-input {
	width: 100%;
	padding: 12px 15px;
	border: 1px solid #ddd;
	border-radius: 5px;
	font-size: 16px;
	transition: border-color 0.3s;
}

.password-input:focus {
	outline: none;
	border-color: #3498db;
	box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.3);
}

.auth-button {
	width: 100%;
	padding: 12px;
	background-color: #3498db;
	color: white;
	border: none;
	border-radius: 5px;
	font-size: 16px;
	font-weight: bold;
	cursor: pointer;
	transition: background-color 0.3s;
}

.auth-button:hover {
	background-color: #2980b9;
}

.error-message {
	color: #e74c3c;
	margin-top: 15px;
}
</style>