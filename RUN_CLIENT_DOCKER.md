# הרצת הלקוח בדוקר

קובץ זה מיועד להרצת צד הלקוח בלבד.

## חשוב לפני שמריצים

הלקוח קורא את כתובת השרת מתוך הקובץ:

`.env.docker`

בקובץ הזה הגדירי:

```env
VUE_APP_API_BASE_URL=https://your-server-domain
```

אם השרת נמצא תחת path כמו `/api`, הגדירי:

```env
VUE_APP_API_BASE_URL=https://your-server-domain/api
```

## משתנים נפוצים

```env
VUE_APP_API_BASE_URL=https://your-server-domain
CLIENT_PORT=8090
```

## פקודת הרצה

מהתיקיה `prodaction/my-vue-app`:

```powershell
docker compose --env-file .env.docker up -d --build
```

## בדיקות

- פתיחת האתר: `http://localhost:8090/`
- אם `CLIENT_PORT` שונה, השתמשי בפורט שהוגדר

## עצירה

```powershell
docker compose down
```

## הערה

אם משנים את `VUE_APP_API_BASE_URL`, מספיק להרים מחדש את הקונטיינר של הלקוח. הקונטיינר מייצר `runtime-config.js` בזמן העלייה.
