// src/firebaseConfig.js

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'; 
import { getFirestore } from 'firebase/firestore'; 
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; 

// 🚨 REMOVIDA A IMPORTAÇÃO DE EXPO-CONSTANTS: Isso resolve o TypeError de inicialização
// A API Key do Maps é lida apenas nas telas onde é estritamente necessária.

// Suas chaves de configuração do projeto Firebase (Valores públicos fixos)
const firebaseConfig = {
    // Estas chaves são consideradas públicas (Client-side) e são fixadas para
    // garantir a estabilidade do SDK do Firebase durante o boot do App.
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
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Inicializa e exporta o serviço do Firestore (db)
export const db = getFirestore(app);