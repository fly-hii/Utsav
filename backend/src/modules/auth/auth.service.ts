import { query, queryOne } from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { v4 as uuidv4 } from 'uuid';
import { getPresignedUrl } from '../../config/s3';

interface RegisterInput {
  name: string;
  phone: string;
  email?: string;
  password: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface LoginInput {
  phone: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    role: string;
    avatar: string | null;
    avatarUrl: string | null;
  };
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<AuthTokens> {
    // Check if phone already exists
    const existingPhone = await queryOne('SELECT id FROM users WHERE phone = ?', [input.phone]);
    if (existingPhone) {
      throw { statusCode: 409, message: 'Phone number already registered' };
    }

    // Check if email already exists
    if (input.email) {
      const existingEmail = await queryOne('SELECT id FROM users WHERE email = ?', [input.email]);
      if (existingEmail) {
        throw { statusCode: 409, message: 'Email already registered' };
      }
    }

    // Hash password and create user
    const userId = uuidv4();
    const hashedPassword = await hashPassword(input.password);

    await query(
      `INSERT INTO users (id, name, phone, email, password, role, address, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, 'USER', ?, ?, ?)`,
      [
        userId,
        input.name,
        input.phone,
        input.email || null,
        hashedPassword,
        input.address || null,
        input.latitude || null,
        input.longitude || null,
      ]
    );

    // Generate tokens
    const tokens = await this.generateTokens(userId, 'USER');

    return {
      ...tokens,
      user: {
        id: userId,
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        role: 'USER',
        avatar: null,
        avatarUrl: null,
      },
    };
  }

  /**
   * Login with phone + password
   */
  async login(input: LoginInput): Promise<AuthTokens> {
    const user: any = await queryOne('SELECT * FROM users WHERE phone = ?', [input.phone]);

    if (!user) {
      throw { statusCode: 401, message: 'Invalid phone number or password' };
    }

    if (!user.isActive) {
      throw { statusCode: 403, message: 'Account is deactivated. Contact admin.' };
    }

    const isValid = await comparePassword(input.password, user.password);
    if (!isValid) {
      throw { statusCode: 401, message: 'Invalid phone number or password' };
    }

    const tokens = await this.generateTokens(user.id, user.role);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshTokenStr: string): Promise<{ accessToken: string; refreshToken: string }> {
    const decoded = verifyRefreshToken(refreshTokenStr);

    const storedToken: any = await queryOne('SELECT * FROM refresh_tokens WHERE token = ?', [
      refreshTokenStr,
    ]);

    if (!storedToken || new Date(storedToken.expiresAt) < new Date()) {
      if (storedToken) {
        await query('DELETE FROM refresh_tokens WHERE id = ?', [storedToken.id]);
      }
      throw { statusCode: 401, message: 'Invalid or expired refresh token' };
    }

    await query('DELETE FROM refresh_tokens WHERE id = ?', [storedToken.id]);
    return this.generateTokens(decoded.userId, decoded.role);
  }

  /**
   * Reset password
   */
  async resetPassword(phone: string, newPassword: string): Promise<void> {
    const user: any = await queryOne('SELECT id FROM users WHERE phone = ?', [phone]);
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const hashedPassword = await hashPassword(newPassword);
    await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
    await query('DELETE FROM refresh_tokens WHERE userId = ?', [user.id]);
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user: any = await queryOne(
      'SELECT id, name, phone, email, role, avatar, avatarUrl, address, latitude, longitude, isActive, createdAt FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const memberships = await query(
      `SELECT cm.role, c.id as committeeId, c.name, c.templeName, c.village, c.status, c.logo, c.logoUrl, c.qrCodeS3Key, c.qrCodeS3Url, c.upiId
       FROM committee_members cm
       JOIN committees c ON cm.committeeId = c.id
       WHERE cm.userId = ?`,
      [userId]
    );

    for (const m of memberships as any[]) {
      if (m.qrCodeS3Key) {
        try { m.qrCodeS3Url = await getPresignedUrl(m.qrCodeS3Key, 604800); } catch (e) {}
      }
      if (m.logo) {
        try { m.logoUrl = await getPresignedUrl(m.logo, 604800); } catch (e) {}
      }
    }

    return {
      ...user,
      committeeMemberships: memberships,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: Partial<any>) {
    await query(
      `UPDATE users
       SET name = COALESCE(?, name),
           email = COALESCE(?, email),
           address = COALESCE(?, address),
           latitude = COALESCE(?, latitude),
           longitude = COALESCE(?, longitude),
           avatar = COALESCE(?, avatar),
           avatarUrl = COALESCE(?, avatarUrl)
       WHERE id = ?`,
      [
        data.name || null,
        data.email || null,
        data.address || null,
        data.latitude || null,
        data.longitude || null,
        data.avatar || null,
        data.avatarUrl || null,
        userId,
      ]
    );

    return this.getProfile(userId);
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPw: string, newPw: string): Promise<void> {
    const user: any = await queryOne('SELECT id, password FROM users WHERE id = ?', [userId]);
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }
    const isMatch = await comparePassword(currentPw, user.password);
    if (!isMatch) {
      throw { statusCode: 400, message: 'Current password is incorrect' };
    }
    const hashedPw = await hashPassword(newPw);
    await query('UPDATE users SET password = ? WHERE id = ?', [hashedPw, userId]);
  }

  /**
   * Generate access and refresh tokens, store refresh token in RDS MySQL
   */
  private async generateTokens(userId: string, role: string) {
    const accessToken = generateAccessToken({ userId, role });
    const refreshToken = generateRefreshToken({ userId, role });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 6);

    const id = uuidv4();
    await query(
      'INSERT INTO refresh_tokens (id, userId, token, expiresAt) VALUES (?, ?, ?, ?)',
      [id, userId, refreshToken, expiresAt]
    );

    return { accessToken, refreshToken };
  }

  public async updatePushToken(userId: string, token: string): Promise<void> {
    await query(
      `UPDATE users SET push_token = ? WHERE id = ?`,
      [token, userId]
    );
  }
}

export const authService = new AuthService();
