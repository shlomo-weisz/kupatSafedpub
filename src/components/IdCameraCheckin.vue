<template>
	<div class="scanner-page" dir="rtl">
		<div v-if="!isAuthorized" class="scanner-auth-shell">
			<form class="scanner-auth-card" @submit.prevent="authenticate">
				<p class="eyebrow">גישה מאובטחת</p>
				<h1>סימון קבלה בצילום</h1>
				<p class="scanner-copy">
					הזינו קוד משתמש כדי לפתוח את מסך הצילום ולסמן קבלה מתוך תעודה מזהה.
				</p>
				<label for="scannerAccessCode">קוד משתמש</label>
				<input
					id="scannerAccessCode"
					v-model="accessCode"
					type="password"
					autocomplete="current-password"
					placeholder="הכנס קוד"
				/>
				<p v-if="codeError" class="scanner-error">{{ codeError }}</p>
				<button type="submit" class="primary-button">אמת קוד</button>
				<button type="button" class="secondary-button" @click="goHome">
					חזרה למסך הראשי
				</button>
			</form>
		</div>

		<div v-else class="scanner-shell">
			<VolunteerNameInput
				:value="volunteerName"
				@update-volunteer-name="volunteerName = $event"
			/>

			<div class="scanner-layout">
				<section class="scanner-card scanner-card--camera">
					<div class="scanner-card-header">
						<p class="eyebrow">צילום תעודה</p>
						<h1>סימון קבלה אוטומטי</h1>
						<p class="scanner-copy">
							מקמו את אזור מספר הזהות בתוך המסגרת, לחצו על צלם, והמערכת תנסה
							לחלץ את המספר ולסמן את המשפחה שקיבלה.
						</p>
					</div>

					<div class="camera-stage">
						<video
							ref="videoElement"
							class="camera-video"
							autoplay
							muted
							playsinline
						></video>

						<div class="camera-overlay">
							<div ref="scanFrame" class="scan-frame"></div>
							<p class="scan-frame-label">מקמו כאן את אזור מספר הזהות</p>
						</div>

						<div v-if="processing" class="camera-status-overlay">
							<p>מפענח את התמונה ובודק מול המסד...</p>
						</div>

						<div v-else-if="cameraError" class="camera-status-overlay camera-status-overlay--error">
							<p>{{ cameraError }}</p>
						</div>

						<div v-else-if="!isCameraReady" class="camera-status-overlay">
							<p>מפעיל מצלמה...</p>
						</div>
					</div>

					<div class="camera-actions">
						<button
							type="button"
							class="primary-button"
							:disabled="processing || !isCameraReady"
							@click="captureAndProcess"
						>
							{{ processing ? "מעבד צילום..." : "צלם" }}
						</button>
						<button
							type="button"
							class="secondary-button"
							:disabled="processing"
							@click="restartCamera"
						>
							הפעל מחדש מצלמה
						</button>
						<button type="button" class="secondary-button" @click="goHome">
							חזרה למסך הראשי
						</button>
					</div>

					<p class="scanner-hint">
						כדי לשפר את הדיוק, צלמו רק את אזור מספר הזהות ולא את כל התעודה.
					</p>
				</section>

				<section
					:class="[
						'scanner-card',
						'scanner-card--result',
						`scanner-card--${scanState.kind}`,
					]"
				>
					<p class="eyebrow">תוצאה</p>
					<h2>{{ scanState.title }}</h2>
					<p class="scanner-copy">{{ scanState.message }}</p>

					<div
						v-if="scanState.extractedId || scanState.customer"
						class="scan-result-details"
					>
						<div v-if="scanState.extractedId" class="detail-row">
							<span>תעודת זהות שזוהתה</span>
							<strong>{{ scanState.extractedId }}</strong>
						</div>
						<div v-if="scanState.customer" class="detail-row">
							<span>שם משפחה</span>
							<strong>{{ scanState.customer.last_name || "-" }}</strong>
						</div>
						<div v-if="scanState.customer" class="detail-row">
							<span>שם האב</span>
							<strong>{{ scanState.customer.father_first_name || "-" }}</strong>
						</div>
						<div v-if="scanState.customer" class="detail-row">
							<span>שם האם</span>
							<strong>{{ scanState.customer.mother_first_name || "-" }}</strong>
						</div>
						<div
							v-if="
								scanState.customer &&
								scanState.customer.received &&
								scanState.customer.volunteer_name
							"
							class="detail-row"
						>
							<span>מתנדב</span>
							<strong>{{ scanState.customer.volunteer_name }}</strong>
						</div>
						<div
							v-if="
								scanState.customer &&
								scanState.customer.received &&
								scanState.customer.received_time
							"
							class="detail-row"
						>
							<span>שעת קבלה</span>
							<strong>{{ formatTime(scanState.customer.received_time) }}</strong>
						</div>
					</div>

					<p v-if="scanState.duplicateNotice" class="scan-duplicate-note">
						{{ scanState.duplicateNotice }}
					</p>

					<button
						type="button"
						class="secondary-button scan-reset-button"
						:disabled="processing"
						@click="clearStatus"
					>
						איפוס הודעה
					</button>
				</section>
			</div>

			<canvas ref="captureCanvas" class="hidden-canvas"></canvas>
			<myLogo />
		</div>
	</div>
