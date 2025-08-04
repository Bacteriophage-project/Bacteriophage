// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCy6CcwQa7N8IcarLAuCPlzVsankL5qtjY",
  authDomain: "bacteriophage-auth.firebaseapp.com",
  projectId: "bacteriophage-auth",
  storageBucket: "bacteriophage-auth.firebasestorage.app",
  messagingSenderId: "342357172534",
  appId: "1:342357172534:web:0c1781bf18704ffb0e5397"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
