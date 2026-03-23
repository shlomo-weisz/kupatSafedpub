import { authHeaders, buildApiUrl } from "./api";

const TIME_WINDOWS_STORAGE_KEY = "kupa.timeWindows.v1";
const TIME_WINDOW_TYPE_CHILDREN = "children";
const TIME_WINDOW_TYPE_LAST_NAME = "lastName";

function cleanText(value) {
	return value === undefined || value === null ? "" : String(value).trim();
}

function normalizeFamilyName(value) {
	return cleanText(value).replace(/\s+/g, " ");
}

function normalizeTimeValue(value) {
	const normalizedValue = cleanText(value);
	return /^\d{2}:\d{2}$/.test(normalizedValue) ? normalizedValue : "";
}

function parseOptionalInteger(value) {
	const normalizedValue = cleanText(value);
	if (normalizedValue === "") {
		return null;
	}

	const parsedValue = Number.parseInt(normalizedValue, 10);
	return Number.isNaN(parsedValue) ? null : parsedValue;
}

function uniqueValues(values) {
	return Array.from(new Set(values.filter(Boolean)));
}

function createTimeWindowId() {
	return `time_window_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildLastNamesTextValue(value) {
	if (Array.isArray(value)) {
		return uniqueValues(value.map(normalizeFamilyName)).join("\n");
	}

	return uniqueValues(
		String(value || "")
			.split(/[\n,;]+/)
			.map(normalizeFamilyName)
	).join("\n");
}

function getTimeWindowLastNames(timeWindow) {
	return uniqueValues(
		String(timeWindow?.lastNamesText || "")
			.split(/[\n,;]+/)
			.map(normalizeFamilyName)
	);
}

function formatChildrenRangeLabel(minChildren, maxChildren) {
	if (minChildren !== null && maxChildren !== null) {
		return `משפחות עם ${minChildren}-${maxChildren} ילדים`;
	}

	if (minChildren !== null) {
		return `משפחות עם ${minChildren} ילדים ומעלה`;
	}

	if (maxChildren !== null) {
		return `משפחות עם עד ${maxChildren} ילדים`;
	}

	return "חלון לפי מספר ילדים";
}

function formatLastNamesLabel(lastNames) {
	if (lastNames.length === 0) {
		return "חלון לפי שם משפחה";
	}

	if (lastNames.length === 1) {
		return `משפחת ${lastNames[0]}`;
	}

	const preview = lastNames.slice(0, 3).join(", ");
	return lastNames.length > 3
		? `משפחות: ${preview} ועוד`
		: `משפחות: ${preview}`;
}

function normalizeTimeWindow(inputWindow = {}, fallbackIndex = 0) {
	const type =
		cleanText(inputWindow.type) === TIME_WINDOW_TYPE_LAST_NAME
			? TIME_WINDOW_TYPE_LAST_NAME
			: TIME_WINDOW_TYPE_CHILDREN;

	return {
		id: cleanText(inputWindow.id) || `time_window_${fallbackIndex + 1}`,
		type,
		label: cleanText(inputWindow.label),
		isActive: Boolean(inputWindow.isActive),
		nextActivationTime: normalizeTimeValue(inputWindow.nextActivationTime),
		minChildren:
			type === TIME_WINDOW_TYPE_CHILDREN
				? cleanText(inputWindow.minChildren)
				: "",
		maxChildren:
			type === TIME_WINDOW_TYPE_CHILDREN
				? cleanText(inputWindow.maxChildren)
				: "",
		lastNamesText:
			type === TIME_WINDOW_TYPE_LAST_NAME
				? buildLastNamesTextValue(
						inputWindow.lastNamesText || inputWindow.lastNames || ""
					)
				: "",
	};
}

function normalizeTimeWindowsSettings(inputSettings = {}) {
	const windows = Array.isArray(inputSettings.windows)
		? inputSettings.windows.map((timeWindow, index) =>
				normalizeTimeWindow(timeWindow, index)
			)
		: [];

	return {
		enabled: Boolean(inputSettings.enabled),
		windows,
	};
}

function cloneTimeWindowSettings(settings = {}) {
	return JSON.parse(
		JSON.stringify(normalizeTimeWindowsSettings(settings))
	);
}

function buildEmptyTimeWindow(type = TIME_WINDOW_TYPE_CHILDREN) {
	return normalizeTimeWindow({
		id: createTimeWindowId(),
		type,
		isActive: false,
		nextActivationTime: "",
		minChildren: "",
		maxChildren: "",
		lastNamesText: "",
	});
}

function getStoredTimeWindowsSettings() {
	if (typeof window === "undefined" || !window.localStorage) {
		return normalizeTimeWindowsSettings();
	}

	try {
		const rawValue = window.localStorage.getItem(TIME_WINDOWS_STORAGE_KEY);
		if (!rawValue) {
			return normalizeTimeWindowsSettings();
		}

		return normalizeTimeWindowsSettings(JSON.parse(rawValue));
	} catch {
		return normalizeTimeWindowsSettings();
	}
}

function setStoredTimeWindowsSettings(settings) {
	if (typeof window === "undefined" || !window.localStorage) {
		return;
	}

	window.localStorage.setItem(
		TIME_WINDOWS_STORAGE_KEY,
		JSON.stringify(normalizeTimeWindowsSettings(settings))
	);
}

async function fetchTimeWindowsSettingsFromServer() {
	try {
		const response = await fetch(buildApiUrl("/time-windows"));
		const data = await response.json();
		if (!response.ok || data.success === false) {
			throw new Error(data.message || "לא ניתן היה לטעון את חלונות הזמן.");
		}

		const normalizedSettings = normalizeTimeWindowsSettings(
			data.timeWindowsSettings
		);
		setStoredTimeWindowsSettings(normalizedSettings);
		return normalizedSettings;
	} catch (error) {
		const cachedSettings = getStoredTimeWindowsSettings();
		if (cachedSettings.enabled || cachedSettings.windows.length > 0) {
			return cachedSettings;
		}

		return normalizeTimeWindowsSettings();
	}
}

async function saveTimeWindowsSettingsToServer(settings, adminToken) {
	const response = await fetch(buildApiUrl("/admin/time-windows"), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...authHeaders(adminToken),
		},
		body: JSON.stringify({
			timeWindowsSettings: normalizeTimeWindowsSettings(settings),
		}),
	});
	const data = await response.json();

	if (!response.ok || data.success === false) {
		const error = new Error(data.message || "לא ניתן היה לשמור את חלונות הזמן.");
		error.status = response.status;
		throw error;
	}

	const normalizedSettings = normalizeTimeWindowsSettings(data.timeWindowsSettings);
	setStoredTimeWindowsSettings(normalizedSettings);
	return normalizedSettings;
}

function formatTimeWindowLabel(timeWindow) {
	const normalizedWindow = normalizeTimeWindow(timeWindow);
	if (normalizedWindow.label) {
		return normalizedWindow.label;
	}

	if (normalizedWindow.type === TIME_WINDOW_TYPE_LAST_NAME) {
		return formatLastNamesLabel(getTimeWindowLastNames(normalizedWindow));
	}

	return formatChildrenRangeLabel(
		parseOptionalInteger(normalizedWindow.minChildren),
		parseOptionalInteger(normalizedWindow.maxChildren)
	);
}

function formatTimeWindowSchedule(timeWindow) {
	const scheduledTime = normalizeTimeValue(timeWindow?.nextActivationTime);
	return scheduledTime || "טרם הוגדרה שעה";
}

function describeTimeWindowCriteria(timeWindow) {
	const normalizedWindow = normalizeTimeWindow(timeWindow);
	if (normalizedWindow.type === TIME_WINDOW_TYPE_LAST_NAME) {
		const lastNames = getTimeWindowLastNames(normalizedWindow);
		return lastNames.length > 0
			? `שמות משפחה: ${lastNames.join(", ")}`
			: "לא הוגדרו עדיין שמות משפחה לחלון הזה.";
	}

	const minChildren = parseOptionalInteger(normalizedWindow.minChildren);
	const maxChildren = parseOptionalInteger(normalizedWindow.maxChildren);
	if (minChildren === null && maxChildren === null) {
		return "לא הוגדר עדיין טווח ילדים לחלון הזה.";
	}

	return formatChildrenRangeLabel(minChildren, maxChildren);
}

function getCustomerTotalChildren(customer) {
	const totalChildren = parseOptionalInteger(customer?.total_children);
	if (totalChildren !== null) {
		return totalChildren;
	}

	const unmarriedChildren = parseOptionalInteger(customer?.unmarried_children);
	const marriedChildren = parseOptionalInteger(customer?.married_children);
	if (unmarriedChildren === null && marriedChildren === null) {
		return null;
	}

	return (unmarriedChildren || 0) + (marriedChildren || 0);
}

function customerMatchesTimeWindow(customer, timeWindow) {
	if (!customer) {
		return false;
	}

	const normalizedWindow = normalizeTimeWindow(timeWindow);
	if (normalizedWindow.type === TIME_WINDOW_TYPE_LAST_NAME) {
		const customerLastName = normalizeFamilyName(customer.last_name);
		const lastNames = getTimeWindowLastNames(normalizedWindow);
		return Boolean(customerLastName) && lastNames.includes(customerLastName);
	}

	const minChildren = parseOptionalInteger(normalizedWindow.minChildren);
	const maxChildren = parseOptionalInteger(normalizedWindow.maxChildren);
	if (minChildren === null && maxChildren === null) {
		return false;
	}

	const totalChildren = getCustomerTotalChildren(customer);
	if (totalChildren === null) {
		return false;
	}

	if (minChildren !== null && totalChildren < minChildren) {
		return false;
	}

	if (maxChildren !== null && totalChildren > maxChildren) {
		return false;
	}

	return true;
}

function formatBlockedWindowsSummary(windows) {
	return windows
		.map(
			(timeWindow) =>
				`"${formatTimeWindowLabel(timeWindow)}" (${formatTimeWindowSchedule(
					timeWindow
				)})`
		)
		.join(", ");
}

function buildBlockedTimeWindowMessage(decision) {
	const blockedWindows = Array.isArray(decision?.matchingInactiveWindows)
		? decision.matchingInactiveWindows
		: [];

	if (blockedWindows.length === 0) {
		return "";
	}

	if (blockedWindows.length === 1) {
		const [timeWindow] = blockedWindows;
		const scheduledTime = normalizeTimeValue(timeWindow.nextActivationTime);
		return scheduledTime
			? `המשפחה משויכת לחלון הזמן "${formatTimeWindowLabel(
					timeWindow
				)}" והוא מיועד לשעה ${scheduledTime}. כרגע החלון לא פעיל ולכן אי אפשר לסמן קבלה.`
			: `המשפחה משויכת לחלון הזמן "${formatTimeWindowLabel(
					timeWindow
				)}". כרגע החלון לא פעיל וטרם הוגדרה לו שעת הפעלה, ולכן אי אפשר לסמן קבלה.`;
	}

	return `המשפחה משויכת לכמה חלונות זמן שעדיין לא פעילים: ${formatBlockedWindowsSummary(
		blockedWindows
	)}. לכן אי אפשר לסמן קבלה כרגע.`;
}

