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
					<div v-if="scanDebugEnabled" class="scanner-debug">
						<div class="scanner-debug-header">
							<p class="eyebrow">אבחון</p>
							<button
								type="button"
								class="secondary-button scanner-debug-clear"
								@click="clearDebugEvents"
							>
								נקה לוגים
							</button>
						</div>
						<div class="scanner-debug-summary">
							<p><strong>OCR:</strong> {{ ocrApiUrl || "לא הוגדר" }}</p>
							<p><strong>Still mode:</strong> {{ stillCaptureMode }}</p>
						</div>
						<div class="scanner-debug-log">
							<p v-if="debugEvents.length === 0" class="scanner-debug-empty">
								עדיין אין לוגים.
							</p>
							<div
								v-for="entry in debugEvents"
								:key="entry.id"
								class="scanner-debug-entry"
							>
								<span class="scanner-debug-time">{{ entry.time }}</span>
								<strong>{{ entry.label }}</strong>
								<code v-if="entry.details">{{ entry.details }}</code>
							</div>
						</div>
					</div>
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
	OCR_API_URL,
	SCAN_DEBUG_ENABLED,
	authHeaders,
	buildApiUrl,
	clearStoredToken,
	getStoredToken,
	getStoredVolunteerName,
	loginWithRole,
	setStoredVolunteerName,
} from "../utils/api";
import VolunteerNameInput from "./VolunteerNameInput.vue";
import myLogo from "./myLogo.vue";
const CAMERA_CAPTURE_QUALITY = 0.97;
const LOSSLESS_CAPTURE_MAX_PIXELS = 2500000;
const CAMERA_VIDEO_CONSTRAINTS = [
	{
		facingMode: { ideal: "environment" },
		width: { min: 1920, ideal: 3840 },
		height: { min: 1080, ideal: 2160 },
		aspectRatio: { ideal: 16 / 9 },
	},
	{
		facingMode: { ideal: "environment" },
		width: { ideal: 2560 },
		height: { ideal: 1440 },
		aspectRatio: { ideal: 16 / 9 },
	},
	{
		facingMode: { ideal: "environment" },
		width: { ideal: 1920 },
		height: { ideal: 1080 },
		aspectRatio: { ideal: 16 / 9 },
	},
	{
		facingMode: { ideal: "environment" },
	},
];

function getImageCaptureConstructor() {
	if (typeof window !== "undefined" && typeof window.ImageCapture === "function") {
		return window.ImageCapture;
	}

	if (typeof self !== "undefined" && typeof self.ImageCapture === "function") {
		return self.ImageCapture;
	}

	return null;
}

async function openBestAvailableCameraStream() {
	let lastError = null;

	for (const videoConstraints of CAMERA_VIDEO_CONSTRAINTS) {
		try {
			return await navigator.mediaDevices.getUserMedia({
				video: videoConstraints,
				audio: false,
			});
		} catch (error) {
			lastError = error;
			if (
				error?.name === "NotAllowedError" ||
				error?.name === "SecurityError" ||
				error?.name === "NotReadableError"
			) {
				break;
			}
		}
	}

	throw lastError || new Error("לא ניתן היה לפתוח את המצלמה.");
}

function getCaptureExportOptions(cropRect) {
	const pixelCount =
		Math.max(1, Math.round(cropRect.sourceWidth)) *
		Math.max(1, Math.round(cropRect.sourceHeight));

	if (pixelCount <= LOSSLESS_CAPTURE_MAX_PIXELS) {
		return {
			mimeType: "image/png",
			fileExtension: "png",
		};
	}

	return {
		mimeType: "image/jpeg",
		fileExtension: "jpg",
		quality: CAMERA_CAPTURE_QUALITY,
	};
}

function buildSourceCropRect(videoElement, scanFrame, sourceWidth, sourceHeight) {
	let sourceX = 0;
	let sourceY = 0;
	let cropWidth = sourceWidth;
	let cropHeight = sourceHeight;

	if (scanFrame) {
		const videoRect = videoElement.getBoundingClientRect();
		const frameRect = scanFrame.getBoundingClientRect();
		const displayWidth = Math.max(1, videoRect.width);
		const displayHeight = Math.max(1, videoRect.height);
		const scale = Math.max(displayWidth / sourceWidth, displayHeight / sourceHeight);
		const renderedWidth = sourceWidth * scale;
		const renderedHeight = sourceHeight * scale;
		const offsetX = (renderedWidth - displayWidth) / 2;
		const offsetY = (renderedHeight - displayHeight) / 2;

		sourceX = Math.max(0, (frameRect.left - videoRect.left + offsetX) / scale);
		sourceY = Math.max(0, (frameRect.top - videoRect.top + offsetY) / scale);
		cropWidth = Math.min(sourceWidth - sourceX, frameRect.width / scale);
		cropHeight = Math.min(sourceHeight - sourceY, frameRect.height / scale);
	}

	return {
		sourceX,
		sourceY,
		sourceWidth: Math.max(1, cropWidth),
		sourceHeight: Math.max(1, cropHeight),
	};
}