</template>

<script>
import {
	authHeaders,
	buildApiUrl,
	clearStoredToken,
	getStoredToken,
	loginWithRole,
} from "../utils/api";
import VolunteerNameInput from "./VolunteerNameInput.vue";
import myLogo from "./myLogo.vue";

const OCR_API_URL =
	"https://orlando-classes-adjustable-meat.trycloudflare.com/extract-id?ocr_provider=auto";

function buildInitialScanState() {
	return {
		kind: "idle",
		title: "מוכן לצילום",
		message: "מקמו את אזור מספר הזהות בתוך המסגרת ולחצו על צלם.",
		extractedId: "",
		customer: null,
		duplicateNotice: "",
	};
}

function buildScanState(kind, title, message, options = {}) {
	return {
		kind,
		title,
		message,
		extractedId: options.extractedId || "",
		customer: options.customer || null,
		duplicateNotice: options.duplicateNotice || "",
	};
}

function normalizeIdNumber(value) {
	const digits = String(value || "").replace(/\D/g, "");
	return digits.length >= 8 && digits.length <= 9 ? digits : "";
}

function collectCandidateIds(value, candidates) {
	if (!value) {
		return;
	}

	if (typeof value === "string") {
		const matches = value.match(/\b\d{8,9}\b/g) || [];
		for (const match of matches) {
			const normalized = normalizeIdNumber(match);
			if (normalized) {
				candidates.push(normalized);
			}
		}
		return;
	}

	if (Array.isArray(value)) {
		for (const item of value) {
			collectCandidateIds(item, candidates);
		}
		return;
	}

	if (typeof value === "object") {
		for (const [key, nestedValue] of Object.entries(value)) {
			if (/(^|_)(id|identity)(_|$)/i.test(key)) {
				const normalized = normalizeIdNumber(nestedValue);
				if (normalized) {
					candidates.push(normalized);
				}
			}
			collectCandidateIds(nestedValue, candidates);
		}
	}
}

function extractIdNumberFromPayload(payload) {
	const preferredValues = [
		payload?.id_number,
		payload?.idNumber,
		payload?.identity_number,
		payload?.identityNumber,
		payload?.extracted_id,
		payload?.extractedId,
		payload?.result?.id_number,
		payload?.result?.idNumber,
		payload?.data?.id_number,
		payload?.data?.idNumber,
	];

	for (const value of preferredValues) {
		const normalized = normalizeIdNumber(value);
		if (normalized) {
			return normalized;
		}
	}

	const candidates = [];
	collectCandidateIds(payload, candidates);
	const uniqueCandidates = Array.from(new Set(candidates));
	return uniqueCandidates.find((candidate) => candidate.length === 9) || uniqueCandidates[0] || "";
}

