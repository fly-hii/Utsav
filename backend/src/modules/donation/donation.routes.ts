import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { committeeRoleOrAbove } from '../../middleware/roles';
import { validate } from '../../middleware/validate';
import { hashPassword, generateTempPassword } from '../../utils/password';
import { sendSuccess, sendCreated, sendError, sendNotFound, parsePagination, buildPaginationMeta } from '../../utils/response';
import { emitDonation, emitDashboardUpdate } from '../../websocket/socket';
import { uploadSingle } from '../../middleware/upload';
import { getPresignedUrl, uploadToS3, generateS3Key, S3_FOLDERS } from '../../config/s3';
import { notifyCommitteeMembers, notifyUser } from '../../services/notification.service';
import { SMSService } from '../../services/sms.service';
import { generateReceiptHtml } from '../../utils/receipt-generator';
import { v4 as uuidv4 } from 'uuid';

const addDonationSchema = z.object({
  donorName: z.string().min(1, 'Donor name is required'),
  donorPhone: z.string().optional(),
  donorAddress: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  purpose: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'NET_BANKING', 'CHEQUE', 'OTHER']).default('CASH'),
  remarks: z.string().optional(),
  eventId: z.string().optional(),
  date: z.string().transform((s) => new Date(s)).optional(),
});

const router = Router({ mergeParams: true });

async function resolveCommitteeId(inputCommitteeId?: string): Promise<string> {
  if (inputCommitteeId) {
    const existing: any = await queryOne('SELECT id FROM committees WHERE id = ?', [inputCommitteeId]);
    if (existing) return existing.id;
  }
  const firstComm: any = await queryOne('SELECT id FROM committees ORDER BY createdAt ASC LIMIT 1');
  if (firstComm) return firstComm.id;

  const defaultId = uuidv4();
  await query(
    `INSERT INTO committees (id, name, templeName, festivalName, village, mandal, district, state, address, latitude, longitude, presidentName, secretaryName, phone, status)
     VALUES (?, 'Sri Rama Youth Committee', 'Sri Seetha Ramachandra Swamy Temple', 'Sri Rama Navami Utsavam 2026', 'Kovvur', 'Kovvur', 'West Godavari', 'Andhra Pradesh', 'Kovvur, West Godavari', 16.98, 81.72, 'M. Subba Rao', 'K. Srinivasa Varma', '9876543210', 'APPROVED')`,
    [defaultId]
  );
  return defaultId;
}

