import { authHeaders, buildApiUrl } from "./api";

const TIME_WINDOWS_STORAGE_KEY = "kupa.timeWindows.v1";
const JUICE_POPUP_STORAGE_KEY = "kupa.juicePopup.v1";
const TIME_WINDOW_TYPE_CHILDREN = "children";
const TIME_WINDOW_TYPE_LAST_NAME = "lastName";
const TIME_WINDOW_TYPE_LAST_NAME_INITIAL = "lastNameInitial";
const JUICE_POPUP_COUNT_MODE_UNMARRIED = "unmarried";
const JUICE_POPUP_COUNT_MODE_TOTAL = "total";
const DEFAULT_JUICE_POPUP_TITLE = "מגיע מיץ ענבים";
const LEGACY_DEFAULT_JUICE_POPUP_MESSAGE =
	"למשפחה זו יש {count} ילדים לא נשואים. מגיעה זכאות למיץ ענבים.";
const DEFAULT_JUICE_POPUP_MESSAGE =
	"למשפחה זו יש {count} {countLabel}. מגיעה זכאות למיץ ענבים.";
const DEFAULT_MIN_UNMARRIED_CHILDREN = 7;
const HEBREW_LETTER_ORDER = [
	"א",
	"ב",
	"ג",
	"ד",
	"ה",
	"ו",
	"ז",
	"ח",
	"ט",
	"י",
	"כ",
	"ל",
	"מ",
	"נ",
	"ס",
	"ע",
	"פ",
	"צ",
	"ק",
	"ר",
	"ש",
	"ת",
];
const HEBREW_FINAL_LETTER_MAP = {
	"ך": "כ",
	"ם": "מ",
	"ן": "נ",
	"ף": "פ",
	"ץ": "צ",
};

function cleanText(value) {
	return value === undefined || value === null ? "" : String(value).trim();
}

function normalizeFamilyName(value) {
	return cleanText(value).replace(/\s+/g, " ");
}

function normalizeLetterValue(value) {
	const firstCharacter = Array.from(cleanText(value))[0] || "";
	if (!firstCharacter) {
		return "";
	}

	const normalizedCharacter = firstCharacter.normalize("NFKD").replace(/[\u0591-\u05C7]/g, "");
	if (!normalizedCharacter) {
		return "";
	}

	const mappedCharacter =
		HEBREW_FINAL_LETTER_MAP[normalizedCharacter] || normalizedCharacter;
	return /[A-Za-z]/.test(mappedCharacter)
		? mappedCharacter.toUpperCase()
		: mappedCharacter;
}

function getLetterSortValue(letter) {
	const normalizedLetter = normalizeLetterValue(letter);
	if (!normalizedLetter) {
		return null;
	}

	const hebrewLetterIndex = HEBREW_LETTER_ORDER.indexOf(normalizedLetter);
	if (hebrewLetterIndex !== -1) {
		return {
			group: "he",
			index: hebrewLetterIndex,
			value: normalizedLetter,
		};
	}

	return {
		group: "other",
		index: normalizedLetter.codePointAt(0) || 0,
		value: normalizedLetter,
	};
}

function isLetterInRange(letter, startLetter, endLetter) {
	const targetLetter = getLetterSortValue(letter);
	const startLetterSortValue = getLetterSortValue(startLetter);
	const endLetterSortValue = getLetterSortValue(endLetter);
	if (!targetLetter || (!startLetterSortValue && !endLetterSortValue)) {
		return false;
	}

	if (
		startLetterSortValue &&
		targetLetter.group !== startLetterSortValue.group
	) {
		return false;
	}

	if (endLetterSortValue && targetLetter.group !== endLetterSortValue.group) {
		return false;
	}

	if (
		startLetterSortValue &&
		endLetterSortValue &&
		startLetterSortValue.index > endLetterSortValue.index
	) {
		return (
			targetLetter.index >= endLetterSortValue.index &&
			targetLetter.index <= startLetterSortValue.index
		);
	}

	if (startLetterSortValue && targetLetter.index < startLetterSortValue.index) {
		return false;
	}

	if (endLetterSortValue && targetLetter.index > endLetterSortValue.index) {
		return false;
	}

	return true;
}