function getServiceMessage(payload) {
	return (
		payload?.message ||
		payload?.error ||
		payload?.detail ||
		payload?.status ||
		payload?.result?.message ||
		""
	);
}

function isNoIdDetectedMessage(message) {
	return /לא\s*נמצאה|לא\s*זוהתה|not\s*found|no\s*id|could\s*not\s*extract/i.test(
		String(message || "")
	);
}

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
	name: "IdCameraCheckin",
	components: {
		VolunteerNameInput,
		myLogo,
	},
	data() {
		return {
			accessCode: "",
			codeError: "",
			isAuthorized: false,
			volunteerName: "",
			videoStream: null,
			isCameraReady: false,
			cameraError: "",
			processing: false,
			scanState: buildInitialScanState(),
		};
	},
	mounted() {
		this.isAuthorized = Boolean(getStoredToken("users"));
		if (this.isAuthorized) {
			this.startCamera();
		}
	},
	beforeUnmount() {
		this.stopCamera();
	},
	methods: {
		async authenticate() {
			try {
				await loginWithRole("users", this.accessCode);
				this.isAuthorized = true;
				this.accessCode = "";
				this.codeError = "";
				await this.$nextTick();
				await this.startCamera();
			} catch (error) {
				this.codeError = "קוד המשתמש שגוי או שהשרת לא זמין.";
			}
		},
		goHome() {
			this.$router.push("/");
		},
		clearStatus() {
			this.scanState = buildInitialScanState();
		},
		stopCamera() {
			if (this.videoStream) {
				this.videoStream.getTracks().forEach((track) => track.stop());
				this.videoStream = null;
			}
			const videoElement = this.$refs.videoElement;
			if (videoElement) {
				videoElement.srcObject = null;
			}
			this.isCameraReady = false;
		},
		async startCamera() {
			this.stopCamera();
			this.cameraError = "";
			this.isCameraReady = false;

			if (
				typeof navigator === "undefined" ||
				!navigator.mediaDevices ||
				typeof navigator.mediaDevices.getUserMedia !== "function"
			) {
				this.cameraError = "הדפדפן הזה לא תומך בגישה למצלמה.";
				return;
			}

			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						facingMode: { ideal: "environment" },
						width: { ideal: 1920 },
						height: { ideal: 1080 },
					},
					audio: false,
				});

				this.videoStream = stream;
				const videoElement = this.$refs.videoElement;
				if (!videoElement) {
					return;
				}

				videoElement.srcObject = stream;
				await new Promise((resolve) => {
					videoElement.onloadedmetadata = () => resolve();
					window.setTimeout(resolve, 500);
				});
				await videoElement.play().catch(() => {});
				this.isCameraReady = true;
			} catch (error) {
				console.error("Camera start error:", error);
				this.cameraError =
					"לא ניתן היה לפתוח את המצלמה. בדקו הרשאות דפדפן ונסו שוב.";
			}
		},
		async restartCamera() {
			this.clearStatus();
			await this.startCamera();
		},
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
			this.isAuthorized = true;
			return token;
		},
		async captureFrameFile() {
			const videoElement = this.$refs.videoElement;
			const scanFrame = this.$refs.scanFrame;
			const canvas = this.$refs.captureCanvas;
			if (!videoElement || !canvas || !videoElement.videoWidth || !videoElement.videoHeight) {
				throw new Error("המצלמה עדיין לא מוכנה לצילום.");
			}

			let sourceX = 0;
			let sourceY = 0;
			let sourceWidth = videoElement.videoWidth;
			let sourceHeight = videoElement.videoHeight;

			if (scanFrame) {
				const videoRect = videoElement.getBoundingClientRect();
				const frameRect = scanFrame.getBoundingClientRect();
				const displayWidth = videoRect.width;
				const displayHeight = videoRect.height;
				const scale = Math.max(
					displayWidth / videoElement.videoWidth,
					displayHeight / videoElement.videoHeight
				);
				const renderedWidth = videoElement.videoWidth * scale;
				const renderedHeight = videoElement.videoHeight * scale;
				const offsetX = (renderedWidth - displayWidth) / 2;
				const offsetY = (renderedHeight - displayHeight) / 2;

				sourceX = Math.max(0, (frameRect.left - videoRect.left + offsetX) / scale);
				sourceY = Math.max(0, (frameRect.top - videoRect.top + offsetY) / scale);
				sourceWidth = Math.min(
					videoElement.videoWidth - sourceX,
					frameRect.width / scale
				);
				sourceHeight = Math.min(
					videoElement.videoHeight - sourceY,
					frameRect.height / scale
				);
			}

			canvas.width = Math.max(1, Math.round(sourceWidth));
			canvas.height = Math.max(1, Math.round(sourceHeight));
			const context = canvas.getContext("2d");
			context.drawImage(
				videoElement,
				sourceX,
				sourceY,
				sourceWidth,
				sourceHeight,
				0,
				0,
				canvas.width,
				canvas.height
			);

			return new Promise((resolve, reject) => {
				canvas.toBlob(
					(blob) => {
						if (!blob) {
							reject(new Error("לא ניתן היה ליצור תמונה מהצילום."));
							return;
						}

						resolve(
							new File([blob], `id-capture-${Date.now()}.jpg`, {
								type: "image/jpeg",
							})
						);
					},
					"image/jpeg",
					0.92
				);
			});
		},
		async extractIdFromImage(file) {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch(OCR_API_URL, {
				method: "POST",
				body: formData,
			});

			let payload = null;
			try {
				payload = await response.json();
			} catch (error) {
				payload = null;
			}

			const extractedId = extractIdNumberFromPayload(payload);
			if (extractedId) {
				return extractedId;
			}

			const serviceMessage = getServiceMessage(payload);
			if (!response.ok && !isNoIdDetectedMessage(serviceMessage)) {
				throw new Error(serviceMessage || "לא ניתן היה לפענח את התמונה.");
			}

			return "";
		},
		async searchCustomerById(idNumber) {
			const response = await fetch(buildApiUrl("/searchid"), {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ id: idNumber }),
			});

			const payload = await response.json();
			if (response.status === 404) {
				return null;
			}

			if (!response.ok || payload.success === false) {
				const error = new Error(payload.message || "שגיאה בחיפוש לפי תעודת זהות.");
				error.status = response.status;
				throw error;
			}

			return {
				customer: payload.customer,
				matchCount: Number(payload.matchCount || 1),
			};
		},
		async markCustomer(customerId) {
			const executeMark = async () => {
				const token = await this.ensureUsersToken();
				const response = await fetch(buildApiUrl("/mark"), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...authHeaders(token),
					},
					body: JSON.stringify({
						id: customerId,
						volunteer_name: this.volunteerName,
					}),
				});
				return readJsonResponse(response);
			};

			try {
				return await executeMark();
			} catch (error) {
				if (error.status === 401 || error.status === 403) {
					clearStoredToken("users");
					this.stopCamera();
					this.isAuthorized = false;
					throw new Error("פג תוקף ההתחברות. יש להזין קוד משתמש מחדש.");
				}
				throw error;
			}
		},
		async processExtractedId(idNumber) {
			const foundMatch = await this.searchCustomerById(idNumber);
			if (!foundMatch || !foundMatch.customer) {
				return buildScanState(
					"warning",
					"לא נמצאה רשומה במערכת",
					"זוהתה תעודת זהות, אבל היא לא קיימת בטבלה הראשית של הסט הפעיל.",
					{ extractedId: idNumber }
				);
			}

			const { customer, matchCount } = foundMatch;
			const duplicateNotice =
				matchCount > 1
					? `נמצאו ${matchCount} רשומות עם אותה תעודת זהות. הרשומה הראשונה טופלה.`
					: "";

			if (customer.received) {
				return buildScanState(
					"warning",
					"הלקוח כבר קיבל",
					"הרשומה כבר מסומנת כמי שקיבלה. אפשר לראות כאן את שעת הקבלה ואת שם המתנדב שסימן.",
					{
						extractedId: idNumber,
						customer,
						duplicateNotice,
					}
				);
			}

			await this.markCustomer(customer.id);
			const refreshedMatch = await this.searchCustomerById(idNumber);
			return buildScanState(
				"success",
				"הקבלה סומנה בהצלחה",
				"המשפחה סומנה עכשיו כמי שקיבלה דרך מסך הצילום.",
				{
					extractedId: idNumber,
					customer: refreshedMatch?.customer || customer,
					duplicateNotice,
				}
			);
		},
		async captureAndProcess() {
			if (!this.volunteerName.trim()) {
				this.scanState = buildScanState(
					"error",
					"חסר שם מתנדב",
					"יש להזין קודם את שם המתנדב לפני צילום התעודה."
				);
				return;
			}

			if (!this.isCameraReady) {
				this.scanState = buildScanState(
					"error",
					"המצלמה לא מוכנה",
					"יש להמתין שהמצלמה תעלה או להפעיל אותה מחדש."
				);
				return;
			}

			this.processing = true;
			this.scanState = buildScanState(
				"processing",
				"מעבד את הצילום",
				"מחלץ את מספר הזהות ובודק את הרשומה במערכת."
			);

			try {
				const imageFile = await this.captureFrameFile();
				const extractedId = await this.extractIdFromImage(imageFile);

				if (!extractedId) {
					this.scanState = buildScanState(
						"warning",
						"לא זוהתה תעודת זהות",
						"ה־OCR לא הצליח לזהות מספר זהות מהצילום. נסו לכוון מחדש את המסגרת ולצלם שוב."
					);
					return;
				}

				this.scanState = await this.processExtractedId(extractedId);
			} catch (error) {
				console.error("Scanner flow error:", error);
				this.scanState = buildScanState(
					"error",
					"שגיאה בתהליך הצילום",
					error.message || "אירעה שגיאה בזמן פענוח התמונה או בדיקת הרשומה."
				);
			} finally {
				this.processing = false;
			}
		},
		formatTime(dateString) {
			const date = new Date(dateString);
			return date.toLocaleTimeString("he-IL", {
				hour: "2-digit",
				minute: "2-digit",
			});
		},
	},
};
</script>

