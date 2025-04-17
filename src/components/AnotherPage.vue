<template>
	<div class="container">
		<div class="box">
			<h2>הורדת קישור מיוטיוב</h2>

			<!-- תיבת בחירה בין שרתים -->
			<label for="serverSelect">בחר שרת:</label>
			<select id="serverSelect" v-model="server" @change="updateServer">
				<option value="1">שרת 1</option>
				<option value="2"> שרת 2 מומלץ ומהיר</option> 
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
</template>

<script>
export default {
	data() {
		return {
			server: 2, // שרת ברירת מחדל
			base_url: "https://fromyoutube-production.up.railway.app/api", // כתובת ברירת מחדל
			base_url1: "https://fromyoutube-production.up.railway.app/api",
			base_url2: "https://reserves-french-alternative-easter.trycloudflare.com/api",
			youtubeLink: "",
			email: "",
			downloadLink: null,
			intervalId: null,
			progress: null, // אחוזי התקדמות
			statusMessage: "ממתין להתחלת ההורדה...", // הודעת סטטוס
		};
	},
	methods: {
		delay(ms) {
			return new Promise((resolve) => setTimeout(resolve, ms));
		},
		updateServer() {
			// עדכון כתובת השרת בהתאם לבחירה
			this.base_url = this.server === 1 ? this.base_url1 : this.base_url2;
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
.container {
	max-width: 500px;
	margin: 0 auto;
	padding: 20px;
	border: 1px solid #ccc;
	border-radius: 10px;
	background-color: #f9f9f9;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.box {
	display: flex;
	flex-direction: column;
	gap: 15px;
}

label {
	font-weight: bold;
}

input,
select {
	padding: 10px;
	border: 1px solid #ccc;
	border-radius: 5px;
	width: 90%;
}

button {
	padding: 10px 15px;
	background-color: #007bff;
	color: white;
	border: none;
	border-radius: 5px;
	cursor: pointer;
}

button:hover {
	background-color: #0056b3;
}

.progress {
	margin-top: 20px;
	padding: 10px;
	border: 1px solid #ffc107;
	border-radius: 5px;
	background-color: #fff3cd;
	color: #856404;
}

.result {
	margin-top: 20px;
	padding: 10px;
	border: 1px solid #28a745;
	border-radius: 5px;
	background-color: #d4edda;
	color: #155724;
}

a {
	color: #007bff;
	text-decoration: none;
}

a:hover {
	text-decoration: underline;
}
</style>