function getFamilyNameInitial(value) {
	return normalizeLetterValue(Array.from(normalizeFamilyName(value))[0] || "");
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

function formatInitialLettersLabel(startLetter, endLetter) {
	const normalizedStartLetter = normalizeLetterValue(startLetter);
	const normalizedEndLetter = normalizeLetterValue(endLetter);
	if (normalizedStartLetter && normalizedEndLetter) {
		return `משפחות לפי אות ראשונה ${normalizedStartLetter}-${normalizedEndLetter}`;
	}

	if (normalizedStartLetter) {
		return `משפחות מהאות ${normalizedStartLetter}`;
	}

	if (normalizedEndLetter) {
		return `משפחות עד האות ${normalizedEndLetter}`;
	}

	return "חלון לפי אות ראשונה של שם משפחה";
}

function normalizeTimeWindow(inputWindow = {}, fallbackIndex = 0) {
	const type =
		cleanText(inputWindow.type) === TIME_WINDOW_TYPE_LAST_NAME
			? TIME_WINDOW_TYPE_LAST_NAME
			: cleanText(inputWindow.type) === TIME_WINDOW_TYPE_LAST_NAME_INITIAL
				? TIME_WINDOW_TYPE_LAST_NAME_INITIAL
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
		startLetter:
			type === TIME_WINDOW_TYPE_LAST_NAME_INITIAL
				? normalizeLetterValue(inputWindow.startLetter)
				: "",
		endLetter:
			type === TIME_WINDOW_TYPE_LAST_NAME_INITIAL
				? normalizeLetterValue(inputWindow.endLetter)
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

function normalizePositiveInteger(value, fallbackValue) {
	const normalizedValue = cleanText(value);
	if (normalizedValue === "") {
		return fallbackValue;
	}

	const parsedValue = Number.parseInt(normalizedValue, 10);
	return Number.isInteger(parsedValue) && parsedValue >= 0
		? parsedValue
		: fallbackValue;
}

function normalizeJuicePopupCountMode(value) {
	return cleanText(value) === JUICE_POPUP_COUNT_MODE_TOTAL
		? JUICE_POPUP_COUNT_MODE_TOTAL
		: JUICE_POPUP_COUNT_MODE_UNMARRIED;
}

function formatJuicePopupCountLabel(settings = {}) {
	return normalizeJuicePopupCountMode(settings.childCountMode) ===
		JUICE_POPUP_COUNT_MODE_TOTAL
		? "ילדים בסך הכל"
		: "ילדים לא נשואים";
}

function normalizeJuicePopupSettings(inputSettings = {}) {
	const normalizedMessage = cleanText(inputSettings.message);
	return {
		enabled:
			inputSettings.enabled === undefined
				? true
				: Boolean(inputSettings.enabled),
		childCountMode: normalizeJuicePopupCountMode(inputSettings.childCountMode),
		minChildrenThreshold: normalizePositiveInteger(
			inputSettings.minChildrenThreshold ?? inputSettings.minUnmarriedChildren,
			DEFAULT_MIN_UNMARRIED_CHILDREN
		),
		title: cleanText(inputSettings.title) || DEFAULT_JUICE_POPUP_TITLE,
		message:
			!normalizedMessage ||
			normalizedMessage === LEGACY_DEFAULT_JUICE_POPUP_MESSAGE
				? DEFAULT_JUICE_POPUP_MESSAGE
				: normalizedMessage,
	};
}

function normalizeSharedDistributionSettings(inputSettings = {}) {
	if (
		inputSettings &&
		typeof inputSettings === "object" &&
		("timeWindowsSettings" in inputSettings || "juicePopupSettings" in inputSettings)
	) {
		return {
			timeWindowsSettings: normalizeTimeWindowsSettings(
				inputSettings.timeWindowsSettings
			),
			juicePopupSettings: normalizeJuicePopupSettings(
				inputSettings.juicePopupSettings
			),
		};
	}

	return {
		timeWindowsSettings: normalizeTimeWindowsSettings(inputSettings),
		juicePopupSettings: normalizeJuicePopupSettings(),
	};
}

function cloneTimeWindowSettings(settings = {}) {
	return JSON.parse(
		JSON.stringify(normalizeTimeWindowsSettings(settings))
	);
}

function cloneJuicePopupSettings(settings = {}) {
	return JSON.parse(
		JSON.stringify(normalizeJuicePopupSettings(settings))
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
		startLetter: "",
		endLetter: "",
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

function getStoredJuicePopupSettings() {
	if (typeof window === "undefined" || !window.localStorage) {
		return normalizeJuicePopupSettings();
	}

	try {
		const rawValue = window.localStorage.getItem(JUICE_POPUP_STORAGE_KEY);
		if (!rawValue) {
			return normalizeJuicePopupSettings();
		}

		return normalizeJuicePopupSettings(JSON.parse(rawValue));
	} catch {
		return normalizeJuicePopupSettings();
	}
}

function setStoredJuicePopupSettings(settings) {
	if (typeof window === "undefined" || !window.localStorage) {
		return;
	}

	window.localStorage.setItem(
		JUICE_POPUP_STORAGE_KEY,
		JSON.stringify(normalizeJuicePopupSettings(settings))
	);
}

async function fetchDistributionSettingsFromServer() {
	try {
		const response = await fetch(buildApiUrl("/time-windows"));
		const data = await response.json();
		if (!response.ok || data.success === false) {
			throw new Error(data.message || "לא ניתן היה לטעון את חלונות הזמן.");
		}

		const normalizedSettings = normalizeSharedDistributionSettings({
			timeWindowsSettings: data.timeWindowsSettings,
			juicePopupSettings: data.juicePopupSettings,
		});
		setStoredTimeWindowsSettings(normalizedSettings.timeWindowsSettings);
		setStoredJuicePopupSettings(normalizedSettings.juicePopupSettings);
		return normalizedSettings;
	} catch (error) {
		return {
			timeWindowsSettings: getStoredTimeWindowsSettings(),
			juicePopupSettings: getStoredJuicePopupSettings(),
		};
	}
}

async function fetchTimeWindowsSettingsFromServer() {
	const normalizedSettings = await fetchDistributionSettingsFromServer();
	return normalizedSettings.timeWindowsSettings;
}

async function fetchJuicePopupSettingsFromServer() {
	const normalizedSettings = await fetchDistributionSettingsFromServer();
	return normalizedSettings.juicePopupSettings;
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

	const normalizedSettings = normalizeTimeWindowsSettings(
		data.timeWindowsSettings
	);
	setStoredTimeWindowsSettings(normalizedSettings);
	return normalizedSettings;
}

async function saveJuicePopupSettingsToServer(settings, adminToken) {
	const response = await fetch(buildApiUrl("/admin/juice-popup-settings"), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...authHeaders(adminToken),
		},
		body: JSON.stringify({
			juicePopupSettings: normalizeJuicePopupSettings(settings),
		}),
	});
	const data = await response.json();

	if (!response.ok || data.success === false) {
		const error = new Error(data.message || "לא ניתן היה לשמור את הגדרת הפופאפ.");
		error.status = response.status;
		throw error;
	}

	const normalizedSettings = normalizeJuicePopupSettings(
		data.juicePopupSettings
		);
	setStoredJuicePopupSettings(normalizedSettings);
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

	if (normalizedWindow.type === TIME_WINDOW_TYPE_LAST_NAME_INITIAL) {
		return formatInitialLettersLabel(
			normalizedWindow.startLetter,
			normalizedWindow.endLetter
		);
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

	if (normalizedWindow.type === TIME_WINDOW_TYPE_LAST_NAME_INITIAL) {
		const normalizedStartLetter = normalizeLetterValue(normalizedWindow.startLetter);
		const normalizedEndLetter = normalizeLetterValue(normalizedWindow.endLetter);
		if (!normalizedStartLetter && !normalizedEndLetter) {
			return "לא הוגדר עדיין טווח אותיות לחלון הזה.";
		}

		if (normalizedStartLetter && normalizedEndLetter) {
			return `אות ראשונה של שם המשפחה בין ${normalizedStartLetter} ל-${normalizedEndLetter}.`;
		}

		if (normalizedStartLetter) {
			return `אות ראשונה של שם המשפחה החל מ-${normalizedStartLetter}.`;
		}

		return `אות ראשונה של שם המשפחה עד ${normalizedEndLetter}.`;
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

function getCustomerUnmarriedChildren(customer) {
	return parseOptionalInteger(customer?.unmarried_children);
}

function getJuicePopupCustomerCount(customer, settings = getStoredJuicePopupSettings()) {
	const normalizedSettings = normalizeJuicePopupSettings(settings);
	return normalizedSettings.childCountMode === JUICE_POPUP_COUNT_MODE_TOTAL
		? getCustomerTotalChildren(customer)
		: getCustomerUnmarriedChildren(customer);
}

function resolveJuicePopupText(template, customer, settings) {
	const normalizedTemplate = cleanText(template);
	const normalizedSettings = normalizeJuicePopupSettings(settings);
	const count = getJuicePopupCustomerCount(customer, normalizedSettings);
	const replacements = {
		"{count}": count === null ? "-" : String(count),
		"{threshold}": String(normalizedSettings.minChildrenThreshold),
		"{lastName}": cleanText(customer?.last_name) || "-",
		"{countLabel}": formatJuicePopupCountLabel(normalizedSettings),
	};

	return Object.entries(replacements).reduce(
		(resultText, [token, value]) =>
			resultText.split(token).join(value),
		normalizedTemplate
	);
}

function shouldShowJuicePopup(customer, settings = getStoredJuicePopupSettings()) {
	const normalizedSettings = normalizeJuicePopupSettings(settings);
	const customerCount = getJuicePopupCustomerCount(customer, normalizedSettings);
	return (
		normalizedSettings.enabled &&
		customerCount !== null &&
		customerCount >= normalizedSettings.minChildrenThreshold
	);
}

function buildJuicePopupContent(customer, settings = getStoredJuicePopupSettings()) {
	const normalizedSettings = normalizeJuicePopupSettings(settings);
	return {
		title: resolveJuicePopupText(normalizedSettings.title, customer, normalizedSettings),
		message: resolveJuicePopupText(
			normalizedSettings.message,
			customer,
			normalizedSettings
		),
	};
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

	if (normalizedWindow.type === TIME_WINDOW_TYPE_LAST_NAME_INITIAL) {
		const customerInitial = getFamilyNameInitial(customer.last_name);
		return isLetterInRange(
			customerInitial,
			normalizedWindow.startLetter,
			normalizedWindow.endLetter
		);
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
		matchingInactiveWindows.length > 0;
	const primaryBlockedWindow = matchingInactiveWindows[0] || null;
	const primaryWindow = isBlocked
		? primaryBlockedWindow
		: matchingActiveWindows[0] || primaryBlockedWindow || null;

	const decision = {
		settings: normalizedSettings,
		matchingWindows,
		matchingActiveWindows,
		matchingInactiveWindows,
		isBlocked,
		primaryWindow,
		primaryBlockedWindow,
		blockedMessage: "",
	};

	decision.blockedMessage = isBlocked ? buildBlockedTimeWindowMessage(decision) : "";
	return decision;
}

export {
	JUICE_POPUP_COUNT_MODE_TOTAL,
	JUICE_POPUP_COUNT_MODE_UNMARRIED,
	TIME_WINDOW_TYPE_CHILDREN,
	TIME_WINDOW_TYPE_LAST_NAME,
	TIME_WINDOW_TYPE_LAST_NAME_INITIAL,
	buildJuicePopupContent,
	buildEmptyTimeWindow,
	buildBlockedTimeWindowMessage,
	cloneJuicePopupSettings,
	cloneTimeWindowSettings,
	describeTimeWindowCriteria,
	evaluateCustomerTimeWindows,
	fetchDistributionSettingsFromServer,
	fetchJuicePopupSettingsFromServer,
	fetchTimeWindowsSettingsFromServer,
	formatJuicePopupCountLabel,
	formatTimeWindowLabel,
	formatTimeWindowSchedule,
	getStoredJuicePopupSettings,
	getStoredTimeWindowsSettings,
	saveJuicePopupSettingsToServer,
	saveTimeWindowsSettingsToServer,
	setStoredJuicePopupSettings,
	setStoredTimeWindowsSettings,
	shouldShowJuicePopup,
};
