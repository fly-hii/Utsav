import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { documentDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { Alert } from 'react-native';

/**
 * Shows a success alert after PDF is saved, then optionally opens share sheet.
 */
const showDownloadSuccessAndShare = (fileUri: string, title: string) => {
  return new Promise<void>((resolve) => {
    Alert.alert(
      'Download Complete ✅',
      `${title} has been saved successfully to your device.`,
      [
        {
          text: 'Share PDF',
          onPress: async () => {
            try {
              await Sharing.shareAsync(fileUri, {
                UTI: '.pdf',
                mimeType: 'application/pdf',
                dialogTitle: `Share ${title}`,
              });
            } catch {
              // User cancelled sharing, ignore
            }
            resolve();
          },
        },
        {
          text: 'OK',
          style: 'cancel',
          onPress: () => resolve(),
        },
      ]
    );
  });
};

export const generateAuditReportPDF = async (committeeDetails: any, report: any) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #FF6B35; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 28px; color: #FF6B35; font-weight: bold; margin: 0; }
        .subtitle { font-size: 16px; color: #666; margin-top: 5px; }
        .details { margin-bottom: 30px; }
        .details p { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f9f9f9; font-weight: bold; }
        .totals { background-color: #f0f0f0; font-weight: bold; }
        .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 20px; }
        .signature { margin-top: 60px; display: flex; justify-content: space-between; }
        .sig-box { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">${committeeDetails?.name || 'Village Committee'}</h1>
        <p class="subtitle">Official Financial Audit Report</p>
      </div>
      
      <div class="details">
        <p><strong>Village:</strong> ${committeeDetails?.village || 'N/A'}</p>
        <p><strong>District:</strong> ${committeeDetails?.district || 'N/A'}</p>
        <p><strong>Date Generated:</strong> ${new Date().toLocaleDateString()}</p>
      </div>

      <h3>Financial Summary</h3>
      <table>
        <tr>
          <th>Category</th>
          <th>Amount (₹)</th>
          <th>Count</th>
        </tr>
        <tr>
          <td>Total Donations Collected</td>
          <td style="color: green;">₹${(report?.totalDonations || 0).toLocaleString('en-IN')}</td>
          <td>${report?.donationsCount || 0}</td>
        </tr>
        <tr>
          <td>Total Expenses Incurred</td>
          <td style="color: red;">₹${(report?.totalExpenses || 0).toLocaleString('en-IN')}</td>
          <td>${report?.expensesCount || 0}</td>
        </tr>
        <tr class="totals">
          <td>Net Balance Available</td>
          <td>₹${(report?.netBalance || 0).toLocaleString('en-IN')}</td>
          <td>-</td>
        </tr>
      </table>

      <h3>Expense Breakdown</h3>
      <table>
        <tr>
          <th>Expense Category</th>
          <th>Total Spent (₹)</th>
        </tr>
        ${report?.categories?.map((c: any) => `
          <tr>
            <td>${c.category}</td>
            <td>₹${(c.amount || 0).toLocaleString('en-IN')}</td>
          </tr>
        `).join('')}
      </table>

      ${report?.expensesList && report.expensesList.length > 0 ? `
      <h3>Detailed Expenses (Shop / Vendor Details)</h3>
      <table>
        <tr>
          <th>Date</th>
          <th>Shop / Vendor</th>
          <th>Category</th>
          <th>Description</th>
          <th>Amount (₹)</th>
        </tr>
        ${report.expensesList.map((e: any) => `
          <tr>
            <td>${new Date(e.date || Date.now()).toLocaleDateString()}</td>
            <td><strong>${e.vendor || 'N/A'}</strong></td>
            <td>${e.category || 'General'}</td>
            <td>${e.description || '-'}</td>
            <td>₹${(e.amount || 0).toLocaleString('en-IN')}</td>
          </tr>
        `).join('')}
      </table>
      ` : ''}
      <div class="signature">
        <div class="sig-box">Auditor Signature</div>
        <div class="sig-box">Committee President</div>
      </div>

      <div class="footer">
        Generated securely via Utsav App • Authenticated Document
      </div>
    </body>
    </html>
  `;

  try {
    const { base64 } = await Print.printToFileAsync({ html, base64: true });
    const newUri = documentDirectory + 'Audit_Report.pdf';
    if (base64) {
      await writeAsStringAsync(newUri, base64, { encoding: EncodingType.Base64 });
    }
    await showDownloadSuccessAndShare(newUri, 'Audit Report PDF');
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    throw error;
  }
};


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
          <p><span class="label">Receipt No:</span> <span class="value">#DON-${donation?.id?.substring(0, 8).toUpperCase()}</span></p>
          <p><span class="label">Date:</span> <span class="value">${new Date(donation?.date || Date.now()).toLocaleDateString()}</span></p>
          <p><span class="label">Donor Name:</span> <span class="value">${donation?.donorName}</span></p>
          <p><span class="label">Phone:</span> <span class="value">${donation?.donorPhone}</span></p>
          <p><span class="label">Payment Mode:</span> <span class="value">${donation?.paymentMethod}</span></p>
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
    const newUri = documentDirectory + `Donation_Receipt_${donation?.id?.substring(0,8)}.pdf`;
    if (base64) {
      await writeAsStringAsync(newUri, base64, { encoding: EncodingType.Base64 });
    }
    await showDownloadSuccessAndShare(newUri, 'Donation Receipt PDF');
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    throw error;
  }
};
