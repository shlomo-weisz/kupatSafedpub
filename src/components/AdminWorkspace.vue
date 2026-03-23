<template>
	<div class="admin-page" dir="rtl">
		<section class="hero-card">
			<p class="eyebrow">ניהול שרת ומסד נתונים</p>
			<h1>ניהול טבלאות וטעינת קבצים</h1>
			<p class="hero-copy">
				יצירת סטים חדשים של טבלאות, בחירת הסט הפעיל לשרת, טעינת CSV או XLSX
				עם מיפוי עמודות, ושליחת דוחות.
			</p>
		</section>

		<section v-if="!isAuthenticated" class="auth-card">
			<h2>כניסת מנהל</h2>
			<input
				v-model="adminPassword"
				type="password"
				placeholder="סיסמת מנהל"
				@keyup.enter="authenticate"
			/>
			<button @click="authenticate">התחבר</button>
			<p v-if="authError" class="status error">{{ authError }}</p>
		</section>

		<div v-else class="workspace">
			<section class="card status-card">
				<div class="card-header">
					<h2>הסט הפעיל</h2>
					<div class="header-actions">
						<button class="secondary" @click="goHome">חזרה למסך הראשי</button>
						<button class="secondary" @click="refreshData">רענן</button>
						<button class="secondary" @click="logout">התנתק</button>
					</div>
				</div>

				<div v-if="activeTableSet">
					<p class="active-name">{{ activeTableSet.displayName }}</p>
					<ul class="table-meta">
						<li>ראשי: {{ activeTableSet.mainTable }}</li>
						<li>עדכון: {{ activeTableSet.updateTable }}</li>
						<li>המתנה: {{ activeTableSet.waitTable }}</li>
					</ul>
					<div class="active-actions">
						<button
							class="secondary"
							:disabled="mergeWaitIntoMainLoading"
							@click="mergeWaitIntoMain"
						>
							{{
								mergeWaitIntoMainLoading
									? "מעביר רשימת המתנה..."
									: "העבר רשימת המתנה לראשית"
							}}
						</button>
					</div>
					<p class="hint">
						הפעולה תעביר את כל הרשומות מטבלת ההמתנה של הסט הפעיל לטבלה
						הראשית, ואז תרוקן את טבלת ההמתנה.
					</p>
				</div>
			</section>

			<section class="card">
				<h2>יצירת סט טבלאות חדש</h2>
				<div class="form-grid">
					<div>
						<label for="displayName">שם תצוגה</label>
						<input
							id="displayName"
							v-model.trim="newTableSet.displayName"
							type="text"
							placeholder="חלוקת פסח 2026"
						/>
					</div>
					<div>
						<label for="baseName">שם טכני</label>
						<input
							id="baseName"
							v-model.trim="newTableSet.baseName"
							type="text"
							placeholder="pesach2026"
						/>
					</div>
				</div>
				<p class="hint">המערכת תיצור אוטומטית `base`, `base_update`, `base_wait`.</p>
				<button @click="createSet">צור סט חדש</button>
			</section>

			<section class="card">
				<h2>סטים קיימים</h2>
				<div v-if="tableSets.length === 0" class="empty-state">
					עדיין אין סטים להצגה.
				</div>
				<div v-else class="table-set-list">
					<div
						v-for="tableSet in tableSets"
						:key="tableSet.baseName"
						:class="['table-set-row', { active: tableSet.isActive }]"
					>
						<div>
							<p class="set-title">{{ tableSet.displayName }}</p>
							<p class="set-subtitle">{{ tableSet.baseName }}</p>
						</div>
						<button
							:disabled="tableSet.isActive"
							class="secondary"
							@click="activateSet(tableSet.baseName)"
						>
							{{ tableSet.isActive ? "פעיל עכשיו" : "הפעל" }}
						</button>
					</div>
				</div>
			</section>

			<section class="card import-card">
				<h2>טעינת קובץ לטבלה</h2>
				<div class="form-grid">
					<div>
						<label for="importBaseName">סט טבלאות</label>
						<select
							id="importBaseName"
							v-model="importForm.baseName"
							@change="handleImportPresetScopeChange"
						>
							<option
								v-for="tableSet in tableSets"
								:key="tableSet.baseName"
								:value="tableSet.baseName"
							>
								{{ tableSet.displayName }}
							</option>
						</select>
					</div>
					<div>
						<label for="importType">סוג טבלה</label>
						<select
							id="importType"
							v-model="importForm.tableType"
							@change="handleImportPresetScopeChange"
						>
							<option value="main">ראשית</option>
							<option value="update">עדכון</option>
							<option value="wait">המתנה</option>
						</select>
					</div>
					<div>
						<label for="importMode">מצב טעינה</label>
						<select id="importMode" v-model="importForm.mode">
							<option value="replace">החלפה מלאה</option>
							<option value="append">הוספה לסוף</option>
						</select>
					</div>
				</div>

				<div class="preset-panel">
					<h3>טעינות שמורות</h3>
					<p class="hint">
						אפשר לשמור את המיפוי הנוכחי כתבנית קבועה, ולהחליט אם הוא יהיה
						זמין רק לסט הנוכחי או לכל הסטים, כולל סטים עתידיים.
					</p>
					<div class="form-grid preset-grid">
						<div>
							<label for="savedPreset">טעינה שמורה</label>
							<select
								id="savedPreset"
								v-model="selectedImportPresetId"
								@change="handlePresetSelectionChange"
							>
								<option value="">טעינה ידנית</option>
								<option
									v-for="preset in filteredImportPresets"
									:key="preset.id"
									:value="String(preset.id)"
								>
									{{ formatImportPresetLabel(preset) }}
								</option>
							</select>
						</div>
						<div>
							<label for="presetScope">זמינות הטעינה</label>
							<select id="presetScope" v-model="presetForm.scope">
								<option value="global">כל הסטים, כולל עתידיים</option>
								<option value="tableSet">רק הסט הנוכחי</option>
							</select>
						</div>
						<div>
							<label for="presetName">שם לטעינה השמורה</label>
							<input
								id="presetName"
								v-model.trim="presetForm.presetName"
								type="text"
								placeholder="לדוגמה: קובץ חלוקה רגיל"
							/>
						</div>
					</div>
					<label class="checkbox-row">
						<input v-model="presetForm.isDefault" type="checkbox" />
						<span>
							{{
								presetForm.scope === "global"
									? "שמור כברירת מחדל לכל הסטים הנוכחיים והעתידיים עבור סוג הטבלה הזה"
									: "שמור כברירת מחדל עבור הסט והטבלה הנוכחיים"
							}}
						</span>
					</label>
					<div class="preset-actions">
						<button class="secondary" @click="saveCurrentImportPreset">
							שמור טעינה נוכחית
						</button>
						<button
							class="secondary"
							:disabled="!selectedImportPresetId"
							@click="deleteSelectedImportPreset"
						>
							מחק טעינה שמורה
						</button>
					</div>
					<p v-if="defaultImportPreset" class="hint preset-summary">
						ברירת המחדל הנוכחית: <strong>{{ defaultImportPreset.presetName }}</strong>
						({{ getPresetScopeLabel(defaultImportPreset) }})
					</p>
					<p v-else class="hint preset-summary">
						עדיין לא הוגדרה טעינת ברירת מחדל עבור הסט והטבלה האלו או לכל
						הסטים.
					</p>
				</div>

				<input
					type="file"
					accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
					@change="handleFileSelection"
				/>
				<p v-if="selectedFileName" class="hint">
					קובץ נבחר: <strong>{{ selectedFileName }}</strong>
				</p>
				<p v-if="selectedWorksheetName" class="hint">
					{{ selectedWorksheetNames.length > 1 ? "גיליונות שנבחרו" : "גיליון שנבחר" }}:
					<strong>{{ selectedWorksheetName }}</strong>
				</p>
				<div
					v-if="isSpreadsheetFile && worksheetOptions.length > 0"
					class="worksheet-selector"
				>
					<p class="hint">
						אפשר לבחור גיליון אחד או כמה גיליונות. התצוגה המקדימה והמיפוי
						מבוססים על הגיליון הראשון מבין הנבחרים, אבל הייבוא ירוץ על כל
						הגיליונות שסומנו.
					</p>
					<div class="worksheet-list">
						<label
							v-for="worksheet in worksheetOptions"
							:key="worksheet.name"
							class="worksheet-option"
						>
							<input
								type="checkbox"
								:checked="selectedWorksheetNames.includes(worksheet.name)"
								@change="
									toggleWorksheetSelection(
										worksheet.name,
										$event.target.checked
									)
								"
							/>
							<span class="worksheet-name">{{ worksheet.name }}</span>
							<span class="worksheet-meta">
								{{ worksheet.nonEmptyRows }} שורות, {{ worksheet.columnCount }}
								עמודות
							</span>
						</label>
					</div>
				</div>

				<div v-if="csvRows.length > 0" class="file-mode-card">
					<label for="headerMode">מבנה הקובץ</label>
					<select
						id="headerMode"
						:value="hasHeaderRow ? 'withHeaders' : 'withoutHeaders'"
						@change="handleHeaderModeChange($event.target.value)"
					>
						<option value="withHeaders">יש שורת כותרות</option>
						<option value="withoutHeaders">
							אין כותרות, הנתונים מתחילים מהשורה הראשונה
						</option>
					</select>
					<p class="hint">
						בחר את האפשרות המתאימה לקובץ לפני המיפוי. במצב בלי כותרות, המיפוי
						יהיה לפי מספר העמודה בקובץ.
					</p>
				</div>

				<div v-if="previewRows.length > 0" class="header-row-picker">
					<p v-if="hasHeaderRow" class="hint">
						בחר איזו שורה בקובץ היא שורת הכותרות. אם המערכת זיהתה שורה לא
						נכונה, אפשר להחליף כאן.
					</p>
					<p v-else class="hint">
						הקובץ מסומן כקובץ ללא כותרות. השורה הראשונה תיטען כנתונים,
						והמיפוי יתבצע לפי מספרי עמודות.
					</p>
					<div class="preview-list">
						<div
							v-for="previewRow in previewRows"
							:key="`preview-${previewRow.index}`"
							:class="[
								'preview-row',
								{ selected: hasHeaderRow && previewRow.index === headerRowIndex },
							]"
						>
							<div class="preview-row-header">
								<div>
									<p class="preview-row-title">שורה {{ previewRow.index + 1 }}</p>
									<p v-if="hasHeaderRow" class="preview-row-subtitle">
										{{
											previewRow.index === headerRowIndex
												? "נבחרה כרגע כשורת הכותרות"
												: "אפשר לבחור את השורה הזו כשורת הכותרות"
										}}
									</p>
									<p v-else class="preview-row-subtitle">
										תצוגה מקדימה של נתוני הקובץ
									</p>
								</div>
								<button
									v-if="hasHeaderRow"
									class="secondary small"
									:disabled="previewRow.index === headerRowIndex"
									@click="selectHeaderRow(previewRow.index)"
								>
									{{
										previewRow.index === headerRowIndex
											? "נבחרה"
											: "השתמש בשורה זו"
									}}
								</button>
							</div>
							<div class="header-chip-list">
								<span
									v-for="cell in previewRow.cells"
									:key="`${previewRow.index}-${cell.index}`"
									class="header-chip preview-chip"
								>
									{{ cell.label }}
								</span>
							</div>
						</div>
					</div>
				</div>

				<div v-if="csvColumns.length > 0" class="csv-summary">
					<p v-if="hasHeaderRow" class="hint">
						נבחרה שורה {{ headerRowIndex + 1 }} כשורת הכותרות. זוהו
						{{ csvColumns.length }} עמודות מקור בקובץ, וכרגע ממופות
						{{ mappedColumnsCount }} עמודות למסד.
					</p>
					<p v-else class="hint">
						הקובץ נטען בלי כותרות. זוהו {{ csvColumns.length }} עמודות מקור,
						והשורה הראשונה תיטען כנתונים. כרגע ממופות {{ mappedColumnsCount }}
						עמודות למסד.
					</p>
					<div class="header-chip-list">
						<span
							v-for="csvColumn in csvColumns"
							:key="csvColumn.key"
							class="header-chip"
						>
							{{ csvColumn.label }}
						</span>
					</div>
				</div>

				<div v-if="csvColumns.length > 0" class="mapping-actions">
					<button
						v-if="hasHeaderRow"
						class="secondary"
						@click="autoMapColumns"
					>
						מיפוי אוטומטי
					</button>
					<button class="secondary" @click="clearColumnMapping">נקה מיפוי</button>
				</div>

				<div v-if="csvColumns.length > 0" class="mapping-grid">
					<div
						v-for="column in importColumnsMeta"
						:key="column.key"
						class="mapping-row"
					>
						<div class="mapping-column">
							<p class="mapping-label">{{ column.label }}</p>
							<p class="mapping-key">{{ column.key }}</p>
						</div>
						<div class="mapping-select">
							<select
								:id="`map-${column.key}`"
								v-model="columnMapping[column.key]"
							>
								<option value="">לא לטעון מהקובץ</option>
								<option
									v-for="csvColumn in csvColumns"
									:key="`${column.key}-${csvColumn.key}`"
									:value="csvColumn.key"
								>
									{{ csvColumn.label }}
								</option>
							</select>
							<p class="mapping-state">
								{{
									columnMapping[column.key]
										? `ייטען מהעמודה: ${getSourceColumnLabel(columnMapping[column.key])}`
										: "לא ייטען מהקובץ"
								}}
							</p>
						</div>
					</div>
				</div>

				<div v-if="unusedCsvColumns.length > 0" class="unused-columns">
					<p class="hint">עמודות מקור מהקובץ שלא בשימוש כרגע:</p>
					<div class="header-chip-list">
						<span
							v-for="csvColumn in unusedCsvColumns"
							:key="`unused-${csvColumn.key}`"
							class="header-chip unused"
						>
							{{ csvColumn.label }}
						</span>
					</div>
				</div>

				<button @click="importCsv">טען קובץ</button>
			</section>

			<section class="card">
				<h2>שליחת דוחות</h2>
				<div class="report-settings">
					<label for="reportRecipients">מיילים לקבלת דוחות</label>
					<textarea
						id="reportRecipients"
						v-model="reportRecipientsText"
						rows="5"
						placeholder="כתובת אחת בכל שורה או רשימה מופרדת בפסיקים"
					/>
					<p class="hint">
						אפשר לכתוב כתובת אחת בכל שורה או להדביק רשימה עם פסיקים. שמירה
						של שדה ריק תעצור שליחת דוחות במייל.
					</p>
					<p v-if="reportRecipientsSource === 'file'" class="hint">
						הרשימה הנוכחית נטענה מקובץ ישן בשרת. שמירה כאן תעביר את הניהול
						למערכת.
					</p>
					<div v-if="reportRecipientHistory.length > 0" class="recipient-history">
						<p class="hint">היסטוריית כתובות לשימוש מהיר:</p>
						<div class="header-chip-list">
							<button
								v-for="email in reportRecipientHistory"
								:key="`recipient-${email}`"
								type="button"
								:class="[
									'header-chip',
									'recipient-chip',
									{ selected: currentReportRecipients.includes(email) },
								]"
								@click="toggleReportRecipientFromHistory(email)"
							>
								{{ email }}
							</button>
						</div>
					</div>
					<div class="preset-actions">
						<button
							class="secondary"
							:disabled="saveReportRecipientsLoading"
							@click="saveReportRecipients"
						>
							{{
								saveReportRecipientsLoading
									? "שומר רשימת נמענים..."
									: "שמור מקבלי דוחות"
							}}
						</button>
					</div>
				</div>
				<div class="report-grid">
					<button @click="sendReport('all')">כל המקבלים</button>
					<button @click="sendReport('received')">כבר לקחו</button>
					<button @click="sendReport('notReceived')">עדיין לא לקחו</button>
					<button @click="sendReport('update')">מאגר רישום לעדכון</button>
					<button @click="sendReport('phones')">טלפונים שלא לקחו</button>
					<button @click="sendReport('waites')">רשימת המתנה</button>
					<button @click="sendReport('phonesW')">טלפונים רשימת המתנה</button>
				</div>
			</section>

			<section class="card">
				<h2>סיסמת משתמשים רגילים</h2>
				<div class="password-settings">
					<p class="hint">
						כאן אפשר לעדכן את הסיסמה המשותפת לכל המשתמשים הרגילים. השמירה
						מחליפה את הסיסמה הנוכחית ומנקה רשומות ישנות או כפולות מטבלת
						ההרשאות.
					</p>
					<div class="form-grid">
						<div>
							<label for="usersPassword">סיסמה חדשה</label>
							<input
								id="usersPassword"
								v-model="usersPasswordForm.password"
								type="password"
								autocomplete="new-password"
								placeholder="הזיני סיסמה חדשה"
							/>
						</div>
						<div>
							<label for="usersPasswordConfirm">אימות סיסמה</label>
							<input
								id="usersPasswordConfirm"
								v-model="usersPasswordForm.confirmPassword"
								type="password"
								autocomplete="new-password"
								placeholder="הזיני שוב את הסיסמה"
							/>
						</div>
					</div>
					<div class="preset-actions">
						<button
							class="secondary"
							:disabled="saveUsersPasswordLoading"
							@click="saveUsersPassword"
						>
							{{
								saveUsersPasswordLoading
									? "שומר סיסמת משתמשים..."
									: "עדכן סיסמת משתמשים"
							}}
						</button>
					</div>
				</div>
			</section>

			<section class="card">
				<h2>חלונות זמן למסירה</h2>
				<div class="time-window-settings">
					<p class="hint">
						כאן אפשר להגדיר חלונות זמן לפי מספר ילדים או לפי שם משפחה,
						ולבחור אילו חלונות פעילים כרגע. ההגדרות נשמרות בשרת לכל
						המשתמשים, בלי לשנות את טבלאות הלקוחות הרגילות.
					</p>
					<label class="checkbox-row">
						<input v-model="timeWindowSettingsForm.enabled" type="checkbox" />
						<span>הפעל בדיקת חלונות זמן במסכי החיפוש והצילום</span>
					</label>
					<div class="time-window-summary">
						<p class="hint">
							{{
								timeWindowSettingsForm.enabled
									? "האכיפה פעילה כרגע לכל המשתמשים."
									: "האכיפה כבויה כרגע לכל המשתמשים, וכל חלונות הזמן ייחשבו כלא מגבילים."
							}}
						</p>
						<p v-if="activeTimeWindowLabels.length > 0" class="hint">
							חלונות פעילים עכשיו:
							<strong>{{ activeTimeWindowLabels.join(" | ") }}</strong>
						</p>
						<p v-else class="hint">כרגע לא סומן אף חלון כפעיל.</p>
						<p v-if="scheduledTimeWindowLabels.length > 0" class="hint">
							חלונות בהמתנה:
							<strong>{{ scheduledTimeWindowLabels.join(" | ") }}</strong>
						</p>
					</div>
					<div class="preset-actions">
						<button class="secondary" @click="addChildrenTimeWindow">
							הוסף חלון לפי ילדים
						</button>
						<button class="secondary" @click="addLastNameTimeWindow">
							הוסף חלון לפי שם משפחה
						</button>
						<button class="secondary" @click="loadTimeWindowSettings">
							טען הגדרות שמורות
						</button>
						<button @click="saveTimeWindowSettings">שמור חלונות זמן</button>
					</div>
					<div
						v-if="timeWindowSettingsForm.windows.length === 0"
						class="empty-state"
					>
						עדיין לא הוגדרו חלונות זמן.
					</div>
					<div v-else class="time-window-list">
						<section
							v-for="(timeWindow, index) in timeWindowSettingsForm.windows"
							:key="timeWindow.id"
							class="time-window-item"
						>
							<div class="time-window-item-header">
								<div>
									<h3>
										{{ timeWindow.label || `חלון זמן ${index + 1}` }}
									</h3>
									<p class="hint">{{ describeTimeWindowCriteria(timeWindow) }}</p>
								</div>
								<button
									class="secondary small"
									@click="removeTimeWindow(timeWindow.id)"
								>
									מחק
								</button>
							</div>
							<div class="form-grid">
								<div>
									<label :for="`time-window-label-${timeWindow.id}`">
										שם חלון
									</label>
									<input
										:id="`time-window-label-${timeWindow.id}`"
										v-model.trim="timeWindow.label"
										type="text"
										placeholder="לדוגמה: משפחות גדולות"
									/>
								</div>
								<div>
									<label :for="`time-window-type-${timeWindow.id}`">
										סוג חלון
									</label>
									<select
										:id="`time-window-type-${timeWindow.id}`"
										:value="timeWindow.type"
										@change="
											handleTimeWindowTypeChange(
												index,
												$event.target.value
											)
										"
									>
										<option :value="TIME_WINDOW_TYPE_CHILDREN">
											לפי מספר ילדים
										</option>
										<option :value="TIME_WINDOW_TYPE_LAST_NAME">
											לפי שם משפחה
										</option>
									</select>
								</div>
								<div>
									<label :for="`time-window-next-${timeWindow.id}`">
										שעת הפעלה מיועדת
									</label>
									<input
										:id="`time-window-next-${timeWindow.id}`"
										v-model="timeWindow.nextActivationTime"
										type="time"
									/>
								</div>
							</div>
							<label class="checkbox-row">
								<input v-model="timeWindow.isActive" type="checkbox" />
								<span>חלון זה פעיל עכשיו</span>
							</label>
							<div
								v-if="timeWindow.type === TIME_WINDOW_TYPE_CHILDREN"
								class="form-grid"
							>
								<div>
									<label :for="`time-window-min-${timeWindow.id}`">
										ממספר ילדים
									</label>
									<input
										:id="`time-window-min-${timeWindow.id}`"
										v-model="timeWindow.minChildren"
										type="number"
										min="0"
										placeholder="ללא מינימום"
									/>
								</div>
								<div>
									<label :for="`time-window-max-${timeWindow.id}`">
										עד מספר ילדים
									</label>
									<input
										:id="`time-window-max-${timeWindow.id}`"
										v-model="timeWindow.maxChildren"
										type="number"
										min="0"
										placeholder="ללא מקסימום"
									/>
								</div>
							</div>
							<div v-else class="time-window-last-names">
								<label :for="`time-window-names-${timeWindow.id}`">
									שמות משפחה
								</label>
								<textarea
									:id="`time-window-names-${timeWindow.id}`"
									v-model="timeWindow.lastNamesText"
									rows="4"
									placeholder="כהן&#10;לוי&#10;חדד"
								/>
								<p class="hint">
									אפשר לכתוב שם אחד בכל שורה או להפריד בפסיקים.
								</p>
							</div>
							<p class="hint">
								שעת היעד שתוצג למשתמש: <strong>{{
									formatTimeWindowSchedule(timeWindow)
								}}</strong>
							</p>
						</section>
					</div>
				</div>
			</section>

			<section class="card">
				<h2>OCR לזיהוי תמונה</h2>
				<div class="ocr-settings">
					<p class="hint">
						כאן אפשר לבחור אם מסך הצילום ישתמש בכתובת ה-OCR כמו שהיא, או
						שייכפה שליחה דרך Google Vision.
					</p>
					<div class="form-grid">
						<div>
							<label for="ocrProvider">ספק OCR למסך הצילום</label>
							<select id="ocrProvider" v-model="ocrProvider">
								<option value="default">ברירת מחדל מה-URL</option>
								<option value="google_vision">Google Vision</option>
							</select>
						</div>
					</div>
					<p class="hint">
						בבחירה של Google Vision המערכת תוסיף לכתובת הזיהוי את
						<code>ocr_provider=google_vision</code>.
					</p>
					<p v-if="effectiveOcrApiUrlPreview" class="hint ocr-url-preview">
						כתובת הזיהוי בפועל:
						<strong>{{ effectiveOcrApiUrlPreview }}</strong>
					</p>
					<p v-else class="hint">
						עדיין לא הוגדרה כתובת OCR ב־<code>VUE_APP_OCR_API_URL</code>.
					</p>
					<div class="preset-actions">
						<button class="secondary" @click="saveOcrProviderPreference">
							שמור הגדרת OCR
						</button>
					</div>
				</div>
			</section>

			<p v-if="statusMessage" :class="['status', statusType]">
				{{ statusMessage }}
			</p>
		</div>
	</div>
