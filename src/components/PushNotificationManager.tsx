
"use client";

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { auth } from '@/lib/firebase';
import { getLoggedInDriver } from '@/lib/data-service';

export default function PushNotificationManager() {

  useEffect(() => {
    const runOneSignal = async () => {
        // Wait for the user to be logged in
        if (!auth.currentUser) return;
        
        // The OneSignal App ID should be stored in an environment variable
        const ONE_SIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
        
        if (!ONE_SIGNAL_APP_ID) {
            console.error("OneSignal App ID is not configured. Please set NEXT_PUBLIC_ONESIGNAL_APP_ID in your .env file.");
            return;
        }

        try {
            await OneSignal.init({ appId: ONE_SIGNAL_APP_ID, allowLocalhostAsSecureOrigin: true });
            
            // Set the external user ID to link this device with the driver in Firestore
            const driver = await getLoggedInDriver();
            if (driver && driver.id) {
                OneSignal.login(driver.id);
                console.log(`OneSignal user logged in with external ID: ${driver.id}`);
            }
        } catch (error) {
            console.error("Error initializing OneSignal:", error);
        }
    };
    
    // Run OneSignal setup once the user is authenticated
    const unsubscribe = auth.onAuthStateChanged(user => {
        if (user) {
            runOneSignal();
        } else {
            // If user logs out, logout from OneSignal too
            if (OneSignal.User.isLoggedIn()) {
                OneSignal.logout();
                console.log("OneSignal user logged out.");
            }
        }
    });

    return () => unsubscribe();

  }, []);

  return null; // This component does not render anything
}
