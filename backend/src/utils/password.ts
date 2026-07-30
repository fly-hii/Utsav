import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a password with a hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a random temporary password
 */
export function generateTempPassword(length = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Generate a unique username from name and phone
 */
export function generateUsername(name: string, phone: string): string {
  const cleanName = name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8);
  const phoneSuffix = phone.slice(-4);
  return `${cleanName}${phoneSuffix}`;
}