</template>

<script>
import {
	OCR_API_URL,
	OCR_PROVIDER_GOOGLE_VISION,
	authHeaders,
	buildApiUrl,
	buildConfiguredOcrApiUrl,
	clearStoredToken,
	getStoredOcrProvider,
	getStoredToken,
	loginWithRole,
	setStoredOcrProvider,
} from "../utils/api";
import {
	TIME_WINDOW_TYPE_CHILDREN,
	TIME_WINDOW_TYPE_LAST_NAME,
	buildEmptyTimeWindow,
	cloneTimeWindowSettings,
	describeTimeWindowCriteria,
	fetchTimeWindowsSettingsFromServer,
	formatTimeWindowLabel,
	formatTimeWindowSchedule,
	getStoredTimeWindowsSettings,
	saveTimeWindowsSettingsToServer,
	setStoredTimeWindowsSettings,
} from "../utils/timeWindows";

function cleanText(value) {
	return value === undefined || value === null ? "" : String(value).trim();
}

function parseRecipientsText(value) {
	return Array.from(
		new Set(
			String(value || "")
				.split(/[\n,;]+/)
				.map((recipient) => cleanText(recipient).toLowerCase())
				.filter(Boolean)
		)
	);
}

function normalizeHeaderKey(value) {
	return cleanText(value)
		.replace(/^\uFEFF/, "")
		.toLowerCase()
		.replace(/\s+/g, "_");
}

