// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: For a production application, move this configuration to environment variables.
const firebaseConfig = {
  apiKey: "AIzaSyDt6uEYbYk0VZE7CY_kMIgW3H3daxp7F18",
  authDomain: "fastrack-f6f0a.firebaseapp.com",
  projectId: "fastrack-f6f0a",
  storageBucket: "fastrack-f6f0a.appspot.com",
  messagingSenderId: "282991338208",
  appId: "1:282991338208:web:f7ed985f99ca70068a2685",
  measurementId: "G-CB6MZYQCM8"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
