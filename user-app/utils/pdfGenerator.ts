import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { documentDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';

export const generateDonationReceiptPDF = async (committeeDetails: any, donation: any) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
        .receipt-container { border: 2px dashed #ccc; padding: 30px; border-radius: 10px; }
        .header { text-align: center; border-bottom: 2px solid #FF6B35; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 26px; color: #FF6B35; font-weight: bold; margin: 0; }
        .subtitle { font-size: 18px; color: #666; margin-top: 5px; letter-spacing: 2px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 15px; }
        .label { font-weight: bold; color: #777; width: 150px; display: inline-block; }
        .value { font-size: 16px; }
        .amount-box { background-color: #f9f9f9; border: 1px solid #ddd; padding: 15px; text-align: center; margin-top: 30px; border-radius: 8px; }
        .amount-text { font-size: 24px; font-weight: bold; color: #28a745; }
        .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <h1 class="title">${committeeDetails?.name || 'Village Committee'}</h1>
          <p class="subtitle">DONATION RECEIPT</p>
        </div>
        
        <div>
          <p><span class="label">Receipt No:</span> <span class="value">#DON-${donation?.id?.substring(0, 8).toUpperCase() || 'N/A'}</span></p>
          <p><span class="label">Date:</span> <span class="value">${new Date(donation?.date || Date.now()).toLocaleDateString()}</span></p>
          <p><span class="label">Donor Name:</span> <span class="value">${donation?.donorName || 'Anonymous'}</span></p>
          <p><span class="label">Phone:</span> <span class="value">${donation?.donorPhone || 'N/A'}</span></p>
          <p><span class="label">Payment Mode:</span> <span class="value">${donation?.paymentMethod || 'Unknown'}</span></p>
          <p><span class="label">Purpose:</span> <span class="value">${donation?.purpose || 'General Festival Fund'}</span></p>
        </div>

        <div class="amount-box">
          Donation Amount: <span class="amount-text">₹${(donation?.amount || 0).toLocaleString('en-IN')}</span>
        </div>

        <div class="footer">
          Thank you for your generous contribution!<br>
          Generated securely via Utsav App
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { base64 } = await Print.printToFileAsync({ html, base64: true });
    const newUri = documentDirectory + `Donation_Receipt_${donation?.id?.substring(0,8) || 'Unknown'}.pdf`;
    if (base64) {
      await writeAsStringAsync(newUri, base64, { encoding: EncodingType.Base64 });
    }
    await Sharing.shareAsync(newUri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Share Donation Receipt' });
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    throw error;
  }
};