function formatSourceColumnLabel(header, index) {
	const normalizedHeader = cleanText(
		index === 0 ? String(header || "").replace(/^\uFEFF/, "") : header
	);

	return normalizedHeader || `עמודה ${index + 1} ללא כותרת`;
}

function buildCsvColumnsFromHeaders(headers) {
	return headers.map((header, index) => ({
		key: `col_${index}`,
		index,
		header: cleanText(
			index === 0 ? String(header || "").replace(/^\uFEFF/, "") : header
		),
		label: formatSourceColumnLabel(header, index),
	}));
}

function buildCsvColumnsFromLength(columnCount) {
	return Array.from({ length: columnCount }, (_, index) => ({
		key: `col_${index}`,
		index,
		header: "",
		label: `עמודה ${index + 1}`,
	}));
}

function countNonEmptyCells(row) {
	return row.filter((value) => cleanText(value) !== "").length;
}

function findMaxColumnCount(rows) {
	return rows.reduce(
		(maxColumnCount, row) => Math.max(maxColumnCount, row.length),
		0
	);
}

function getFileExtension(fileName) {
	const normalizedFileName = cleanText(fileName).toLowerCase();
	const lastDotIndex = normalizedFileName.lastIndexOf(".");

	return lastDotIndex === -1 ? "" : normalizedFileName.slice(lastDotIndex);
}

