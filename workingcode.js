import React, {useEffect} from 'react';
import {
  View,
  Text,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance} from '@notifee/react-native';

export default function App() {
  // Request notification permissions and get FCM token
  const setupNotifications = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
      }

      // Request permission for iOS
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        const token = await messaging().getToken();
        console.log('FCM Token:', token);
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  // Create notification channel for Android
  const createNotificationChannel = async () => {
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await setupNotifications();
      await createNotificationChannel();

      // Handle foreground messages
      const unsubscribeForeground = messaging().onMessage(
        async remoteMessage => {
          console.log('New FCM message:', remoteMessage);
          await notifee.displayNotification({
            title: remoteMessage.notification?.title || 'No Title',
            body: remoteMessage.notification?.body || 'No Body',
            android: {channelId: 'default'},
          });
        },
      );

      // Handle background messages
      messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('Message in background:', remoteMessage);
      });

      return unsubscribeForeground;
    };

    const unsubscribe = initialize();
    return () => unsubscribe && unsubscribe();
  }, []);

  return (
    <View>
      <Text>Hello</Text>
    </View>
  );
}
