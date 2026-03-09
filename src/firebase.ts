import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBlf4ViNe4T9ZBmLluJMLcH9fYt_vXaSzI",
  authDomain: "sherdll-nuts.firebaseapp.com",
  projectId: "sherdll-nuts",
  storageBucket: "sherdll-nuts.firebasestorage.app",
  messagingSenderId: "723091616554",
  appId: "1:723091616554:web:844eac1ae2c3b36e11e453"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