function readFileAsBase64(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = String(reader.result || "");
			const commaIndex = result.indexOf(",");
			resolve(commaIndex === -1 ? result : result.slice(commaIndex + 1));
		};
		reader.onerror = () => {
			reject(reader.error || new Error("לא ניתן היה לקרוא את הקובץ."));
		};
		reader.readAsDataURL(file);
	});
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
	name: "AdminWorkspace",
	data() {
		return {
			adminPassword: "",
			authError: "",
			isAuthenticated: false,
			tableSets: [],
			activeTableSet: null,
			importPresets: [],
			selectedImportPresetId: "",
			importColumnsMeta: [],
			selectedFileName: "",
			selectedWorksheetName: "",
			selectedWorksheetNames: [],
			selectedFileType: "",
			worksheetOptions: [],
			importSessionId: "",
			csvText: "",
			csvRows: [],
			hasHeaderRow: true,
			headerRowIndex: -1,
			csvColumns: [],
			columnMapping: {},
			newTableSet: {
				displayName: "",
				baseName: "",
			},
			presetForm: {
				presetName: "",
				isDefault: false,
				scope: "global",
			},
			importForm: {
				baseName: "",
				tableType: "main",
				mode: "replace",
			},
			statusMessage: "",
			statusType: "success",
			mergeWaitIntoMainLoading: false,
			reportRecipientsText: "",
			reportRecipientsSource: "none",
			reportRecipientHistory: [],
			saveReportRecipientsLoading: false,
			ocrProvider: getStoredOcrProvider(),
			usersPasswordForm: {
				password: "",
				confirmPassword: "",
			},
			saveUsersPasswordLoading: false,
			TIME_WINDOW_TYPE_CHILDREN,
			TIME_WINDOW_TYPE_LAST_NAME,
			timeWindowSettingsForm: cloneTimeWindowSettings(
				getStoredTimeWindowsSettings()
			),
		};
	},
	computed: {
		isSpreadsheetFile() {
			return this.selectedFileType === ".xlsx";
		},
		mappedColumnsCount() {
			return Object.values(this.columnMapping).filter(Boolean).length;
		},
		filteredImportPresets() {
			const currentBaseName = cleanText(this.importForm.baseName);
			return [...this.importPresets]
				.filter(
					(preset) =>
						preset.tableType === this.importForm.tableType &&
						(preset.scope === "global" || preset.baseName === currentBaseName)
				)
				.sort((leftPreset, rightPreset) => {
					const getScopeRank = (preset) =>
						preset.baseName === currentBaseName ? 0 : preset.scope === "global" ? 1 : 2;
					const defaultRankDifference =
						Number(rightPreset.isDefault) - Number(leftPreset.isDefault);
					if (defaultRankDifference !== 0) {
						return defaultRankDifference;
					}

					const scopeRankDifference =
						getScopeRank(leftPreset) - getScopeRank(rightPreset);
					if (scopeRankDifference !== 0) {
						return scopeRankDifference;
					}

					const updatedAtDifference =
						(Date.parse(rightPreset.updatedAt || "") || 0) -
						(Date.parse(leftPreset.updatedAt || "") || 0);
					if (updatedAtDifference !== 0) {
						return updatedAtDifference;
					}

					return leftPreset.presetName.localeCompare(rightPreset.presetName, "he");
				});
		},
		defaultImportPreset() {
			return (
				this.filteredImportPresets.find(
					(preset) =>
						preset.isDefault && preset.baseName === this.importForm.baseName
				) ||
				this.filteredImportPresets.find(
					(preset) => preset.isDefault && preset.scope === "global"
				) ||
				null
			);
		},
		selectedImportPreset() {
			return (
				this.filteredImportPresets.find(
					(preset) => String(preset.id) === this.selectedImportPresetId
				) || null
			);
		},
		unusedCsvColumns() {
			const usedSourceKeys = new Set(
				Object.values(this.columnMapping).filter(Boolean)
			);
			return this.csvColumns.filter(
				(csvColumn) => !usedSourceKeys.has(csvColumn.key)
			);
		},
		currentReportRecipients() {
			return parseRecipientsText(this.reportRecipientsText);
		},
		effectiveOcrApiUrlPreview() {
			return buildConfiguredOcrApiUrl(OCR_API_URL, this.ocrProvider);
		},
		activeTimeWindowLabels() {
			return this.timeWindowSettingsForm.windows
				.filter((timeWindow) => timeWindow.isActive)
				.map((timeWindow) => formatTimeWindowLabel(timeWindow));
		},
		scheduledTimeWindowLabels() {
			return this.timeWindowSettingsForm.windows
				.filter((timeWindow) => !timeWindow.isActive)
				.map(
					(timeWindow) =>
						`${formatTimeWindowLabel(timeWindow)} - ${formatTimeWindowSchedule(
							timeWindow
						)}`
				);
		},
		previewRows() {
			return this.csvRows
				.map((row, index) => ({
					index,
					nonEmptyCells: countNonEmptyCells(row),
					cells: row.slice(0, 12).map((value, cellIndex) => ({
						index: cellIndex,
						label: cleanText(value) || `עמודה ${cellIndex + 1} ריקה`,
					})),
				}))
				.filter((row) => row.nonEmptyCells > 0)
				.slice(0, 6);
		},
	},
	async mounted() {
		this.loadTimeWindowSettings();
		this.isAuthenticated = Boolean(getStoredToken("admin"));
		if (this.isAuthenticated) {
			await this.refreshData();
		}
	},
	methods: {
		setStatus(message, type = "success") {
			this.statusMessage = message;
			this.statusType = type;
		},
		describeTimeWindowCriteria,
		formatTimeWindowSchedule,
		getAdminToken() {
			return getStoredToken("admin");
		},
		async loadTimeWindowSettings() {
			const timeWindowsSettings = await fetchTimeWindowsSettingsFromServer();
			this.timeWindowSettingsForm = cloneTimeWindowSettings(
				timeWindowsSettings || getStoredTimeWindowsSettings()
			);
		},
		addTimeWindow(type) {
			this.timeWindowSettingsForm.windows.push(buildEmptyTimeWindow(type));
		},
		addChildrenTimeWindow() {
			this.addTimeWindow(TIME_WINDOW_TYPE_CHILDREN);
		},
		addLastNameTimeWindow() {
			this.addTimeWindow(TIME_WINDOW_TYPE_LAST_NAME);
		},
		handleTimeWindowTypeChange(index, nextType) {
			const currentWindow = this.timeWindowSettingsForm.windows[index];
			if (!currentWindow) {
				return;
			}

			this.timeWindowSettingsForm.windows.splice(index, 1, {
				...buildEmptyTimeWindow(nextType),
				id: currentWindow.id,
				label: currentWindow.label,
				isActive: currentWindow.isActive,
				nextActivationTime: currentWindow.nextActivationTime,
			});
		},
		removeTimeWindow(timeWindowId) {
			this.timeWindowSettingsForm.windows = this.timeWindowSettingsForm.windows.filter(
				(timeWindow) => timeWindow.id !== timeWindowId
			);
		},
		async saveTimeWindowSettings() {
			try {
				const normalizedSettings = await saveTimeWindowsSettingsToServer(
					this.timeWindowSettingsForm,
					this.getAdminToken()
				);
				this.timeWindowSettingsForm = cloneTimeWindowSettings(normalizedSettings);
				this.setStatus(
					normalizedSettings.enabled
						? "חלונות הזמן נשמרו בשרת וייכנסו לפעולה לכל המשתמשים."
						: "חלונות הזמן נשמרו בשרת, אבל האכיפה כבויה כרגע לכל המשתמשים."
				);
			} catch (error) {
				this.setStatus(error.message, "error");
				if (error.status === 401 || error.status === 403) {
					this.logout();
				}
			}
		},
		getSourceColumnLabel(sourceKey) {
			const sourceColumn = this.csvColumns.find(
				(csvColumn) => csvColumn.key === sourceKey
			);
			return sourceColumn ? sourceColumn.label : sourceKey;
		},
		getPresetScopeLabel(preset) {
			if (!preset) {
				return "";
			}

			if (preset.scope === "global") {
				return "כל הסטים";
			}

			const relatedTableSet = this.tableSets.find(
				(tableSet) => tableSet.baseName === preset.baseName
			);
			return relatedTableSet
				? `רק ${relatedTableSet.displayName}`
				: `רק ${preset.baseName}`;
		},
		formatImportPresetLabel(preset) {
			const suffix = preset.isDefault ? "ברירת מחדל" : "שמורה";
			const scopeLabel = this.getPresetScopeLabel(preset);
			return `${preset.presetName} (${suffix}, ${scopeLabel})`;
		},
		syncPresetFormFromSelection() {
			if (!this.selectedImportPreset) {
				this.presetForm = {
					presetName: "",
					isDefault: false,
					scope: "global",
				};
				return;
			}

			this.presetForm = {
				presetName: this.selectedImportPreset.presetName,
				isDefault: this.selectedImportPreset.isDefault,
				scope: this.selectedImportPreset.scope || "tableSet",
			};
		},
		buildColumnMappingForCurrentFile(savedColumnMapping) {
			const availableSourceKeys = new Set(
				this.csvColumns.map((csvColumn) => csvColumn.key)
			);
			const skippedFields = [];
			const nextColumnMapping = this.importColumnsMeta.reduce((mapping, column) => {
				const mappedSource = cleanText(savedColumnMapping?.[column.key]);
				if (mappedSource !== "" && availableSourceKeys.has(mappedSource)) {
					mapping[column.key] = mappedSource;
				} else {
					mapping[column.key] = "";
					if (mappedSource !== "") {
						skippedFields.push(column.label || column.key);
					}
				}
				return mapping;
			}, {});

			return { nextColumnMapping, skippedFields };
		},
		applyImportPreset(preset, options = {}) {
			if (!preset) {
				return false;
			}

			if (this.csvRows.length === 0) {
				if (!options.suppressStatus) {
					this.setStatus("יש להעלות קובץ לפני החלת טעינה שמורה.", "error");
				}
				return false;
			}

			this.importForm.mode = preset.mode;
			this.hasHeaderRow = Boolean(preset.hasHeaderRow);

			if (this.hasHeaderRow) {
				const fallbackHeaderRowIndex = this.findInitialHeaderRow(this.csvRows);
				const nextHeaderRowIndex =
					Number.isInteger(preset.headerRowIndex) &&
					preset.headerRowIndex >= 0 &&
					preset.headerRowIndex < this.csvRows.length
						? preset.headerRowIndex
						: fallbackHeaderRowIndex;

				if (nextHeaderRowIndex === -1) {
					if (!options.suppressStatus) {
						this.setStatus("לא נמצאה שורת כותרות תקינה בקובץ.", "error");
					}
					return false;
				}

				this.headerRowIndex = nextHeaderRowIndex;
				this.csvColumns = buildCsvColumnsFromHeaders(
					this.csvRows[this.headerRowIndex]
				);
			} else {
				const sourceColumnCount = findMaxColumnCount(this.csvRows);
				if (sourceColumnCount === 0) {
					if (!options.suppressStatus) {
						this.setStatus("לא זוהו עמודות בקובץ.", "error");
					}
					return false;
				}

				this.headerRowIndex = -1;
				this.csvColumns = buildCsvColumnsFromLength(sourceColumnCount);
			}

			const { nextColumnMapping, skippedFields } =
				this.buildColumnMappingForCurrentFile(preset.columnMapping);
			this.columnMapping = nextColumnMapping;
			this.selectedImportPresetId = String(preset.id);
			this.syncPresetFormFromSelection();

			if (!options.suppressStatus) {
				if (skippedFields.length > 0) {
					this.setStatus(
						`הטעינה השמורה "${preset.presetName}" הוחלה, אבל חלק מהעמודות לא נמצאו בקובץ הנוכחי: ${skippedFields.join(
							", "
						)}.`,
						"error"
					);
				} else {
					this.setStatus(`הטעינה השמורה "${preset.presetName}" הוחלה.`);
				}
			}

			return true;
		},
		applyPreferredImportPresetAfterFileLoad() {
			const presetToApply = this.selectedImportPreset || this.defaultImportPreset;
			if (!presetToApply) {
				return null;
			}

			const applied = this.applyImportPreset(presetToApply, { suppressStatus: true });
			return applied ? presetToApply : null;
		},
		handlePresetSelectionChange() {
			this.syncPresetFormFromSelection();
			if (this.selectedImportPreset && this.csvRows.length > 0) {
				this.applyImportPreset(this.selectedImportPreset);
			}
		},
		handleImportPresetScopeChange() {
			if (
				this.selectedImportPresetId &&
				!this.filteredImportPresets.some(
					(preset) => String(preset.id) === this.selectedImportPresetId
				)
			) {
				this.selectedImportPresetId = "";
			}

			this.syncPresetFormFromSelection();
		},
		async applyWorksheetPreviewResult(previewResult, options = {}) {
			const parsedRows = previewResult?.rows || [];
			const initialHeaderRowIndex = this.findInitialHeaderRow(parsedRows);

			if (parsedRows.length > 0 && initialHeaderRowIndex === -1) {
				throw new Error("לא זוהתה אף שורה תקינה בקובץ.");
			}

			this.csvRows = parsedRows;
			this.selectedWorksheetNames = previewResult?.selectedWorksheetNames || [];
			this.selectedWorksheetName =
				previewResult?.worksheetNamesLabel || previewResult?.worksheetName || "";
			this.worksheetOptions = previewResult?.worksheetOptions || [];

			if (options.resetHeaderMode) {
				this.hasHeaderRow = true;
			}

			const preferredPreset = this.selectedImportPreset || this.defaultImportPreset;
			if (preferredPreset) {
				const applied = this.applyImportPreset(preferredPreset, {
					suppressStatus: true,
				});
				if (applied) {
					return preferredPreset;
				}
			}

			this.applyImportStructureFromMode({
				headerRowIndex:
					this.hasHeaderRow &&
					Number.isInteger(this.headerRowIndex) &&
					this.headerRowIndex >= 0 &&
					this.headerRowIndex < parsedRows.length
						? this.headerRowIndex
						: initialHeaderRowIndex,
				suppressStatus: true,
			});
			return null;
		},
		async toggleWorksheetSelection(worksheetName, isSelected) {
			if (!this.importSessionId || !this.isSpreadsheetFile) {
				return;
			}

			const nextSelectedWorksheetNames = isSelected
				? Array.from(new Set([...this.selectedWorksheetNames, worksheetName]))
				: this.selectedWorksheetNames.filter((name) => name !== worksheetName);

			if (nextSelectedWorksheetNames.length === 0) {
				this.setStatus("יש לבחור לפחות גיליון אחד לטעינה.", "error");
				return;
			}

			try {
				const response = await fetch(buildApiUrl("/admin/import-file/preview"), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...authHeaders(this.getAdminToken()),
					},
					body: JSON.stringify({
						importSessionId: this.importSessionId,
						selectedWorksheetNames: nextSelectedWorksheetNames,
					}),
				});
				const data = await readJsonResponse(response);
				const appliedPreset = await this.applyWorksheetPreviewResult(data.result);
				const selectionLabel =
					data.result?.worksheetNamesLabel ||
					(data.result?.selectedWorksheetNames || []).join(", ");
				this.setStatus(
					`התצוגה עודכנה עבור ${
						nextSelectedWorksheetNames.length > 1 ? "הגיליונות" : "הגיליון"
					} ${selectionLabel}.${appliedPreset ? ` הוחלה אוטומטית הטעינה השמורה "${appliedPreset.presetName}".` : ""}`
				);
			} catch (error) {
				this.setStatus(error.message, "error");
				if (error.status === 401 || error.status === 403) {
					this.logout();
				}
			}
		},
		goHome() {
			this.$router.push("/");
		},
		resetImportSelection() {
			this.selectedFileName = "";
			this.selectedWorksheetName = "";
			this.selectedWorksheetNames = [];
			this.selectedFileType = "";
			this.worksheetOptions = [];
			this.importSessionId = "";
			this.csvText = "";
			this.csvRows = [];
			this.hasHeaderRow = true;
			this.headerRowIndex = -1;
			this.csvColumns = [];
			this.columnMapping = this.importColumnsMeta.reduce((mapping, column) => {
				mapping[column.key] = "";
				return mapping;
			}, {});
		},
		applyImportStructureFromMode(options = {}) {
			if (this.csvRows.length === 0) {
				this.headerRowIndex = -1;
				this.csvColumns = [];
				this.clearColumnMapping({ suppressStatus: true });
				return;
			}

			if (this.hasHeaderRow) {
				const nextHeaderRowIndex =
					Number.isInteger(options.headerRowIndex) && options.headerRowIndex >= 0
						? options.headerRowIndex
						: this.findInitialHeaderRow(this.csvRows);
				if (nextHeaderRowIndex === -1) {
					throw new Error("לא זוהתה שורת כותרות בקובץ.");
				}

				this.selectHeaderRow(nextHeaderRowIndex, {
					suppressStatus: options.suppressStatus,
				});
				return;
			}

			const sourceColumnCount = findMaxColumnCount(this.csvRows);
			if (sourceColumnCount === 0) {
				throw new Error("לא זוהו עמודות בקובץ.");
			}

			this.headerRowIndex = -1;
			this.csvColumns = buildCsvColumnsFromLength(sourceColumnCount);
			this.clearColumnMapping({ suppressStatus: true });

			if (!options.suppressStatus) {
				this.setStatus(
					`הקובץ מסומן כקובץ ללא כותרות. השורה הראשונה תיטען כנתונים, ואפשר למפות ידנית את עמודות המקור.`
				);
			}
		},
		findInitialHeaderRow(rows) {
			const rowWithManyValues = rows.findIndex(
				(row) => countNonEmptyCells(row) >= 2
			);
			if (rowWithManyValues !== -1) {
				return rowWithManyValues;
			}

			return rows.findIndex((row) => countNonEmptyCells(row) > 0);
		},
		buildAutomaticColumnMapping() {
			const normalizedHeaderMap = new Map();

			for (const csvColumn of this.csvColumns) {
				const normalizedHeader = normalizeHeaderKey(csvColumn.header);
				if (normalizedHeader && !normalizedHeaderMap.has(normalizedHeader)) {
					normalizedHeaderMap.set(normalizedHeader, csvColumn.key);
				}
			}

			this.columnMapping = this.importColumnsMeta.reduce((mapping, column) => {
				mapping[column.key] =
					normalizedHeaderMap.get(normalizeHeaderKey(column.key)) || "";
				return mapping;
			}, {});
		},
		autoMapColumns() {
			if (this.csvColumns.length === 0) {
				this.setStatus("יש לבחור קובץ לפני המיפוי.", "error");
				return;
			}
			if (!this.hasHeaderRow) {
				this.setStatus(
					"מיפוי אוטומטי זמין רק לקובץ עם כותרות. בקובץ בלי כותרות יש לבחור ידנית את העמודות.",
					"error"
				);
				return;
			}

			this.buildAutomaticColumnMapping();
			this.selectedImportPresetId = "";
			this.setStatus("המיפוי האוטומטי עודכן.");
		},
		clearColumnMapping(options = {}) {
			this.columnMapping = this.importColumnsMeta.reduce((mapping, column) => {
				mapping[column.key] = "";
				return mapping;
			}, {});
			this.selectedImportPresetId = "";
			if (!options.suppressStatus) {
				this.setStatus("המיפוי נוקה. אפשר לבחור ידנית אילו עמודות לטעון.");
			}
		},
		handleHeaderModeChange(nextMode) {
			this.hasHeaderRow = nextMode !== "withoutHeaders";
			if (this.csvRows.length === 0) {
				return;
			}

			try {
				this.applyImportStructureFromMode();
			} catch (error) {
				this.setStatus(error.message, "error");
			}
		},
		selectHeaderRow(rowIndex, options = {}) {
			const row = this.csvRows[rowIndex];
			if (!row) {
				this.setStatus("שורת הכותרות שנבחרה אינה קיימת בקובץ.", "error");
				return;
			}

			this.headerRowIndex = rowIndex;
			this.csvColumns = buildCsvColumnsFromHeaders(row);
			this.buildAutomaticColumnMapping();

			if (!options.suppressStatus) {
				this.setStatus(
					`שורה ${rowIndex + 1} נבחרה כשורת הכותרות. אפשר עכשיו למפות כל עמודת מקור לשדה במסד.`
				);
			}
		},
		async authenticate() {
			try {
				await loginWithRole("admin", this.adminPassword);
				this.authError = "";
				this.isAuthenticated = true;
				this.adminPassword = "";
				await this.refreshData();
				this.setStatus("התחברת בהצלחה.");
			} catch (error) {
				this.authError = "סיסמת המנהל שגויה או שהשרת לא זמין.";
			}
		},
		async refreshData() {
			try {
				const response = await fetch(buildApiUrl("/admin/table-sets"), {
					headers: {
						...authHeaders(this.getAdminToken()),
					},
				});
				const data = await readJsonResponse(response);
				this.tableSets = data.tableSets;
				this.activeTableSet = data.activeTableSet;
				this.importPresets = data.importPresets || [];
				this.reportRecipientsText = (data.reportRecipients || []).join("\n");
				this.reportRecipientsSource = data.reportRecipientsSource || "none";
				this.reportRecipientHistory = data.reportRecipientHistory || [];
				setStoredTimeWindowsSettings(data.timeWindowsSettings || {});
				this.timeWindowSettingsForm = cloneTimeWindowSettings(
					data.timeWindowsSettings || getStoredTimeWindowsSettings()
				);
				this.importColumnsMeta =
					data.importColumnsMeta ||
					(data.importColumns || []).map((column) => ({
						key: column,
						label: column,
					}));
				if (!this.importForm.baseName && data.activeTableSet) {
					this.importForm.baseName = data.activeTableSet.baseName;
				}
				if (this.csvColumns.length === 0) {
					this.resetImportSelection();
				} else {
					const currentMapping = {};
					for (const column of this.importColumnsMeta) {
						currentMapping[column.key] = this.columnMapping[column.key] || "";
					}
					this.columnMapping = currentMapping;
				}
				if (
					this.selectedImportPresetId &&
					!this.importPresets.some(
						(preset) => String(preset.id) === this.selectedImportPresetId
					)
				) {
					this.selectedImportPresetId = "";
				}
				this.syncPresetFormFromSelection();
			} catch (error) {
				this.setStatus(error.message, "error");
				if (error.status === 401 || error.status === 403) {
					this.logout();
				}
			}
		},
		async createSet() {
			if (!this.newTableSet.baseName) {
				this.setStatus("יש להזין שם טכני לסט החדש.", "error");
				return;
			}

			try {
				const response = await fetch(buildApiUrl("/admin/table-sets"), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...authHeaders(this.getAdminToken()),
					},
					body: JSON.stringify(this.newTableSet),
				});
				const data = await readJsonResponse(response);
				this.newTableSet.displayName = "";
				this.newTableSet.baseName = "";
				await this.refreshData();
				this.importForm.baseName = data.tableSet.baseName;
				this.setStatus(data.message);
			} catch (error) {
				this.setStatus(error.message, "error");
			}
		},
		async activateSet(baseName) {
			try {
				const response = await fetch(buildApiUrl("/admin/table-sets/activate"), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...authHeaders(this.getAdminToken()),
					},
					body: JSON.stringify({ baseName }),
				});
				const data = await readJsonResponse(response);
				await this.refreshData();
				this.importForm.baseName = baseName;
				this.setStatus(data.message);
			} catch (error) {
				this.setStatus(error.message, "error");
			}
		},
		toggleReportRecipientFromHistory(email) {
			const normalizedEmail = cleanText(email).toLowerCase();
			if (!normalizedEmail) {
				return;
			}

			const nextRecipients = this.currentReportRecipients.includes(normalizedEmail)
				? this.currentReportRecipients.filter((recipient) => recipient !== normalizedEmail)
				: [...this.currentReportRecipients, normalizedEmail];

			this.reportRecipientsText = nextRecipients.join("\n");
		},
		async saveReportRecipients() {
			this.saveReportRecipientsLoading = true;
			try {
				const response = await fetch(buildApiUrl("/admin/report-recipients"), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...authHeaders(this.getAdminToken()),
					},
					body: JSON.stringify({
						reportRecipientsText: this.reportRecipientsText,
					}),
				});
				const data = await readJsonResponse(response);
				this.reportRecipientsText = (data.reportRecipients || []).join("\n");
				this.reportRecipientsSource = data.reportRecipientsSource || "settings";
				this.reportRecipientHistory = data.reportRecipientHistory || [];
				this.setStatus(
					`${data.message}. ${
						(data.reportRecipients || []).length > 0
							? `הוגדרו ${(data.reportRecipients || []).length} כתובות.`
							: "כרגע אין כתובות מוגדרות."
					}`
				);
			} catch (error) {
				this.setStatus(error.message, "error");
				if (error.status === 401 || error.status === 403) {
					this.logout();
				}
			} finally {
				this.saveReportRecipientsLoading = false;
			}
		},
		async saveUsersPassword() {
			const nextPassword = String(this.usersPasswordForm.password || "");
			const confirmedPassword = String(this.usersPasswordForm.confirmPassword || "");
			if (nextPassword.trim() === "") {
				this.setStatus("יש להזין סיסמה חדשה למשתמשים הרגילים.", "error");
				return;
			}
			if (nextPassword !== confirmedPassword) {
				this.setStatus("אימות הסיסמה לא תואם לסיסמה החדשה.", "error");
				return;
			}
			if (
				!window.confirm(
					"האם לעדכן עכשיו את הסיסמה המשותפת לכל המשתמשים הרגילים?"
				)
			) {
				return;
			}

			this.saveUsersPasswordLoading = true;
			try {
				const response = await fetch(buildApiUrl("/admin/passwords/users"), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...authHeaders(this.getAdminToken()),
					},
					body: JSON.stringify({
						password: nextPassword,
					}),
				});
				const data = await readJsonResponse(response);
				this.usersPasswordForm.password = "";
				this.usersPasswordForm.confirmPassword = "";
				this.setStatus(data.message);
			} catch (error) {
				this.setStatus(error.message, "error");
				if (error.status === 401 || error.status === 403) {
					this.logout();
				}
			} finally {
				this.saveUsersPasswordLoading = false;
			}
		},
		saveOcrProviderPreference() {
			setStoredOcrProvider(this.ocrProvider);
			this.setStatus(
				this.ocrProvider === OCR_PROVIDER_GOOGLE_VISION
					? "הגדרת ה-OCR נשמרה. מסך הצילום יוסיף לכתובת הזיהוי את ocr_provider=google_vision."
					: "הגדרת ה-OCR נשמרה. מסך הצילום יחזור להשתמש בכתובת הזיהוי כפי שהוגדרה."
			);
		},
		async mergeWaitIntoMain() {
			if (!this.activeTableSet?.baseName) {
				this.setStatus("לא נמצא סט פעיל להעברה.", "error");
				return;
			}

			if (
				!window.confirm(
					`להעביר את כל רשימת ההמתנה של "${this.activeTableSet.displayName}" לטבלה הראשית? הפעולה גם תרוקן את טבלת ההמתנה.`
				)
			) {
				return;
			}

			this.mergeWaitIntoMainLoading = true;
			try {
				const response = await fetch(
					buildApiUrl("/admin/table-sets/merge-wait-into-main"),
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							...authHeaders(this.getAdminToken()),
						},
						body: JSON.stringify({
							baseName: this.activeTableSet.baseName,
						}),
					}
				);
				const data = await readJsonResponse(response);
				await this.refreshData();
				this.setStatus(
					`${data.message}. הועברו ${data.result?.movedRows || 0} רשומות מהמתנה לראשית.`
				);
			} catch (error) {
				this.setStatus(error.message, "error");
				if (error.status === 401 || error.status === 403) {
					this.logout();
				}
			} finally {
				this.mergeWaitIntoMainLoading = false;
			}
		},
		async saveCurrentImportPreset() {
			if (!this.importForm.baseName) {
				this.setStatus("יש לבחור סט טבלאות לפני שמירת טעינה.", "error");
				return;
			}
			if (this.csvColumns.length === 0) {
				this.setStatus(
					"יש לטעון קובץ ולבנות את המיפוי לפני שמירת טעינה שמורה.",
					"error"
				);
				return;
			}

			try {
				const response = await fetch(buildApiUrl("/admin/import-presets"), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...authHeaders(this.getAdminToken()),
					},
					body: JSON.stringify({
						presetName: this.presetForm.presetName,
						baseName: this.importForm.baseName,
						scope: this.presetForm.scope,
						tableType: this.importForm.tableType,
						mode: this.importForm.mode,
						hasHeaderRow: this.hasHeaderRow,
						headerRowIndex: this.hasHeaderRow ? this.headerRowIndex : null,
						columnMapping: this.columnMapping,
						isDefault: this.presetForm.isDefault,
					}),
				});
				const data = await readJsonResponse(response);
				await this.refreshData();
				this.selectedImportPresetId = String(data.importPreset.id);
				this.syncPresetFormFromSelection();
				this.setStatus(data.message);
			} catch (error) {
				this.setStatus(error.message, "error");
			}
		},
		async deleteSelectedImportPreset() {
			if (!this.selectedImportPreset) {
				this.setStatus("יש לבחור טעינה שמורה למחיקה.", "error");
				return;
			}

			if (
				!window.confirm(
					`למחוק את הטעינה השמורה "${this.selectedImportPreset.presetName}"?`
				)
			) {
				return;
			}

			try {
				const response = await fetch(
					buildApiUrl(`/admin/import-presets/${this.selectedImportPreset.id}`),
					{
						method: "DELETE",
						headers: {
							...authHeaders(this.getAdminToken()),
						},
					}
				);
				const data = await readJsonResponse(response);
				this.selectedImportPresetId = "";
				await this.refreshData();
				this.setStatus(data.message);
			} catch (error) {
				this.setStatus(error.message, "error");
			}
		},
		async handleFileSelection(event) {
			const [file] = event.target.files || [];
			if (!file) {
				this.resetImportSelection();
				return;
			}

			try {
				this.selectedFileName = file.name;
				this.selectedWorksheetName = "";
				this.selectedWorksheetNames = [];
				this.selectedFileType = getFileExtension(file.name);
				this.worksheetOptions = [];

				if (![".csv", ".xlsx"].includes(this.selectedFileType)) {
					throw new Error("נתמכים כרגע רק קבצי CSV ו-XLSX.");
				}

				const fileContentBase64 = await readFileAsBase64(file);
				const response = await fetch(buildApiUrl("/admin/import-file/inspect"), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...authHeaders(this.getAdminToken()),
					},
					body: JSON.stringify({
						fileName: file.name,
						fileContentBase64,
					}),
				});
				const data = await readJsonResponse(response);
				this.importSessionId = data.result?.importSessionId || "";
				this.csvText = "";
				const appliedPreset = await this.applyWorksheetPreviewResult(data.result, {
					resetHeaderMode: true,
				});
				this.setStatus(
					`${this.selectedFileType === ".xlsx" ? `קובץ Excel נותח בהצלחה${this.selectedWorksheetName ? ` מה${this.selectedWorksheetNames.length > 1 ? "גיליונות" : "גיליון"} ${this.selectedWorksheetName}` : ""}` : `קובץ CSV נותח בהצלחה`}.${appliedPreset ? ` הוחלה אוטומטית הטעינה השמורה "${appliedPreset.presetName}".` : " אם לקובץ אין כותרות, החלף למצב המתאים ומפה לפי מספרי עמודות."}`
				);
			} catch (error) {
				this.resetImportSelection();
				this.setStatus(error.message || "לא ניתן היה לקרוא את הקובץ.", "error");
				if (error.status === 401 || error.status === 403) {
					this.logout();
				}
			}
		},
		async importCsv() {
			if (!this.importForm.baseName) {
				this.setStatus("יש לבחור סט טבלאות לטעינה.", "error");
				return;
			}
			if (
				this.csvRows.length === 0 ||
				this.csvColumns.length === 0 ||
				(this.hasHeaderRow && this.headerRowIndex < 0)
			) {
				this.setStatus("יש לבחור קובץ תקין לפני הטעינה.", "error");
				return;
			}

			try {
				const response = await fetch(buildApiUrl("/admin/import-csv"), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...authHeaders(this.getAdminToken()),
					},
					body: JSON.stringify({
						...this.importForm,
						importSessionId: this.importSessionId,
						selectedWorksheetNames: this.selectedWorksheetNames,
						hasHeaderRow: this.hasHeaderRow,
						columnMapping: this.columnMapping,
						headerRowIndex: this.headerRowIndex,
					}),
				});
				const data = await readJsonResponse(response);
				this.resetImportSelection();
				await this.refreshData();
				this.setStatus(
					`${data.message}. נטענו ${data.result.importedRows} שורות לטבלת ${data.result.tableName}.`
				);
			} catch (error) {
				this.setStatus(error.message, "error");
			}
		},
		async sendReport(type) {
			try {
				const response = await fetch(buildApiUrl("/report"), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...authHeaders(this.getAdminToken()),
					},
					body: JSON.stringify({ type }),
				});
				const data = await readJsonResponse(response);
				this.setStatus(data.message);
			} catch (error) {
				this.setStatus(error.message, "error");
			}
		},
		logout() {
			clearStoredToken("admin");
			this.isAuthenticated = false;
			this.tableSets = [];
			this.activeTableSet = null;
			this.importPresets = [];
			this.selectedImportPresetId = "";
			this.importColumnsMeta = [];
			this.reportRecipientsText = "";
			this.reportRecipientsSource = "none";
			this.reportRecipientHistory = [];
			this.saveReportRecipientsLoading = false;
			this.usersPasswordForm = {
				password: "",
				confirmPassword: "",
			};
			this.saveUsersPasswordLoading = false;
			this.presetForm = {
				presetName: "",
				isDefault: false,
				scope: "global",
			};
			this.loadTimeWindowSettings();
			this.resetImportSelection();
			this.statusMessage = "";
		},
	},
};
</script>

