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

const API_BASE_URL = normalizeApiBaseUrl(
	getRuntimeConfigValue("VUE_APP_API_URL", "VUE_APP_API_BASE_URL") ||
		process.env.VUE_APP_API_URL ||
		process.env.VUE_APP_API_BASE_URL ||
		"/api"
);

const OCR_API_URL = String(
	getRuntimeConfigValue("VUE_APP_OCR_API_URL") || process.env.VUE_APP_OCR_API_URL || ""
).trim();

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
	authHeaders,
	buildApiUrl,
	clearStoredToken,
	getStoredToken,
	getStoredVolunteerName,
	loginWithRole,
	setStoredVolunteerName,
	setStoredToken,
};