<style scoped>
.scanner-page {
	min-height: 100vh;
	padding: 24px 16px 48px;
}

.scanner-auth-shell {
	min-height: calc(100vh - 48px);
	display: flex;
	align-items: center;
	justify-content: center;
}

.scanner-auth-card,
.scanner-card {
	background: rgba(255, 251, 246, 0.88);
	border: 1px solid var(--color-border);
	border-radius: 28px;
	box-shadow: var(--shadow-medium);
	backdrop-filter: blur(18px);
}

.scanner-auth-card {
	width: min(100%, 460px);
	padding: 30px;
	display: grid;
	gap: 14px;
}

.eyebrow {
	margin: 0;
	font-size: 12px;
	font-weight: 800;
	letter-spacing: 0.14em;
	color: var(--color-accent);
}

.scanner-auth-card h1,
.scanner-card h1,
.scanner-card h2 {
	margin: 0;
	color: var(--color-primary);
}

.scanner-copy {
	margin: 0;
	color: var(--color-text-muted);
	line-height: 1.7;
}

.scanner-auth-card label {
	font-weight: 800;
	color: var(--color-primary);
}

.scanner-auth-card input {
	padding: 14px 16px;
}

.scanner-error {
	margin: 0;
	color: var(--color-danger);
	font-weight: 700;
}