<style scoped>
.admin-page {
	max-width: 1320px;
	margin: 0 auto;
	padding: clamp(24px, 4vw, 44px) 18px 48px;
	color: var(--color-primary);
}

.hero-card,
.auth-card,
.card {
	background: var(--color-surface);
	border: 1px solid var(--color-border);
	border-radius: 28px;
	box-shadow: var(--shadow-medium);
	backdrop-filter: blur(18px);
}

.hero-card {
	padding: clamp(24px, 4vw, 36px);
	margin-bottom: 24px;
	background:
		linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 247, 235, 0.88));
}

.eyebrow {
	margin: 0 0 10px;
	color: var(--color-accent);
	font-weight: 800;
	letter-spacing: 0.12em;
}

.hero-card h1 {
	margin: 0 0 12px;
	font-size: clamp(2.1rem, 4vw, 3.2rem);
	line-height: 1.08;
	color: var(--color-primary);
}

.hero-copy {
	margin: 0;
	max-width: 780px;
	line-height: 1.8;
	color: var(--color-text-muted);
}

.auth-card {
	max-width: 460px;
	margin: 0 auto;
	padding: 30px;
	text-align: right;
}

.workspace {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
	gap: 22px;
	align-items: start;
}

.card {
	padding: 24px;
	display: grid;
	gap: 16px;
}

