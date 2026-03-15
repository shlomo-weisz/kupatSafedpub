function normalizeApiBaseUrl(value) {
	const rawValue = String(value || "").trim();
	if (!rawValue) {
		return "/api";
	}

	if (/^https?:\/\//i.test(rawValue)) {
		return rawValue.replace(/\/+$/, "");
	}

	const normalizedPath = rawValue.startsWith("/") ? rawValue : `/${rawValue}`;
	return normalizedPath.replace(/\/+$/, "") || "/api";
}

function getRuntimeConfigValue(...keys) {
	if (typeof window === "undefined" || !window.__APP_CONFIG__) {
		return "";
	}

	for (const key of keys) {
		const value = window.__APP_CONFIG__[key];
		if (String(value || "").trim()) {
			return value;
		}
	}

	return "";
}

function parseBooleanConfigValue(value, defaultValue = false) {
	const normalizedValue = String(value || "").trim().toLowerCase();
	if (!normalizedValue) {
		return defaultValue;
	}

	if (["1", "true", "yes", "on"].includes(normalizedValue)) {
		return true;
	}

	if (["0", "false", "no", "off"].includes(normalizedValue)) {
		return false;
	}

	return defaultValue;
}

const API_BASE_URL = normalizeApiBaseUrl(
	getRuntimeConfigValue("VUE_APP_API_URL", "VUE_APP_API_BASE_URL") ||
		process.env.VUE_APP_API_URL ||
		process.env.VUE_APP_API_BASE_URL ||
		"/api"
);

const OCR_API_URL = String(
	getRuntimeConfigValue("VUE_APP_OCR_API_URL") || process.env.VUE_APP_OCR_API_URL || ""
).trim();

const SCAN_DEBUG_ENABLED = parseBooleanConfigValue(
	getRuntimeConfigValue("VUE_APP_SCAN_DEBUG") || process.env.VUE_APP_SCAN_DEBUG,
	false
);

const OCR_PROVIDER_STORAGE_KEY = "kupa.ocrProvider";
const OCR_PROVIDER_DEFAULT = "default";
const OCR_PROVIDER_GOOGLE_VISION = "google_vision";

function buildApiUrl(path = "") {
	const rawPath = String(path || "").trim();
	if (!rawPath || rawPath === "/") {
		return API_BASE_URL;
	}

	const normalizedPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
	return `${API_BASE_URL}${normalizedPath}`;
}

function getStorageKey(role) {
	return `kupa.auth.${role}`;
}

const VOLUNTEER_NAME_STORAGE_KEY = "kupa.volunteerName";

function normalizeStoredOcrProvider(value) {
	return String(value || "").trim().toLowerCase() === OCR_PROVIDER_GOOGLE_VISION
		? OCR_PROVIDER_GOOGLE_VISION
		: OCR_PROVIDER_DEFAULT;
}

function getStoredToken(role) {
	return window.localStorage.getItem(getStorageKey(role)) || "";
}

function setStoredToken(role, token) {
	window.localStorage.setItem(getStorageKey(role), token);
}

function clearStoredToken(role) {
	window.localStorage.removeItem(getStorageKey(role));
}

function getStoredVolunteerName() {
	if (typeof window === "undefined" || !window.localStorage) {
		return "";
	}

	return window.localStorage.getItem(VOLUNTEER_NAME_STORAGE_KEY) || "";
}

function setStoredVolunteerName(name) {
	if (typeof window === "undefined" || !window.localStorage) {
		return;
	}

	const normalizedName = String(name || "");
	if (!normalizedName.trim()) {
		window.localStorage.removeItem(VOLUNTEER_NAME_STORAGE_KEY);
		return;
	}

	window.localStorage.setItem(VOLUNTEER_NAME_STORAGE_KEY, normalizedName);
}

function getStoredOcrProvider() {
	if (typeof window === "undefined" || !window.localStorage) {
		return OCR_PROVIDER_DEFAULT;
	}

	return normalizeStoredOcrProvider(
		window.localStorage.getItem(OCR_PROVIDER_STORAGE_KEY)
	);
}

function setStoredOcrProvider(provider) {
	if (typeof window === "undefined" || !window.localStorage) {
		return;
	}

	const normalizedProvider = normalizeStoredOcrProvider(provider);
	if (normalizedProvider === OCR_PROVIDER_DEFAULT) {
		window.localStorage.removeItem(OCR_PROVIDER_STORAGE_KEY);
		return;
	}

	window.localStorage.setItem(OCR_PROVIDER_STORAGE_KEY, normalizedProvider);
}

function buildConfiguredOcrApiUrl(
	baseUrl = OCR_API_URL,
	provider = getStoredOcrProvider()
) {
	const normalizedBaseUrl = String(baseUrl || "").trim();
	if (!normalizedBaseUrl) {
		return "";
	}

	if (normalizeStoredOcrProvider(provider) !== OCR_PROVIDER_GOOGLE_VISION) {
		return normalizedBaseUrl;
	}

	try {
		const isAbsoluteUrl = /^https?:\/\//i.test(normalizedBaseUrl);
		const fallbackBase =
			typeof window !== "undefined" && window.location?.origin
				? window.location.origin
				: "http://localhost";
		const parsedUrl = new URL(normalizedBaseUrl, fallbackBase);
		parsedUrl.searchParams.set("ocr_provider", OCR_PROVIDER_GOOGLE_VISION);

		if (isAbsoluteUrl) {
			return parsedUrl.toString();
		}

		return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
	} catch {
		const withoutExistingProvider = normalizedBaseUrl
			.replace(/([?&])ocr_provider=[^&#]*/i, "$1")
			.replace(/\?&/, "?")
			.replace(/&&+/g, "&")
			.replace(/[?&]$/, "");
		const separator = withoutExistingProvider.includes("?") ? "&" : "?";

		return `${withoutExistingProvider}${separator}ocr_provider=${OCR_PROVIDER_GOOGLE_VISION}`;
	}
}

function authHeaders(token) {
	return token ? { Authorization: `Bearer ${token}` } : {};
}

async function loginWithRole(role, password) {
	const response = await fetch(buildApiUrl("/auth"), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ type: role, password }),
	});
	const data = await response.json();

	if (!response.ok || !data.valid || !data.token) {
		throw new Error(data.message || "ההתחברות נכשלה");
	}

	setStoredToken(role, data.token);
	return data.token;
}

export {
	API_BASE_URL,
	OCR_API_URL,
	OCR_PROVIDER_DEFAULT,
	OCR_PROVIDER_GOOGLE_VISION,
	SCAN_DEBUG_ENABLED,
	authHeaders,
	buildApiUrl,
	buildConfiguredOcrApiUrl,
	clearStoredToken,
	getStoredOcrProvider,
	getStoredToken,
	getStoredVolunteerName,
	loginWithRole,
	setStoredOcrProvider,
	setStoredVolunteerName,
	setStoredToken,
};
