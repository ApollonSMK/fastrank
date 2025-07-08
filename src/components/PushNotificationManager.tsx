
"use client";

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { auth, app } from '@/lib/firebase';
import { getLoggedInDriver, updateDriver } from '@/lib/data-service';
import { useToast } from '@/hooks/use-toast';

export default function PushNotificationManager() {
  const { toast } = useToast();

  useEffect(() => {
    const setupMessaging = async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return;
      }

      // Wait for the user to be logged in
      if (!auth.currentUser) return;
      
      const messaging = getMessaging(app);

      // 1. Request Permission
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted.');

          // 2. Get Token - IMPORTANT: You need to generate this key in your Firebase project settings
          // Go to Project Settings > Cloud Messaging > Web configuration > Generate key pair
          const vapidKey = "BDPgM4_O-81R9qgN_qU4jB-JjZ9J8Zz6Y8wX2Zz6X8wX2Zz6X8wX2Zz6X8wX2Zz6X8wX2Zz6X8wX2Zz6";
          
          const currentToken = await getToken(messaging, { vapidKey });
          
          if (currentToken) {
            console.log('FCM Token:', currentToken);
            // 3. Save Token to Firestore
            const driver = await getLoggedInDriver();
            if (driver && driver.fcmToken !== currentToken) {
              await updateDriver(driver.id, { fcmToken: currentToken });
              console.log('FCM token saved to Firestore.');
            }
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } else {
          console.log('Unable to get permission to notify.');
        }
      } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
      }

      // 4. Handle Foreground Messages
      onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        toast({
          title: payload.notification?.title,
          description: payload.notification?.body,
        });
      });
    };

    const unsubscribe = auth.onAuthStateChanged(user => {
        if (user) {
            setupMessaging();
        }
    });

    return () => unsubscribe();
  }, [toast]);

  return null;
}
