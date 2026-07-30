import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

// Type definitions to replace static import
type ExpoPushMessage = any;

let Expo: any;
let expo: any;

/**
 * Lazy loads the Expo SDK client using dynamic import 
 * to prevent ERR_REQUIRE_ESM in Vercel Serverless (CommonJS) environments.
 */
async function getExpo() {
  if (!Expo) {
    const sdk = await import('expo-server-sdk');
    Expo = sdk.Expo;
    expo = new Expo();
  }
  return { Expo, expo };
}

export const sendPushNotification = async (pushToken: string, title: string, body: string, data?: any) => {
  const { Expo, expo } = await getExpo();

  // Check that all your push tokens appear to be valid Expo push tokens
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
    return;
  }

  const message: ExpoPushMessage = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data: data || { withSome: 'data' },
  };

  try {
    const receipts = await expo.sendPushNotificationsAsync([message]);
    console.log('Push notification sent successfully:', receipts);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

/**
 * Helper function to send push notification to all members of a committee
 */
export const notifyCommitteeMembers = async (committeeId: string, title: string, body: string, data?: any) => {
  try {
    // 1. Get all members for this committee
    const [members] = await pool.query<RowDataPacket[]>(
      `SELECT u.push_token 
       FROM committee_members cm 
       JOIN users u ON cm.userId = u.id 
       WHERE cm.committeeId = ? AND cm.isActive = TRUE AND u.push_token IS NOT NULL`,
      [committeeId]
    );

    const { Expo, expo } = await getExpo();

    const validTokens = members.map(m => m.push_token).filter(t => Expo.isExpoPushToken(t));
    
    if (validTokens.length === 0) return;

    const messages: ExpoPushMessage[] = validTokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
    }));

    // The Expo push notification service accepts batches of notifications so
    // that you don't need to send 1000 requests to send 1000 notifications.
    const chunks = expo.chunkPushNotifications(messages);
    
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error('Error sending notification chunk:', error);
      }
    }
  } catch (error) {
    console.error('Error in notifyCommitteeMembers:', error);
  }
};

/**
 * Helper to notify a specific user by their DB ID
 */
export const notifyUser = async (userId: string, title: string, body: string, data?: any) => {
  try {
    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT push_token FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length > 0 && users[0].push_token) {
      await sendPushNotification(users[0].push_token, title, body, data);
    }
  } catch (error) {
    console.error('Error in notifyUser:', error);
  }
};
