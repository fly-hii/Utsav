import { env } from '../config/env';

/**
 * Service to handle sending SMS notifications (OTPs, Receipts, etc.)
 */
export const SMSService = {
  /**
   * Send a generic SMS message
   */
  async sendSMS(phone: string, message: string): Promise<boolean> {
    try {
      if (env.SMS_PROVIDER === 'mock') {
        console.log('=============================================');
        console.log(`📱 MOCK SMS TO: ${phone}`);
        console.log(`MESSAGE: ${message}`);
        console.log('=============================================');
        return true;
      }
      
      // TODO: Implement actual SMS provider logic here (e.g. MSG91, Twilio, AWS SNS)
      console.warn('Real SMS provider not configured yet, falling back to mock.');
      console.log(`[SMS] To: ${phone} | Msg: ${message}`);
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  },

  /**
   * Send an OTP via SMS
   */
  async sendOTP(phone: string, otp: string): Promise<boolean> {
    const message = `Your Utsav verification code is ${otp}. Please do not share this with anyone.`;
    return this.sendSMS(phone, message);
  },

  /**
   * Send a Donation Receipt Link via SMS
   */
  async sendReceiptLink(phone: string, receiptUrl: string, amount: number, committeeName: string): Promise<boolean> {
    const message = `Dear Donor, thank you for your generous donation of Rs. ${amount} to ${committeeName}. Download or view your receipt here: ${receiptUrl} - Utsav App`;
    return this.sendSMS(phone, message);
  }
};
