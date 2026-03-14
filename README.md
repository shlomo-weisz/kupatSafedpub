# my-vue-app

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## API configuration

The client reads the server address from `VUE_APP_API_URL`.

- Local Docker / same-origin proxy: leave it unset and the app will use `/api`
- Remote server example: `VUE_APP_API_URL=https://api.example.com`
- Remote server with path prefix: `VUE_APP_API_URL=https://api.example.com/api`

You can copy `.env.example` to `.env.local` for local development.

## Vercel deployment

- Set `VUE_APP_API_URL` in the Vercel project environment variables
- `vercel.json` already includes SPA fallback routing for Vue Router history mode
- If the server should accept only the Vercel frontend, set `CORS_ALLOWED_ORIGINS` on the server
  Example: `https://your-project.vercel.app,https://*.vercel.app`
