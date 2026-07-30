import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').max(50),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const loginSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
});

export const resetPasswordSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  avatar: z.string().optional(),
  avatarUrl: z.string().optional(),
});
