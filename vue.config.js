const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    client: {
      // הגדרת כתובת ה-WebSocket לשימוש ב-wss ובכתובת הציבורית של המנהרה
      webSocketURL: 'wss://vl5nq889-8080.euw.devtunnels.ms/ws',
    },
    headers: {
      'Access-Control-Allow-Origin': '*', // אם נדרש לפתור בעיות CORS נוסxxx בפיתוח
    },
  },
});
