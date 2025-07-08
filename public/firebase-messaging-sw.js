
// This file must be in the public folder.

// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Your web app's Firebase configuration
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
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
