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

function getRuntimeApiBaseUrl() {
	if (typeof window === "undefined" || !window.__APP_CONFIG__) {
		return "";
	}

	return window.__APP_CONFIG__.VUE_APP_API_BASE_URL || "";
}

const API_BASE_URL = normalizeApiBaseUrl(
	getRuntimeApiBaseUrl() || process.env.VUE_APP_API_BASE_URL || "/api"
);

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

function getStoredToken(role) {
	return window.localStorage.getItem(getStorageKey(role)) || "";
}

function setStoredToken(role, token) {
	window.localStorage.setItem(getStorageKey(role), token);
}

function clearStoredToken(role) {
	window.localStorage.removeItem(getStorageKey(role));
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
	authHeaders,
	buildApiUrl,
	clearStoredToken,
	getStoredToken,
	loginWithRole,
	setStoredToken,
};
