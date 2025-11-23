// app.config.js
import 'dotenv/config'; // Importa e carrega as variáveis de ambiente

// Variáveis de ambiente lidas do .env (devem ser exportadas como EXPO_PUBLIC_)
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
// Adicione outras variáveis do .env conforme necessário

export default {
  "expo": {
    "name": "recicla-aqui",
    "slug": "recicla-aqui",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./src/assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./src/assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "O ReciclAqui precisa da sua localização para mostrar pontos de descarte próximos e traçar rotas."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./src/assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "package": "com.reciclaqui"
    },
    "web": {
      "favicon": "./src/assets/favicon.png"
    },
    "locationWhenInUse": "O ReciclAqui precisa da sua localização para mostrar pontos de descarte próximos e traçar rotas.",
    "extra": {
      "eas": {
        "projectId": "c65f85f7-1467-44c8-8d49-270453551ba2"
      },
      // Variáveis injetadas a partir do .env
      "GOOGLE_MAPS_API_KEY": GOOGLE_MAPS_API_KEY, 
      "FIREBASE_API_KEY": FIREBASE_API_KEY,
      "FIREBASE_AUTH_DOMAIN": process.env.FIREBASE_AUTH_DOMAIN,
      "FIREBASE_PROJECT_ID": process.env.FIREBASE_PROJECT_ID,
      "FIREBASE_STORAGE_BUCKET": process.env.FIREBASE_STORAGE_BUCKET,
      "FIREBASE_MESSAGING_SENDER_ID": process.env.FIREBASE_MESSAGING_SENDER_ID,
      "FIREBASE_APP_ID": process.env.FIREBASE_APP_ID
    }
  }
};