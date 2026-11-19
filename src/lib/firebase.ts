import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração pública do app web (não é segredo: a proteção está em firestore.rules).
const firebaseConfig = {
  apiKey: "AIzaSyBcgPIhb8VTbFJ61sdHN_mQObrcHInUdZI",
  authDomain: "demos-rafael.firebaseapp.com",
  projectId: "demos-rafael",
  storageBucket: "demos-rafael.firebasestorage.app",
  messagingSenderId: "43489121887",
  appId: "1:43489121887:web:a37ac43ce9bac428456dea",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