.status-card,
.import-card {
	grid-column: 1 / -1;
}

.card h2,
.auth-card h2 {
	margin: 0;
	font-size: 28px;
	color: var(--color-primary);
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
}

.header-actions {
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
}

.active-name {
	font-size: 28px;
	font-weight: 800;
	margin: 4px 0 0;
}

.active-actions {
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
	margin: 8px 0 0;
}

.table-meta {
	margin: 0;
	padding-right: 18px;
	line-height: 1.8;
	color: var(--color-text-muted);
}

.form-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 16px;
}

label {
	display: block;
	margin-bottom: 6px;
	font-weight: 800;
	color: var(--color-primary);
}

input:not([type="checkbox"]),
select,
textarea {
	width: 100%;
	box-sizing: border-box;
	padding: 14px 16px;
	border-radius: 16px;
	font-size: 15px;
}

textarea {
	resize: vertical;
	min-height: 120px;
}

button {
	border: none;
	border-radius: var(--radius-pill);
	background: linear-gradient(135deg, var(--color-primary), #21493f);
	color: #fffaf1;
	padding: 13px 18px;
	font-size: 15px;
	font-weight: 800;
	cursor: pointer;
}

button.secondary {
	background: rgba(255, 255, 255, 0.78);
	color: var(--color-primary);
	border: 1px solid var(--color-border-strong);
}

button.small {
	padding: 10px 14px;
	font-size: 13px;
}

button:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.hint {
	color: var(--color-text-muted);
	line-height: 1.6;
	margin: 0;
}

.preset-panel {
	padding: 18px;
	border-radius: 22px;
	background: rgba(255, 248, 236, 0.72);
	border: 1px solid rgba(24, 53, 46, 0.08);
}

.preset-panel h3 {
	margin: 0 0 8px;
	color: var(--color-primary);
}

.preset-grid {
	margin-top: 14px;
}

.checkbox-row {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-top: 12px;
	font-weight: bold;
}

.checkbox-row input {
	width: auto;
	margin: 0;
}

.preset-actions {
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
}

.preset-summary {
	margin-bottom: 0;
}

.time-window-settings {
	display: grid;
	gap: 16px;
}

.time-window-summary {
	display: grid;
	gap: 8px;
}

.time-window-list {
	display: grid;
	gap: 14px;
}

.time-window-item {
	display: grid;
	gap: 14px;
	padding: 18px;
	border-radius: 22px;
	background: rgba(255, 248, 236, 0.72);
	border: 1px solid rgba(24, 53, 46, 0.08);
}

.time-window-item-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 12px;
}

