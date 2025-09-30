// src/firebaseConfig.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
// 🚨 CORREÇÃO ESSENCIAL: Importa o método para inicializar o Firestore
import { getFirestore } from 'firebase/firestore'; 

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

// Inicializa e exporta o serviço de autenticação
export const auth = getAuth(app);

// Inicializa e exporta o serviço do Firestore (db)
export const db = getFirestore(app);