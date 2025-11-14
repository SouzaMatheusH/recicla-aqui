// src/firebaseConfig.js

import { initializeApp } from 'firebase/app';
// 🚨 CORREÇÃO: Importa initializeAuth e getReactNativePersistence
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'; 
import { getFirestore } from 'firebase/firestore'; 

// 🚨 NOVO: Importa o AsyncStorage para persistência no React Native
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; 


// Suas chaves de configuração do projeto Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCpQAAErQoqY0GKvdlVHrCpELDH5un4VQ0",
    authDomain: "localizaqui-a9e3c.firebaseapp.com",
    projectId: "localizaqui-a9e3c",
    storageBucket: "localizaqui-a9e3c.appspot.com", 
    messagingSenderId: "802230070732",
    appId: "1:802230070732:android:6e4b8a9b3d0c4d5e6f7a8b" 
};


// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa e exporta o serviço de autenticação com persistência
// 🚨 CORREÇÃO: Usando initializeAuth para definir o método de persistência
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Inicializa e exporta o serviço do Firestore (db)
export const db = getFirestore(app);