async function loadCaptureSourceFromBlob(blob) {
	if (typeof createImageBitmap === "function") {
		const bitmap = await createImageBitmap(blob);
		return {
			source: bitmap,
			width: bitmap.width,
			height: bitmap.height,
			cleanup: () => bitmap.close(),
		};
	}

	if (typeof URL === "undefined" || typeof Image === "undefined") {
		throw new Error("לא ניתן היה לטעון את תמונת הצילום.");
	}

	const objectUrl = URL.createObjectURL(blob);
	try {
		const image = await new Promise((resolve, reject) => {
			const imageElement = new Image();
			imageElement.onload = () => resolve(imageElement);
			imageElement.onerror = () =>
				reject(new Error("לא ניתן היה לטעון את תמונת הצילום."));
			imageElement.src = objectUrl;
		});

		return {
			source: image,
			width: image.naturalWidth,
			height: image.naturalHeight,
			cleanup: () => URL.revokeObjectURL(objectUrl),
		};
	} catch (error) {
		URL.revokeObjectURL(objectUrl);
		throw error;
	}
}

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
			stillCaptureMode: "unknown",
			scanDebugEnabled: SCAN_DEBUG_ENABLED,
			ocrApiUrl: OCR_API_URL,
			debugEvents: [],
			nextDebugEventId: 1,
			cameraError: "",
			processing: false,
			scanState: buildInitialScanState(),
		};
	},
	watch: {
		volunteerName(newValue) {
			setStoredVolunteerName(newValue);
		},
	},
	mounted() {
		this.volunteerName = getStoredVolunteerName();
		this.addDebugLog("screen-mounted", window.location.href);
		this.addDebugLog("ocr-url", this.ocrApiUrl || "missing");
		if (typeof navigator !== "undefined" && navigator.userAgent) {
			this.addDebugLog("user-agent", navigator.userAgent);
		}
		this.isAuthorized = Boolean(getStoredToken("users"));
		if (this.isAuthorized) {
			this.startCamera();
		}
	},
	beforeUnmount() {
		this.stopCamera();
	},
	methods: {
		addDebugLog(label, details = "") {
			if (!this.scanDebugEnabled) {
				return;
			}

			const entry = {
				id: this.nextDebugEventId++,
				time: new Date().toLocaleTimeString("he-IL", {
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
				}),
				label,
				details: String(details || ""),
			};

			this.debugEvents = [entry, ...this.debugEvents].slice(0, 40);
		},
		clearDebugEvents() {
			this.debugEvents = [];
			this.addDebugLog("debug-cleared");
		},
		describeError(error) {
			if (!error) {
				return "unknown-error";
			}

			return [error.name, error.message].filter(Boolean).join(": ") || String(error);
		},
		compactDebugText(value, maxLength = 220) {
			const normalized = String(value || "")
				.replace(/\s+/g, " ")
				.trim();

			if (!normalized) {
				return "";
			}

			return normalized.length > maxLength
				? `${normalized.slice(0, maxLength)}...`
				: normalized;
		},
		async authenticate() {
			try {
				await loginWithRole("users", this.accessCode);
				this.isAuthorized = true;
				this.accessCode = "";
				this.codeError = "";
				this.addDebugLog("auth-success");
				await this.$nextTick();
				await this.startCamera();
			} catch (error) {
				this.codeError = "קוד המשתמש שגוי או שהשרת לא זמין.";
				this.addDebugLog("auth-failed", this.describeError(error));
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
			this.stillCaptureMode = "unknown";
		},
		async startCamera() {
			this.stopCamera();
			this.cameraError = "";
			this.isCameraReady = false;
			this.addDebugLog("camera-start");

			if (
				typeof navigator === "undefined" ||
				!navigator.mediaDevices ||
				typeof navigator.mediaDevices.getUserMedia !== "function"
			) {
				this.cameraError = "הדפדפן הזה לא תומך בגישה למצלמה.";
				this.addDebugLog("camera-unsupported");
				return;
			}

			try {
				const stream = await openBestAvailableCameraStream();

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
				this.addDebugLog(
					"camera-ready",
					`${videoElement.videoWidth}x${videoElement.videoHeight}`
				);
			} catch (error) {
				console.error("Camera start error:", error);
				this.cameraError =
					"לא ניתן היה לפתוח את המצלמה. בדקו הרשאות דפדפן ונסו שוב.";
				this.addDebugLog("camera-error", this.describeError(error));
			}
		},
		async restartCamera() {
			this.clearStatus();
			this.addDebugLog("camera-restart");
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
		async exportCaptureFile(source, cropRect) {
			const canvas = this.$refs.captureCanvas;
			if (!canvas) {
				throw new Error("לא ניתן היה להכין את אזור הצילום.");
			}
			const exportOptions = getCaptureExportOptions(cropRect);
			this.addDebugLog(
				"capture-export",
				`${exportOptions.mimeType} ${Math.round(cropRect.sourceWidth)}x${Math.round(
					cropRect.sourceHeight
				)}`
			);

			canvas.width = Math.max(1, Math.round(cropRect.sourceWidth));
			canvas.height = Math.max(1, Math.round(cropRect.sourceHeight));
			const context = canvas.getContext("2d");
			if (!context) {
				throw new Error("לא ניתן היה להכין את משטח הצילום.");
			}

			context.imageSmoothingEnabled = true;
			if ("imageSmoothingQuality" in context) {
				context.imageSmoothingQuality = "high";
			}
			context.drawImage(
				source,
				cropRect.sourceX,
				cropRect.sourceY,
				cropRect.sourceWidth,
				cropRect.sourceHeight,
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
							new File([blob], `id-capture-${Date.now()}.${exportOptions.fileExtension}`, {
								type: exportOptions.mimeType,
							})
						);
					},
					exportOptions.mimeType,
					exportOptions.quality
				);
			});
		},
		getActiveVideoTrack() {
			const tracks = this.videoStream?.getVideoTracks?.() || [];
			return tracks[0] || null;
		},
		async captureStillPhotoFile(videoElement, scanFrame) {
			if (this.stillCaptureMode === "unsupported") {
				this.addDebugLog("still-skip", "unsupported");
				return null;
			}

			const ImageCaptureCtor = getImageCaptureConstructor();
			const videoTrack = this.getActiveVideoTrack();
			if (!ImageCaptureCtor || !videoTrack || videoTrack.readyState !== "live") {
				this.stillCaptureMode = "unsupported";
				this.addDebugLog("still-unavailable");
				return null;
			}

			let imageCapture = null;
			try {
				imageCapture = new ImageCaptureCtor(videoTrack);
				this.addDebugLog("still-attempt");
			} catch (error) {
				this.stillCaptureMode = "unsupported";
				this.addDebugLog("still-init-failed", this.describeError(error));
				return null;
			}

			try {
				const photoBlob = await imageCapture.takePhoto();
				const decodedPhoto = await loadCaptureSourceFromBlob(photoBlob);
				this.stillCaptureMode = "supported";
				this.addDebugLog(
					"still-success",
					`${decodedPhoto.width}x${decodedPhoto.height}`
				);

				try {
					const cropRect = buildSourceCropRect(
						videoElement,
						scanFrame,
						decodedPhoto.width,
						decodedPhoto.height
					);
					return await this.exportCaptureFile(decodedPhoto.source, cropRect);
				} finally {
					decodedPhoto.cleanup();
				}
			} catch (error) {
				console.warn(
					"Still photo capture failed, falling back to video frame capture.",
					error
				);
				this.stillCaptureMode = "unsupported";
				this.addDebugLog("still-failed", this.describeError(error));
				return null;
			}
		},
		async captureFrameFile() {
			const videoElement = this.$refs.videoElement;
			const scanFrame = this.$refs.scanFrame;
			if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) {
				throw new Error("המצלמה עדיין לא מוכנה לצילום.");
			}

			const stillPhotoFile = await this.captureStillPhotoFile(videoElement, scanFrame);
			if (stillPhotoFile) {
				this.addDebugLog("capture-source", "still-photo");
				return stillPhotoFile;
			}

			const cropRect = buildSourceCropRect(
				videoElement,
				scanFrame,
				videoElement.videoWidth,
				videoElement.videoHeight
			);
			this.addDebugLog(
				"capture-source",
				`video-frame ${videoElement.videoWidth}x${videoElement.videoHeight}`
			);
			return this.exportCaptureFile(videoElement, cropRect);
		},
		async extractIdFromImage(file) {
			if (!OCR_API_URL) {
				this.addDebugLog("ocr-config-missing");
				throw new Error("כתובת שירות זיהוי הצילום לא הוגדרה במשתני הסביבה.");
			}

			const formData = new FormData();
			formData.append("file", file);
			this.addDebugLog(
				"ocr-request",
				`${OCR_API_URL} | ${file.type || "unknown"} | ${file.size || 0} bytes`
			);

			const response = await fetch(OCR_API_URL, {
				method: "POST",
				body: formData,
			});
			const responseContentType = response.headers.get("content-type") || "unknown";
			const responseContentLength = response.headers.get("content-length") || "";
			const responseSummary = [
				`${response.status} ${response.statusText || ""}`.trim(),
				responseContentType,
			];
			if (response.redirected) {
				responseSummary.push(`redirected -> ${response.url}`);
			}
			if (responseContentLength) {
				responseSummary.push(`len:${responseContentLength}`);
			}
			this.addDebugLog("ocr-response", responseSummary.join(" | "));

			const responseText = await response.text();
			if (responseText) {
				this.addDebugLog(
					"ocr-body-snippet",
					this.compactDebugText(responseText)
				);
			} else {
				this.addDebugLog("ocr-empty-body");
			}

			let payload = null;
			try {
				payload = responseText ? JSON.parse(responseText) : null;
			} catch (error) {
				payload = null;
				this.addDebugLog("ocr-json-parse-failed", this.describeError(error));
			}

			const extractedId = extractIdNumberFromPayload(payload);
			if (extractedId) {
				this.addDebugLog("ocr-id-detected", extractedId);
				return extractedId;
			}

			const serviceMessage = getServiceMessage(payload);
			if (serviceMessage) {
				this.addDebugLog("ocr-message", serviceMessage);
			}
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
			this.addDebugLog("capture-click");
			this.scanState = buildScanState(
				"processing",
				"מעבד את הצילום",
				"מחלץ את מספר הזהות ובודק את הרשומה במערכת."
			);

			try {
				const imageFile = await this.captureFrameFile();
				const extractedId = await this.extractIdFromImage(imageFile);

				if (!extractedId) {
					this.addDebugLog("capture-no-id");
					this.scanState = buildScanState(
						"warning",
						"לא זוהתה תעודת זהות",
						"ה־OCR לא הצליח לזהות מספר זהות מהצילום. נסו לכוון מחדש את המסגרת ולצלם שוב."
					);
					return;
				}

				this.scanState = await this.processExtractedId(extractedId);
				this.addDebugLog("capture-success", extractedId);
			} catch (error) {
				console.error("Scanner flow error:", error);
				this.addDebugLog("capture-error", this.describeError(error));
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

.scanner-debug {
	display: grid;
	gap: 12px;
	padding: 16px;
	border-radius: 20px;
	background: rgba(16, 27, 23, 0.92);
	color: #f7f3eb;
	border: 1px solid rgba(255, 255, 255, 0.08);
}

.scanner-debug-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

.scanner-debug-header .eyebrow {
	color: #f2c8a8;
}

.scanner-debug-clear {
	padding: 10px 14px;
}

.scanner-debug-summary {
	display: grid;
	gap: 8px;
	font-size: 13px;
	line-height: 1.6;
	word-break: break-word;
}

.scanner-debug-summary p {
	margin: 0;
}

.scanner-debug-log {
	display: grid;
	gap: 8px;
	max-height: 240px;
	overflow: auto;
	padding-right: 2px;
}

.scanner-debug-empty {
	margin: 0;
	color: rgba(255, 243, 231, 0.78);
}

.scanner-debug-entry {
	display: grid;
	gap: 4px;
	padding: 10px 12px;
	border-radius: 14px;
	background: rgba(255, 255, 255, 0.05);
	font-size: 12px;
}

.scanner-debug-time {
	color: rgba(255, 243, 231, 0.72);
	font-size: 11px;
}

.scanner-debug-entry code {
	white-space: pre-wrap;
	word-break: break-word;
	color: #cfe7ff;
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