.time-window-item-header h3 {
	margin: 0 0 6px;
	color: var(--color-primary);
}

.time-window-last-names {
	display: grid;
	gap: 8px;
}

.ocr-url-preview {
	word-break: break-word;
}

.recipient-history {
	margin: 14px 0;
}

.table-set-list {
	display: grid;
	gap: 12px;
}

.table-set-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 14px 16px;
	border-radius: 20px;
	background: rgba(255, 247, 232, 0.68);
	border: 1px solid rgba(24, 53, 46, 0.08);
}

.table-set-row.active {
	background: rgba(47, 125, 89, 0.14);
	border-color: rgba(47, 125, 89, 0.22);
}

.set-title,
.set-subtitle {
	margin: 0;
}

.set-title {
	font-weight: 800;
}

.set-subtitle {
	color: var(--color-text-muted);
}

.header-row-picker,
.file-mode-card,
.csv-summary,
.unused-columns,
.worksheet-selector {
	margin-top: 18px;
	padding: 18px;
	border-radius: 22px;
	background: rgba(255, 255, 255, 0.52);
	border: 1px solid rgba(24, 53, 46, 0.08);
}

.worksheet-list {
	display: grid;
	gap: 10px;
	margin-top: 12px;
}

.worksheet-option {
	display: grid;
	grid-template-columns: auto 1fr auto;
	align-items: center;
	gap: 12px;
	padding: 12px 14px;
	border-radius: 18px;
	background: rgba(255, 255, 255, 0.72);
	border: 1px solid rgba(24, 53, 46, 0.08);
}