function evaluateCustomerTimeWindows(
	customer,
	settings = getStoredTimeWindowsSettings()
) {
	const normalizedSettings = normalizeTimeWindowsSettings(settings);
	const matchingWindows = normalizedSettings.windows.filter((timeWindow) =>
		customerMatchesTimeWindow(customer, timeWindow)
	);
	const matchingActiveWindows = matchingWindows.filter(
		(timeWindow) => timeWindow.isActive
	);
	const matchingInactiveWindows = matchingWindows.filter(
		(timeWindow) => !timeWindow.isActive
	);
	const isBlocked =
		Boolean(customer) &&
		normalizedSettings.enabled &&
		matchingActiveWindows.length === 0 &&
		matchingInactiveWindows.length > 0;

	const decision = {
		settings: normalizedSettings,
		matchingWindows,
		matchingActiveWindows,
		matchingInactiveWindows,
		isBlocked,
		primaryWindow:
			matchingActiveWindows[0] || matchingInactiveWindows[0] || null,
		primaryBlockedWindow: matchingInactiveWindows[0] || null,
		blockedMessage: "",
	};

	decision.blockedMessage = isBlocked ? buildBlockedTimeWindowMessage(decision) : "";
	return decision;
}

export {
	TIME_WINDOW_TYPE_CHILDREN,
	TIME_WINDOW_TYPE_LAST_NAME,
	buildEmptyTimeWindow,
	buildBlockedTimeWindowMessage,
	cloneTimeWindowSettings,
	describeTimeWindowCriteria,
	evaluateCustomerTimeWindows,
	fetchTimeWindowsSettingsFromServer,
	formatTimeWindowLabel,
	formatTimeWindowSchedule,
	getStoredTimeWindowsSettings,
	saveTimeWindowsSettingsToServer,
	setStoredTimeWindowsSettings,
};
