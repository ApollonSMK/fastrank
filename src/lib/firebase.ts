// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";

// TODO: For a production application, move this configuration to environment variables.
const firebaseConfig = {
  apiKey: "AIzaSyDt6uEYbYk0VZE7CY_kMIgW3H3daxp7F18",
  authDomain: "fastrack-f6f0a.firebaseapp.com",
  projectId: "fastrack-f6f0a",
  storageBucket: "fastrack-f6f0a.firebasestorage.app",
  messagingSenderId: "282991338208",
  appId: "1:282991338208:web:f7ed985f99ca70068a2685",
  measurementId: "G-CB6MZYQCM8"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


/**
 * A promise that resolves with the Firebase user object once the auth state has been determined.
 * This is useful for avoiding race conditions on the initial page load.
 */
export const authInitialized = new Promise<User | null>(resolve => {
  const unsubscribe = onAuthStateChanged(auth, user => {
    resolve(user);
    unsubscribe();
  });
});


export { app, db, auth };
