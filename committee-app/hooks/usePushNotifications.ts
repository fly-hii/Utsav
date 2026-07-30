import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { api } from '../services/api';
import type * as NotificationsType from 'expo-notifications';

let Notifications: typeof NotificationsType | null = null;
try {
  Notifications = require('expo-notifications');
  if (Notifications) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (e) {
  console.log('expo-notifications not available in this environment');
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<NotificationsType.Notification | undefined>();

  useEffect(() => {
    if (!Notifications) return;

    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
      if (token) {
        // Send the token to your backend
        api.post('/auth/push-token', { token }).catch(console.error);
      }
    }).catch(console.error);

    let notificationListener: any;
    let responseListener: any;

    try {
      notificationListener = Notifications.addNotificationReceivedListener(notification => {
        setNotification(notification);
      });

      responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
      });
    } catch (e) {
      console.log('Failed to add notification listeners', e);
    }

    return () => {
      if (notificationListener) {
        notificationListener.remove();
      }
      if (responseListener) {
        responseListener.remove();
      }
    };
  }, []);

  return { expoPushToken, notification };
}

async function registerForPushNotificationsAsync() {
  let token;
  if (!Notifications) return undefined;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      
      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
          
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
      } catch (e) {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }
  } catch (error) {
    console.log('Push notifications error:', error);
  }

  return token;
}
