import React, {useEffect} from 'react';
import {View, Text, PermissionsAndroid, Platform, Button} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance} from '@notifee/react-native';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';

export default function App() {
  // Request permissions and get FCM token
  const initializeNotifications = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
      }

      const authStatus = await messaging().requestPermission();
      if (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      ) {
        const token = await messaging().getToken();
        console.log('FCM Token:', token);
      }

      if (Platform.OS === 'android') {
        await notifee.createChannel({
          id: 'default',
          name: 'Default Channel',
          importance: AndroidImportance.HIGH,
        });
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  useEffect(() => {
    initializeNotifications();

    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('New FCM message:', remoteMessage);
      await notifee.displayNotification({
        title: remoteMessage.notification?.title || 'No Title',
        body: remoteMessage.notification?.body || 'No Body',
        android: {channelId: 'default'},
      });
    });

    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message in background:', remoteMessage);
    });

    return () => unsubscribeForeground();
  }, []);

  const predefinedEvents = async () => {
    await analytics().logLogin({
      method: 'facebook',
    });
  };

  const customEvents = async () => {
    await analytics().logLogin('cart', {
      if: 12345,
      item: 'shirt',
      description: ['round neck'],
      size: 'M',
    });
  };

  const getUserDetails = () => {
    new Promise((resolve, reject) => {
      resolve('Success');
      reject('error');
    });
  };

  useEffect(() => {
    getUserDetails();
  }, []);

  const handleCrash = () => {
    // Log an event to Crashlytics
    crashlytics().log('Testing Crashlytics');

    // Simulate a crash
    crashlytics().crash();
  };

  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text>Test App</Text>
      <Button title="Predefined Event" onPress={predefinedEvents} />
      <Button title="Custom Event" onPress={customEvents} />
      <Button title="Crash the App" onPress={handleCrash} />
    </View>
  );
}
