// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCwgPWv8ZxGj3XTg2G6p7zIBQVBlXo7B4g",
  authDomain: "codernautics.firebaseapp.com",
  projectId: "codernautics",
  storageBucket: "codernautics.firebasestorage.app",
  messagingSenderId: "614312440141",
  appId: "1:614312440141:web:e9abb446d5c6d8f5d70704",
  measurementId: "G-0XQ5W59T2E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services only on client side
export const auth = typeof window !== 'undefined' ? getAuth(app) : null;
export const db = typeof window !== 'undefined' ? getFirestore(app) : null;
export const storage = typeof window !== 'undefined' ? getStorage(app) : null;

export default app;
