import { z } from 'zod';

export const registerCommitteeSchema = z.object({
  name: z.string().min(2, 'Committee name is required').max(200),
  templeName: z.string().min(2, 'Temple name is required').max(200),
  festivalName: z.string().min(2, 'Festival name is required').max(200),
  village: z.string().min(1, 'Village is required').max(100),
  mandal: z.string().min(1, 'Mandal is required').max(100),
  district: z.string().min(1, 'District is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  address: z.string().min(5, 'Address is required'),
  latitude: z.number({ required_error: 'Latitude is required' }),
  longitude: z.number({ required_error: 'Longitude is required' }),
  presidentName: z.string().min(2, 'President name is required').max(100),
  secretaryName: z.string().min(2, 'Secretary name is required').max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  email: z.string().email().optional().or(z.literal('')),
  description: z.string().optional(),
});

export const updateCommitteeSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  templeName: z.string().min(2).max(200).optional(),
  festivalName: z.string().min(2).max(200).optional(),
  village: z.string().max(100).optional(),
  mandal: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  presidentName: z.string().max(100).optional(),
  secretaryName: z.string().max(100).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  description: z.string().optional(),
});

export const nearbyQuerySchema = z.object({
  latitude: z.string().transform(Number),
  longitude: z.string().transform(Number),
  radius: z.string().transform(Number).optional(), // in km, default 25
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

export const committeeListQuerySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  status: z.string().optional(),
});
