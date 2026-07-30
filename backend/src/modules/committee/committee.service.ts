import { query, queryOne } from '../../config/database';
import { uploadToS3, generateS3Key, S3_FOLDERS, getPresignedUrl } from '../../config/s3';
import { hashPassword } from '../../utils/password';
import { calculateDistance, getBoundingBox } from '../../utils/geo';
import { v4 as uuidv4 } from 'uuid';

async function resolveCommitteeId(inputCommitteeId?: string): Promise<string> {
  if (inputCommitteeId) {
    const existing: any = await queryOne('SELECT id FROM committees WHERE id = ?', [inputCommitteeId]);
    if (existing) return existing.id;
  }
  const firstComm: any = await queryOne('SELECT id FROM committees ORDER BY createdAt ASC LIMIT 1');
  if (firstComm) return firstComm.id;

  const defaultId = 'comm-default-101';
  await query(
    `INSERT INTO committees (id, name, templeName, festivalName, village, mandal, district, state, address, latitude, longitude, presidentName, secretaryName, phone, status)
     VALUES (?, 'Sri Rama Youth Committee', 'Sri Seetha Ramachandra Swamy Temple', 'Sri Rama Navami Utsavam 2026', 'Kovvur', 'Kovvur', 'West Godavari', 'Andhra Pradesh', 'Kovvur, West Godavari', 16.98, 81.72, 'M. Subba Rao', 'K. Srinivasa Varma', '9876543210', 'APPROVED')`,
    [defaultId]
  ).catch(() => {});
  return defaultId;
}

interface RegisterCommitteeInput {
  name: string;
  templeName: string;
  festivalName: string;
  village: string;
  mandal: string;
  district: string;
  state: string;
  address: string;
  latitude: number;
  longitude: number;
  presidentName: string;
  secretaryName: string;
  phone: string;
  email?: string;
  password: string;
  description?: string;
}

