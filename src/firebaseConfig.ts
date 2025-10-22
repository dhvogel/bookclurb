// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getDatabase, Database } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDxv_jjiE-JrsyStYVp7IjeidozWl_NigA",
  authDomain: "sombk-firebase-free.firebaseapp.com",
  projectId: "sombk-firebase-free",
  storageBucket: "sombk-firebase-free.firebasestorage.app",
  messagingSenderId: "350608617875",
  appId: "1:350608617875:web:5031a3d3bd6a54f0e9b866",
  measurementId: "G-D53Y9SYNN6"
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
export const db: Database = getDatabase(app);
const analytics: Analytics = getAnalytics(app);