.primary-button,
.secondary-button {
	padding: 14px 18px;
	border-radius: var(--radius-pill);
	font-weight: 800;
	cursor: pointer;
	border: 1px solid transparent;
}

.primary-button {
	background: linear-gradient(135deg, var(--color-primary), #21493f);
	color: #fffaf1;
	border-color: rgba(255, 255, 255, 0.16);
}

.secondary-button {
	background: rgba(255, 255, 255, 0.78);
	color: var(--color-primary);
	border-color: var(--color-border-strong);
}

.scanner-shell {
	display: grid;
	gap: 18px;
}

.scanner-layout {
	max-width: 1500px;
	margin: 0 auto;
	display: grid;
	grid-template-columns: minmax(0, 1.15fr) minmax(340px, 420px);
	gap: 20px;
	align-items: start;
}

.scanner-card {
	padding: 24px;
	display: grid;
	gap: 18px;
	direction: rtl;
}

.scanner-card-header {
	display: grid;
	gap: 10px;
}

.camera-stage {
	position: relative;
	overflow: hidden;
	border-radius: 26px;
	min-height: 420px;
	background:
		linear-gradient(135deg, rgba(24, 53, 46, 0.96), rgba(42, 74, 65, 0.92));
	border: 1px solid rgba(255, 255, 255, 0.08);
	box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.camera-video {
	width: 100%;
	height: 100%;
	min-height: 420px;
	object-fit: cover;
	display: block;
}

.camera-overlay {
	position: absolute;
	inset: 0;
	display: grid;
	place-items: center;
	pointer-events: none;
}

.scan-frame {
	width: min(68%, 430px);
	height: min(24vw, 130px);
	min-height: 92px;
	border: 3px solid rgba(255, 255, 255, 0.96);
	border-radius: 22px;
	box-shadow:
		0 0 0 9999px rgba(0, 0, 0, 0.28),
		0 0 0 14px rgba(194, 107, 67, 0.18);
}

.scan-frame-label {
	position: absolute;
	bottom: 32px;
	margin: 0;
	padding: 10px 14px;
	border-radius: 999px;
	background: rgba(24, 53, 46, 0.74);
	color: #fffaf1;
	font-weight: 700;
}

.camera-status-overlay {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px;
	background: rgba(16, 27, 23, 0.46);
	color: #fffaf1;
	font-size: 20px;
	font-weight: 800;
	text-align: center;
}

.camera-status-overlay--error {
	background: rgba(122, 36, 24, 0.78);
}

.camera-actions {
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
}

.scanner-hint {
	margin: 0;
	color: var(--color-text-muted);
	line-height: 1.7;
}

.scanner-card--result h2 {
	font-size: 28px;
}

.scan-result-details {
	display: grid;
	gap: 10px;
}

.detail-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 14px;
	padding: 12px 14px;
	border-radius: 18px;
	background: rgba(255, 255, 255, 0.7);
	border: 1px solid rgba(24, 53, 46, 0.08);
}

.detail-row span {
	color: var(--color-text-muted);
	font-weight: 700;
}

.detail-row strong {
	color: var(--color-primary);
}

.scan-duplicate-note {
	margin: 0;
	padding: 14px 16px;
	border-radius: 18px;
	background: rgba(194, 107, 67, 0.12);
	color: #7a4c2d;
	font-weight: 700;
	line-height: 1.7;
}

.scan-reset-button {
	justify-self: start;
}

.scanner-card--success {
	border-color: rgba(47, 125, 89, 0.18);
}

.scanner-card--warning {
	border-color: rgba(173, 106, 31, 0.18);
}

.scanner-card--error {
	border-color: rgba(182, 79, 71, 0.18);
}

.scanner-card--processing {
	border-color: rgba(24, 53, 46, 0.16);
}

.hidden-canvas {
	display: none;
}

@media (max-width: 1080px) {
	.scanner-layout {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 700px) {
	.scanner-page {
		padding-inline: 10px;
	}

	.scanner-card,
	.scanner-auth-card {
		padding: 20px 18px;
	}

	.camera-stage,
	.camera-video {
		min-height: 340px;
	}

	.scan-frame {
		width: min(82%, 340px);
		height: 104px;
	}

	.camera-actions {
		flex-direction: column;
	}

	.primary-button,
	.secondary-button,
	.scan-reset-button {
		width: 100%;
	}

	.detail-row {
		flex-direction: column;
		align-items: flex-start;
	}
}
</style>