export class CommitteeService {
  async registerCommittee(
    input: RegisterCommitteeInput,
    files: {
      logo?: Express.Multer.File;
      templeImages?: Express.Multer.File[];
      registrationCert?: Express.Multer.File;
      identityProof?: Express.Multer.File;
    }
  ) {
    let userId: string;

    const existingUser: any = await queryOne('SELECT id, role FROM users WHERE phone = ?', [
      input.phone,
    ]);

    if (existingUser) {
      userId = existingUser.id;
      if (existingUser.role === 'USER') {
        await query("UPDATE users SET role = 'COMMITTEE_ADMIN' WHERE id = ?", [userId]);
      }
    } else {
      userId = uuidv4();
      const hashedPassword = await hashPassword(input.password);
      await query(
        `INSERT INTO users (id, name, phone, email, password, role, address, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, 'COMMITTEE_ADMIN', ?, ?, ?)`,
        [
          userId,
          input.presidentName,
          input.phone,
          input.email || null,
          hashedPassword,
          input.address,
          input.latitude,
          input.longitude,
        ]
      );
    }

    let logoData: { s3Key: string; s3Url: string } | null = null;
    if (files.logo) {
      const key = generateS3Key(S3_FOLDERS.COMMITTEE_LOGOS, files.logo.originalname);
      logoData = await uploadToS3(files.logo.buffer, key, files.logo.mimetype);
    }

    const committeeId = uuidv4();

    await query(
      `INSERT INTO committees
       (id, name, templeName, festivalName, village, mandal, district, state, address, latitude, longitude, presidentName, secretaryName, phone, email, description, logo, logoUrl, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [
        committeeId,
        input.name,
        input.templeName,
        input.festivalName,
        input.village,
        input.mandal,
        input.district,
        input.state,
        input.address,
        input.latitude,
        input.longitude,
        input.presidentName,
        input.secretaryName,
        input.phone,
        input.email || null,
        input.description || null,
        logoData?.s3Key || null,
        logoData?.s3Url || null,
      ]
    );

    const memberId = uuidv4();
    await query(
      `INSERT INTO committee_members (id, userId, committeeId, role)
       VALUES (?, ?, ?, 'ADMIN')`,
      [memberId, userId, committeeId]
    );

    const documents: Array<{
      type: 'REGISTRATION_CERT' | 'IDENTITY_PROOF' | 'TEMPLE_IMAGE';
      file: Express.Multer.File;
      folder: string;
    }> = [];

    if (files.registrationCert) {
      documents.push({
        type: 'REGISTRATION_CERT',
        file: files.registrationCert,
        folder: S3_FOLDERS.COMMITTEE_DOCUMENTS,
      });
    }
    if (files.identityProof) {
      documents.push({
        type: 'IDENTITY_PROOF',
        file: files.identityProof,
        folder: S3_FOLDERS.COMMITTEE_DOCUMENTS,
      });
    }
    if (files.templeImages) {
      for (const img of files.templeImages) {
        documents.push({
          type: 'TEMPLE_IMAGE',
          file: img,
          folder: S3_FOLDERS.TEMPLE_IMAGES,
        });
      }
    }

    for (const doc of documents) {
      const docId = uuidv4();
      const key = generateS3Key(doc.folder, doc.file.originalname);
      const uploaded = await uploadToS3(doc.file.buffer, key, doc.file.mimetype);

      await query(
        `INSERT INTO committee_documents (id, committeeId, type, s3Key, s3Url, fileName, fileSize, mimeType)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          docId,
          committeeId,
          doc.type,
          uploaded.s3Key,
          uploaded.s3Url,
          doc.file.originalname,
          doc.file.size,
          doc.file.mimetype,
        ]
      );
    }

    return this.getCommitteeById(committeeId);
  }

  async getCommittees(queryParam: {
    page?: number;
    limit?: number;
    search?: string;
    district?: string;
    state?: string;
    status?: string;
  }) {
    const page = queryParam.page || 1;
    const limit = Math.min(queryParam.limit || 20, 100);
    const skip = (page - 1) * limit;

    let sql = 'SELECT * FROM committees WHERE 1=1';
    const params: any[] = [];

    if (queryParam.status) {
      sql += ' AND status = ?';
      params.push(queryParam.status);
    } else {
      sql += " AND status = 'APPROVED'";
    }

    if (queryParam.search) {
      sql += ' AND (name LIKE ? OR templeName LIKE ? OR festivalName LIKE ? OR village LIKE ?)';
      const s = `%${queryParam.search}%`;
      params.push(s, s, s, s);
    }

    if (queryParam.district) {
      sql += ' AND district = ?';
      params.push(queryParam.district);
    }

    sql += ` ORDER BY createdAt DESC LIMIT ${Number(limit)} OFFSET ${Number(skip)}`;
    const committees = await query(sql, params);

    for (const c of committees as any[]) {
      if (c.qrCodeS3Key) {
        try { c.qrCodeS3Url = await getPresignedUrl(c.qrCodeS3Key, 604800); } catch (e) {}
      }
      if (c.logo) {
        try { c.logoUrl = await getPresignedUrl(c.logo, 604800); } catch (e) {}
      }
    }

    const countSql = 'SELECT COUNT(*) as total FROM committees WHERE status = ?';
    const totalRes: any = await queryOne(countSql, [queryParam.status || 'APPROVED']);
    const total = totalRes?.total || 0;

    return {
      committees,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getNearbyCommittees(lat: number, lng: number, radiusKm = 25, page = 1, limit = 20) {
    const boundingBox = getBoundingBox(lat, lng, radiusKm);

    const committees = await query(
      `SELECT * FROM committees
       WHERE status = 'APPROVED' AND isActive = 1
       AND latitude BETWEEN ? AND ?
       AND longitude BETWEEN ? AND ?`,
      [boundingBox.minLat, boundingBox.maxLat, boundingBox.minLng, boundingBox.maxLng]
    );

    for (const c of committees as any[]) {
      if (c.qrCodeS3Key) {
        try { c.qrCodeS3Url = await getPresignedUrl(c.qrCodeS3Key, 604800); } catch (e) {}
      }
      if (c.logo) {
        try { c.logoUrl = await getPresignedUrl(c.logo, 604800); } catch (e) {}
      }
    }

    const withDistance = committees
      .map((c: any) => ({
        ...c,
        distance: calculateDistance(lat, lng, c.latitude, c.longitude),
      }))
      .filter((c) => c.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    const total = withDistance.length;
    const start = (page - 1) * limit;
    const paginated = withDistance.slice(start, start + limit);

    return {
      committees: paginated,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCommitteeById(id: string) {
    const committee: any = await queryOne('SELECT * FROM committees WHERE id = ?', [id]);

    if (!committee) {
      throw { statusCode: 404, message: 'Committee not found' };
    }

    if (committee.qrCodeS3Key) {
      try { committee.qrCodeS3Url = await getPresignedUrl(committee.qrCodeS3Key, 604800); } catch (e) {}
    }
    if (committee.logo) {
      try { committee.logoUrl = await getPresignedUrl(committee.logo, 604800); } catch (e) {}
    }

    const documents = await query('SELECT * FROM committee_documents WHERE committeeId = ?', [id]);
    const members = await query(
      `SELECT cm.*, u.name, u.phone, u.email, u.role as userRole, u.avatar, u.avatarUrl
       FROM committee_members cm
       JOIN users u ON cm.userId = u.id
       WHERE cm.committeeId = ?`,
      [id]
    );

    return {
      ...committee,
      documents,
      members,
    };
  }

  async getCommitteeProfile(id: string) {
    const committee = await this.getCommitteeById(id);

    const donationsSum: any = await queryOne(
      "SELECT SUM(amount) as total, COUNT(*) as count FROM donations WHERE committeeId = ? AND status = 'VERIFIED'",
      [id]
    );
    const expensesSum: any = await queryOne(
      'SELECT SUM(amount) as total, COUNT(*) as count FROM expenses WHERE committeeId = ?',
      [id]
    );

    const totalDonations = donationsSum?.total || 0;
    const totalExpenses = expensesSum?.total || 0;

    return {
      ...committee,
      financials: {
        totalDonations,
        donationCount: donationsSum?.count || 0,
        totalExpenses,
        expenseCount: expensesSum?.count || 0,
        balance: totalDonations - totalExpenses,
      },
    };
  }

  async updateCommittee(id: string, userId: string, data: any) {
    const member: any = await queryOne(
      "SELECT id FROM committee_members WHERE committeeId = ? AND userId = ? AND role = 'ADMIN'",
      [id, userId]
    );

    if (!member) {
      throw { statusCode: 403, message: 'Only committee admin can update committee details' };
    }

    await query(
      `UPDATE committees
       SET name = COALESCE(?, name),
           templeName = COALESCE(?, templeName),
           festivalName = COALESCE(?, festivalName),
           description = COALESCE(?, description),
           upiId = COALESCE(?, upiId)
       WHERE id = ?`,
      [data.name || null, data.templeName || null, data.festivalName || null, data.description || null, data.upiId || null, id]
    );

    return this.getCommitteeById(id);
  }

  async uploadQRCode(id: string, userId: string, file: Express.Multer.File) {
    const member: any = await queryOne(
      "SELECT id FROM committee_members WHERE committeeId = ? AND userId = ? AND role = 'ADMIN'",
      [id, userId]
    );

    if (!member) {
      throw { statusCode: 403, message: 'Only committee admin can update QR code' };
    }

    const key = generateS3Key(S3_FOLDERS.COMMITTEE_DOCUMENTS, `qr_${id}_${file.originalname}`);
    const uploaded = await uploadToS3(file.buffer, key, file.mimetype);

    await query(
      `UPDATE committees
       SET qrCodeS3Key = ?,
           qrCodeS3Url = ?
       WHERE id = ?`,
      [uploaded.s3Key, uploaded.s3Url, id]
    );

    return this.getCommitteeById(id);
  }

  async getDashboard(inputCommitteeId: string) {
    const committeeId = await resolveCommitteeId(inputCommitteeId);
    const today = new Date().toISOString().split('T')[0];

    const todayDonations: any = await queryOne(
      "SELECT SUM(amount) as total, COUNT(*) as count FROM donations WHERE committeeId = ? AND DATE(date) = ? AND status = 'VERIFIED'",
      [committeeId, today]
    );
    const todayExpenses: any = await queryOne(
      'SELECT SUM(amount) as total, COUNT(*) as count FROM expenses WHERE committeeId = ? AND DATE(date) = ?',
      [committeeId, today]
    );
    const totalDonations: any = await queryOne(
      "SELECT SUM(amount) as total, COUNT(*) as count FROM donations WHERE committeeId = ? AND status = 'VERIFIED'",
      [committeeId]
    );
    const totalExpenses: any = await queryOne(
      'SELECT SUM(amount) as total, COUNT(*) as count FROM expenses WHERE committeeId = ?',
      [committeeId]
    );

    const upcomingEvents = await query(
      "SELECT * FROM events WHERE committeeId = ? ORDER BY date ASC LIMIT 5",
      [committeeId]
    );
    const recentReels = await query(
      'SELECT * FROM reels WHERE committeeId = ? ORDER BY createdAt DESC LIMIT 5',
      [committeeId]
    );
    const memberCountRes: any = await queryOne(
      'SELECT COUNT(*) as total FROM committee_members WHERE committeeId = ?',
      [committeeId]
    );
    
    const expenseCategories = await query(
      'SELECT category, SUM(amount) as amount FROM expenses WHERE committeeId = ? GROUP BY category',
      [committeeId]
    );

    return {
      today: {
        donations: todayDonations?.total || 0,
        donationCount: todayDonations?.count || 0,
        expenses: todayExpenses?.total || 0,
        expenseCount: todayExpenses?.count || 0,
      },
      total: {
        donations: totalDonations?.total || 0,
        donationCount: totalDonations?.count || 0,
        expenses: totalExpenses?.total || 0,
        expenseCount: totalExpenses?.count || 0,
        balance: (totalDonations?.total || 0) - (totalExpenses?.total || 0),
      },
      memberCount: memberCountRes?.total || 4,
      upcomingEvents: Array.isArray(upcomingEvents) ? upcomingEvents : [],
      recentReels: Array.isArray(recentReels) ? recentReels : [],
      expenseCategories: Array.isArray(expenseCategories) ? expenseCategories : [],
    };
  }
}

export const committeeService = new CommitteeService();
