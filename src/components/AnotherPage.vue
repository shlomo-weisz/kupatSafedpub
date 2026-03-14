<template>
	<div class="tool-shell">
		<div class="container">
			<div class="box">
				<p class="page-eyebrow">כלי עזר</p>
			<h2>הורדת קישור מיוטיוב</h2>

			<!-- תיבת בחירה בין שרתים -->
			<label for="serverSelect">בחר שרת:</label>
			<select id="serverSelect" v-model="server" @change="updateServer">
				<option value="1">שרת 1</option>
				<!-- <option value="2"> שרת 2 מומלץ ומהיר</option> -->
			</select>

			<label for="youtubeLink">קישור יוטיוב:</label>
			<input type="text" id="youtubeLink" v-model="youtubeLink" placeholder="הכנס קישור מיוטיוב" />
			<label for="email">מייל (אופציונלי):</label>
			<input type="email" id="email" v-model="email" placeholder="הכנס מייל לשיתוף, אחרת הקובץ יחסם בנטפרי" />

			<button @click="handleSubmit">שלח</button>

			<!-- הצגת התקדמות -->
			<div v-if="progress !== null && !downloadLink" class="progress">
				<p>סטטוס: {{ statusMessage }}</p>
				<p>התקדמות: {{ progress }}%</p>
			</div>

			<!-- הצגת קישור להורדה -->
			<div v-if="downloadLink" class="result">
				<p>הקישור להורדה מוכן:</p>
				<a :href="downloadLink" target="_blank">הורד כאן</a>
				<p> תזכורת: הקישור ימחק בעוד שעה<br> צרו לעצמכם עותק או תורידו את הקובץ</p>
			</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	data() {
		return {
			server: 1, // שרת ברירת מחדל
			base_url: "https://fromyoutube-production.up.railway.app/api", // כתובת ברירת מחדל
			base_url1: "https://fromyoutube-production.up.railway.app/api",
			base_url2: "",
			youtubeLink: "",
			email: "",
			downloadLink: null,
			intervalId: null,
			progress: null, // אחוזי התקדמות
			statusMessage: "ממתין להתחלת ההורדה...", // הודעת סטטוס
		};
	},
	created() {
		// קריאת פרמטר URL בעת טעינת הקומפוננטה
		this.getURLParameters();
	},
	methods: {
		getURLParameters() {
			// קבלת פרמטרים מה-URL
			const urlParams = new URLSearchParams(window.location.search);
			const urlParameter = urlParams.get('url');
			
			// אם קיים פרמטר URL, הצב אותו בתיבת הקישור
			if (urlParameter) {
				try {
					// פענוח ה-URL (במקרה שהוא מקודד)
					this.youtubeLink = decodeURIComponent(urlParameter);
					console.log("URL parameter found:", this.youtubeLink);
				} catch (error) {
					console.error("Error decoding URL parameter:", error);
					// אם יש שגיאה בפענוח, השתמש בערך כפי שהוא
					this.youtubeLink = urlParameter;
				}
			}
		},
		delay(ms) {
			return new Promise((resolve) => setTimeout(resolve, ms));
		},
		updateServer() {
			// עדכון כתובת השרת בהתאם לבחירה
			if (this.server === 1) {
				this.base_url = this.base_url1;
			} else if (this.server === 2) {
				this.base_url = this.base_url2;
			}
			//this.base_url = this.server === 1 ? this.base_url1 : this.base_url2;
			console.log("Server updated to:", this.base_url);
			console.log("Server selected:", this.server);
		},
		async handleSubmit() {
			if (!this.youtubeLink) {
				alert("אנא הכנס קישור מיוטיוב");
				return;
			}
			this.downloadLink = null; // איפוס הקישור להורדה
			this.progress = null; // איפוס אחוזי התקדמות
			this.statusMessage = "ממתין להתחלת ההורדה..."; // איפוס הודעת סטטוס
			try {
				const response = await fetch(`${this.base_url}/upload`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						url: this.youtubeLink,
						email: this.email,
					}),
				});

				if (!response.ok) {
					throw new Error("שגיאה בשליחת הבקשה לשרת");
				}
				const { message, task_id } = await response.json();
				this.statusMessage = message || "ממתין להתחלת ההורדה...";
				while (!this.downloadLink) {
					const statusResponse = await fetch(
						`${this.base_url}/status/${task_id}`,
						{
							method: "GET",
							headers: {
								"Content-Type": "application/json",
							},
						}
					);
					const statusData = await statusResponse.json();
					if (!statusResponse.ok) {
						throw new Error("שגיאה בקבלת הסטטוס מהשרת");
					}
					// עדכון סטטוס והתקדמות
					this.statusMessage = statusData.status || "מוריד את הסרטון...";
					this.progress = statusData.progress || 0;

					// אם הקישור מוכן, עצור את הבדיקה
					if (statusData.link) {
						this.downloadLink = statusData.link;
					}
					else if (statusData.error) {
						this.statusMessage = statusData.error;
						break; // עצור את הלולאה אם יש שגיאה
					}  
					if (this.progress === 100) {
						this.statusMessage = "ההורדה הושלמה ומעלה לדרייב! ";
					}
					await this.delay(2000); // המתן 2 שניות לפני הבדיקה הבאה
				}

			} catch (error) {
				console.error(error);
				alert("אירעה שגיאה, נסה שוב מאוחר יותר");
				//relode
				this.$router.go(0);
			}
		},
	},

	beforeUnmount() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
		}
	},
};
</script>

<style scoped>
.tool-shell {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px 16px;
}

.container {
	width: min(100%, 640px);
	padding: 28px;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	background:
		linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 249, 241, 0.9));
	box-shadow: var(--shadow-medium);
	backdrop-filter: blur(18px);
	direction: rtl;
}

.box {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.page-eyebrow {
	margin: 0;
	font-size: 12px;
	font-weight: 800;
	letter-spacing: 0.14em;
	color: var(--color-accent);
}

h2 {
	margin: 0;
	font-size: clamp(2rem, 4vw, 2.6rem);
	color: var(--color-primary);
}

label {
	font-weight: 800;
	color: var(--color-primary);
}

input,
select {
	padding: 14px 16px;
	width: 100%;
}

button {
	padding: 14px 18px;
	background: linear-gradient(135deg, var(--color-primary), #21493f);
	color: white;
	border: 1px solid rgba(255, 255, 255, 0.16);
	border-radius: var(--radius-pill);
	cursor: pointer;
	font-weight: 800;
}

button:hover {
	background: linear-gradient(135deg, var(--color-primary-hover), #17342d);
}

.progress {
	padding: 16px;
	border: 1px solid rgba(173, 106, 31, 0.18);
	border-radius: 18px;
	background-color: rgba(173, 106, 31, 0.1);
	color: #856404;
}

.result {
	padding: 16px;
	border: 1px solid rgba(47, 125, 89, 0.18);
	border-radius: 18px;
	background-color: rgba(47, 125, 89, 0.1);
	color: #155724;
}

a {
	color: var(--color-accent);
	text-decoration: none;
	font-weight: 800;
}

a:hover {
	text-decoration: underline;
}

@media (max-width: 640px) {
	.container {
		padding: 20px 18px;
	}
}
</style>