.worksheet-option input {
	width: auto;
	margin: 0;
}

.worksheet-name {
	font-weight: 800;
	color: var(--color-primary);
}

.worksheet-meta {
	font-size: 13px;
	color: var(--color-text-muted);
}

.preview-list {
	display: grid;
	gap: 12px;
	margin-top: 12px;
}

.preview-row {
	padding: 16px;
	border-radius: 20px;
	background: rgba(255, 248, 236, 0.72);
	border: 1px solid rgba(24, 53, 46, 0.08);
}

.preview-row.selected {
	background: rgba(47, 125, 89, 0.14);
	border-color: rgba(47, 125, 89, 0.2);
}

.preview-row-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	margin-bottom: 12px;
}

.preview-row-title,
.preview-row-subtitle {
	margin: 0;
}

.preview-row-title {
	font-weight: bold;
}

.preview-row-subtitle {
	color: var(--color-text-muted);
	font-size: 13px;
}

.header-chip-list {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-top: 10px;
}

.header-chip {
	padding: 8px 12px;
	border-radius: var(--radius-pill);
	background: rgba(24, 53, 46, 0.08);
	color: var(--color-primary);
	font-size: 13px;
	border: 1px solid rgba(24, 53, 46, 0.06);
}

.header-chip.preview-chip {
	max-width: 220px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.header-chip.unused {
	background: rgba(182, 79, 71, 0.14);
	color: #7a2418;
}

.recipient-chip {
	border: 1px solid rgba(24, 53, 46, 0.12);
	cursor: pointer;
}

.recipient-chip.selected {
	background: rgba(47, 125, 89, 0.14);
	border-color: rgba(47, 125, 89, 0.22);
}

.mapping-actions {
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
	margin: 18px 0;
}

.mapping-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
	gap: 14px;
}

.mapping-row {
	display: grid;
	grid-template-columns: 1fr 1.4fr;
	gap: 14px;
	padding: 16px;
	border-radius: 20px;
	background: rgba(255, 248, 236, 0.72);
	border: 1px solid rgba(24, 53, 46, 0.08);
	align-items: start;
}

.mapping-column,
.mapping-select {
	min-width: 0;
}

.mapping-label,
.mapping-key,
.mapping-state {
	margin: 0;
}

.mapping-label {
	font-weight: 800;
	margin-bottom: 4px;
}

.mapping-key {
	color: var(--color-text-muted);
	font-size: 13px;
	word-break: break-word;
}

.mapping-state {
	margin-top: 8px;
	font-size: 13px;
	color: #4a665f;
}

.report-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: 12px;
}

.report-grid button {
	min-height: 54px;
}

.status {
	grid-column: 1 / -1;
	padding: 14px 18px;
	border-radius: 20px;
	font-weight: 800;
	border: 1px solid transparent;
}

.status.success {
	background: rgba(47, 125, 89, 0.14);
	color: var(--color-primary);
	border-color: rgba(47, 125, 89, 0.18);
}

.status.error {
	background: rgba(182, 79, 71, 0.14);
	color: #7a2418;
	border-color: rgba(182, 79, 71, 0.18);
}

.empty-state {
	color: var(--color-text-muted);
}

@media (max-width: 768px) {
	.hero-card h1 {
		font-size: 30px;
	}

	.card-header,
	.table-set-row,
	.preview-row-header,
	.worksheet-option,
	.time-window-item-header {
		flex-direction: column;
		align-items: flex-start;
	}

	.mapping-row {
		grid-template-columns: 1fr;
	}

	.admin-page {
		padding-inline: 12px;
	}

	.card,
	.hero-card,
	.auth-card {
		padding: 20px 18px;
	}

	.worksheet-option {
		grid-template-columns: 1fr;
	}
}
</style>