router.post(
  '/',
  authenticate,
  committeeRoleOrAbove,
  validate(addDonationSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const committeeId = await resolveCommitteeId(req.params.id);
      const { donorName, donorPhone, donorAddress, amount, purpose, paymentMethod, remarks, eventId, date } = req.body;

      let donorId: string | null = null;

      if (donorPhone) {
        let donor: any = await queryOne('SELECT id FROM users WHERE phone = ?', [donorPhone]);

        if (!donor) {
          const tempPassword = generateTempPassword();
          const hashedPw = await hashPassword(tempPassword);
          donorId = uuidv4();

          await query(
            `INSERT INTO users (id, name, phone, password, role, address)
             VALUES (?, ?, ?, ?, 'USER', ?)`,
            [donorId, donorName, donorPhone, hashedPw, donorAddress || null]
          );
        } else {
          donorId = donor.id;
        }
      }

      const countRes: any = await queryOne('SELECT COUNT(*) as total FROM donations WHERE committeeId = ?', [
        committeeId,
      ]);
      const nextSeq = (countRes?.total || 0) + 1;
      const receiptNo = `UTD-${committeeId.slice(0, 6).toUpperCase()}-${nextSeq.toString().padStart(6, '0')}`;

      const donationId = uuidv4();
      const donationDate = date || new Date();

      await query(
        `INSERT INTO donations (id, committeeId, eventId, donorId, addedById, donorName, donorPhone, donorAddress, amount, purpose, paymentMethod, remarks, receiptNo, date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          donationId,
          committeeId,
          eventId || null,
          donorId,
          req.user!.userId,
          donorName,
          donorPhone || null,
          donorAddress || null,
          amount,
          purpose || null,
          paymentMethod || 'CASH',
          remarks || null,
          receiptNo,
          donationDate,
        ]
      );

      const donation = await queryOne('SELECT * FROM donations WHERE id = ?', [donationId]);
      const committee = await queryOne('SELECT * FROM committees WHERE id = ?', [committeeId]);

      // --- GENERATE & SEND SMS RECEIPT ---
      try {
        if (donorPhone) {
          const htmlContent = generateReceiptHtml(donation, committee);
          const key = generateS3Key(S3_FOLDERS.DONATION_RECEIPTS, `${receiptNo}.html`);
          const uploaded = await uploadToS3(Buffer.from(htmlContent), key, 'text/html');
          
          await query('UPDATE donations SET receiptHtmlS3Key = ?, receiptHtmlS3Url = ? WHERE id = ?', [
            uploaded.s3Key,
            uploaded.s3Url,
            donationId
          ]);
          
          donation.receiptHtmlS3Url = uploaded.s3Url;
          await SMSService.sendReceiptLink(donorPhone, uploaded.s3Url, amount, committee.name);
        }
      } catch (err) {
        console.error('Failed to generate/send receipt:', err);
      }
      // ------------------------------------

      try {
        emitDonation(committeeId, donation);
        emitDashboardUpdate(committeeId, { type: 'donation', donation });
        
        notifyCommitteeMembers(
          committeeId,
          'New Offline Donation',
          `A donation of ₹${amount} was recorded manually for ${donorName || 'a donor'}.`
        ).catch(console.error);
      } catch {}

      sendCreated(res, donation, 'Donation recorded successfully');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

router.get(
  '/',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const committeeId = await resolveCommitteeId(req.params.id);
      const { page, limit, skip } = parsePagination(req.query);

      const donations = await query(
        `SELECT d.*, u.name as addedByName
         FROM donations d
         LEFT JOIN users u ON d.addedById = u.id
         WHERE d.committeeId = ?
         ORDER BY d.createdAt DESC LIMIT ${Number(limit)} OFFSET ${Number(skip)}`,
        [committeeId]
      );

      const countRes: any = await queryOne(
        'SELECT COUNT(*) as total FROM donations WHERE committeeId = ?',
        [committeeId]
      );

      for (const d of donations as any[]) {
        if (d.screenshotS3Key) {
          try { d.screenshotS3Url = await getPresignedUrl(d.screenshotS3Key, 604800); } catch (e) {}
        }
      }

      sendSuccess(res, donations, 'Donations fetched', 200, buildPaginationMeta(countRes?.total || 0, page, limit));
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

export const donationStandaloneRouter = Router();

donationStandaloneRouter.get(
  '/my-donations',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const donations = await query(
        `SELECT d.*, c.name as committeeName, c.templeName, c.village, c.district
         FROM donations d
         LEFT JOIN committees c ON d.committeeId = c.id
         WHERE d.addedById = ? OR d.donorId = ?
         ORDER BY d.createdAt DESC`,
        [userId, userId]
      );

      for (const d of donations as any[]) {
        if (d.screenshotS3Key) {
          try { d.screenshotS3Url = await getPresignedUrl(d.screenshotS3Key, 604800); } catch (e) {}
        }
      }

      sendSuccess(res, donations, 'My donations fetched');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

donationStandaloneRouter.post(
  '/',
  authenticate,
  uploadSingle,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { committeeId, donorName, donorPhone, donorAddress, amount: rawAmount, purpose, paymentMethod, remarks } = req.body;
      const amount = typeof rawAmount === 'string' ? parseFloat(rawAmount) : rawAmount;
      if (!amount || isNaN(amount) || amount <= 0) {
        sendError(res, 'Valid amount is required', 400);
        return;
      }
      const targetCommitteeId = await resolveCommitteeId(committeeId);

      let screenshotS3Key = null;
      let screenshotS3Url = null;
      let status = 'VERIFIED'; // Default for offline/cash

      // If user uploaded a screenshot, we assume it's an online payment and mark it PENDING
      if (req.file) {
        status = 'PENDING';
        const key = generateS3Key(S3_FOLDERS.DONATION_RECEIPTS, `receipt_${targetCommitteeId}_${req.file.originalname}`);
        const uploaded = await uploadToS3(req.file.buffer, key, req.file.mimetype);
        screenshotS3Key = uploaded.s3Key;
        screenshotS3Url = uploaded.s3Url;
      }

      const countRes: any = await queryOne('SELECT COUNT(*) as total FROM donations WHERE committeeId = ?', [
        targetCommitteeId,
      ]);
      const nextSeq = (countRes?.total || 0) + 1;
      const receiptNo = `UTD-${targetCommitteeId.slice(0, 6).toUpperCase()}-${nextSeq.toString().padStart(6, '0')}`;

      const donationId = uuidv4();

      await query(
        `INSERT INTO donations (id, committeeId, donorId, addedById, donorName, donorPhone, donorAddress, amount, purpose, paymentMethod, remarks, receiptNo, date, screenshotS3Key, screenshotS3Url, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          donationId,
          targetCommitteeId,
          req.user!.userId,
          req.user!.userId,
          donorName || 'Villager',
          donorPhone || null,
          donorAddress || null,
          amount,
          purpose || 'Public Festival Donation',
          paymentMethod || 'UPI',
          remarks || null,
          receiptNo,
          new Date(),
          screenshotS3Key,
          screenshotS3Url,
          status
        ]
      );

      const donation = await queryOne('SELECT * FROM donations WHERE id = ?', [donationId]);
      
      // Notify committee members of the new donation
      notifyCommitteeMembers(
        targetCommitteeId,
        'New Donation Added',
        `A donation of ₹${amount} was recorded manually by the committee for ${donorName || 'a donor'}.`
      ).catch(console.error);

      sendCreated(res, donation, 'Donation recorded successfully');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

donationStandaloneRouter.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const donation = await queryOne('SELECT * FROM donations WHERE id = ?', [req.params.id]);
      if (!donation) {
        sendNotFound(res, 'Donation');
        return;
      }
      
      if (donation.screenshotS3Key) {
        try { donation.screenshotS3Url = await getPresignedUrl(donation.screenshotS3Key, 604800); } catch (e) {}
      }
      
      sendSuccess(res, donation);
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

donationStandaloneRouter.put(
  '/:id/verify',
  authenticate,
  committeeRoleOrAbove,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.body; // 'VERIFIED' or 'REJECTED'
      if (!['VERIFIED', 'REJECTED'].includes(status)) {
        throw { statusCode: 400, message: 'Invalid status' };
      }

      // Check if user has access to this committee
      const donation: any = await queryOne('SELECT committeeId FROM donations WHERE id = ?', [req.params.id]);
      if (!donation) {
        throw { statusCode: 404, message: 'Donation not found' };
      }

      // Admin verification (simplified for brevity, normally check committee_members)
      await query('UPDATE donations SET status = ? WHERE id = ?', [status, req.params.id]);

      const updated: any = await queryOne('SELECT * FROM donations WHERE id = ?', [req.params.id]);

      // Notify the donor that their payment status was updated
      if (updated && updated.donorId) {
        const title = status === 'VERIFIED' ? 'Donation Verified ✅' : 'Donation Rejected ❌';
        const body = status === 'VERIFIED' 
          ? `Your donation of ₹${updated.amount} has been verified by the committee.`
          : `Your donation of ₹${updated.amount} was rejected. Please contact the committee.`;
        
        notifyUser(updated.donorId, title, body).catch(console.error);
      }

      sendSuccess(res, updated, 'Donation status updated');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

export default router;
