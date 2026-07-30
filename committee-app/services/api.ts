import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';

const getBackendUrl = () => {
  // Use production URL in production builds
  if (!__DEV__) {
    return 'https://utsavbackend.flyhii.in/api';
  }

  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    // debuggerHost could be exp://192.168.x.x:8081 or 192.168.x.x:8081
    const hostWithoutScheme = debuggerHost.replace(/^exp:\/\//, '').replace(/^http:\/\//, '');
    const ip = hostWithoutScheme.split(':')[0];
    // If it's localhost or 127.0.0.1 on Android, use 10.0.2.2 for emulator support
    if (Platform.OS === 'android' && (ip === 'localhost' || ip === '127.0.0.1')) {
      return 'http://10.0.2.2:5005/api';
    }
    return `http://${ip}:5005/api`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:5005/api' : 'http://localhost:5005/api';
};

const API_BASE_URL = getBackendUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

import AsyncStorage from '@react-native-async-storage/async-storage';

let authToken: string | null = null;
let refreshTokenStr: string | null = null;

export const setAuthToken = async (token: string | null, refreshToken?: string | null) => {
  authToken = token;
  if (refreshToken !== undefined) {
    refreshTokenStr = refreshToken;
  }

  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    await AsyncStorage.setItem('authToken', token).catch(() => { });
    if (refreshToken) await AsyncStorage.setItem('refreshToken', refreshToken).catch(() => { });
  } else {
    delete api.defaults.headers.common['Authorization'];
    await AsyncStorage.removeItem('authToken').catch(() => { });
    await AsyncStorage.removeItem('refreshToken').catch(() => { });
  }
};

export const initializeAuth = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const refresh = await AsyncStorage.getItem('refreshToken');
    if (token) {
      authToken = token;
      refreshTokenStr = refresh;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Verify token is still valid against the database (handles backend resets)
      try {
        await api.get('/auth/me');
        return true;
      } catch (err: any) {
        if (err.response?.status === 404 || err.response?.status === 401) {
          await setAuthToken(null, null);
          return false;
        }
      }
      return true;
    }
  } catch (e) { }
  return false;
};

// Axios response interceptor for auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      originalRequest._retry = true;
      try {
        const storedRefresh = await AsyncStorage.getItem('refreshToken');
        if (storedRefresh) {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken: storedRefresh });
          if (res.data?.data?.accessToken) {
            await setAuthToken(res.data.data.accessToken, res.data.data.refreshToken);
            originalRequest.headers['Authorization'] = `Bearer ${res.data.data.accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        await setAuthToken(null, null);
      }
    }
    return Promise.reject(error);
  }
);

export const CommitteeAuthService = {
  login: async (phone: string, password: string) => {
    const res = await api.post('/auth/login', { phone, password });
    if (res.data?.data?.accessToken) {
      setAuthToken(res.data.data.accessToken, res.data.data.refreshToken);
    }
    return res.data;
  },
  registerCommittee: async (data: any) => {
    const res = await api.post('/committees/register', data);
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await api.post('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },
  logout: async () => {
    setAuthToken(null);
  },
};

export const CommitteeManagementService = {
  getDashboard: async (committeeId: string) => {
    const res = await api.get(`/committees/${committeeId}/dashboard`);
    return res.data;
  },
  updateCommittee: async (committeeId: string, data: any) => {
    const res = await api.put(`/committees/${committeeId}`, data);
    return res.data;
  },
  uploadQRCode: async (committeeId: string, imageUri: string) => {
    const response = await FileSystem.uploadAsync(`${API_BASE_URL}/committees/${committeeId}/qrcode`, imageUri, {
      httpMethod: 'PUT',
      uploadType: 1 as any, // FileSystemUploadType.MULTIPART
      fieldName: 'file',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    const resBody = JSON.parse(response.body);
    if (response.status >= 400) throw new Error(resBody.message || 'QR Code upload failed');
    return resBody;
  },
  getMembers: async (committeeId: string) => {
    const res = await api.get(`/committees/${committeeId}/members`);
    return res.data;
  },
  addMember: async (committeeId: string, data: { name: string; phone: string; role?: string }) => {
    const res = await api.post(`/committees/${committeeId}/members`, data);
    return res.data;
  },
  getDonations: async (committeeId: string) => {
    const res = await api.get(`/committees/${committeeId}/donations`);
    return res.data;
  },
  addDonation: async (committeeId: string, data: any) => {
    const res = await api.post(`/committees/${committeeId}/donations`, data);
    return res.data;
  },
  verifyDonation: async (donationId: string, status: 'VERIFIED' | 'REJECTED') => {
    const res = await api.put(`/donations/${donationId}/verify`, { status });
    return res.data;
  },
  getExpenses: async (committeeId: string) => {
    const res = await api.get(`/committees/${committeeId}/expenses`);
    return res.data;
  },
  addExpense: async (committeeId: string, data: any) => {
    const res = await api.post(`/committees/${committeeId}/expenses`, data);
    return res.data;
  },
  getEvents: async (committeeId: string) => {
    const res = await api.get(`/committees/${committeeId}/events`);
    return res.data;
  },
  createEvent: async (committeeId: string, data: any) => {
    const res = await api.post(`/committees/${committeeId}/events`, data);
    return res.data;
  },
  getReport: async (committeeId: string) => {
    const res = await api.get(`/reports/committee/${committeeId}`);
    return res.data;
  },
};

export const ReelService = {
  createWithVideo: async (videoUri: string, parameters: Record<string, string>) => {
    const response = await FileSystem.uploadAsync(`${API_BASE_URL}/reels`, videoUri, {
      httpMethod: 'POST',
      uploadType: 1 as any, // FileSystemUploadType.MULTIPART
      fieldName: 'video',
      parameters,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    const resBody = JSON.parse(response.body);
    if (response.status >= 400) throw new Error(resBody.message || 'Upload failed');
    return resBody;
  },
  create: async (data: any) => {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    if (isFormData) {
      const response = await fetch(`${API_BASE_URL}/reels`, {
        method: 'POST',
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
        body: data,
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.message || 'Upload failed');
      return res;
    } else {
      const res = await api.post('/reels', data);
      return res.data;
    }
  },
  getAll: async () => {
    const res = await api.get('/reels');
    return res.data;
  },
  delete: async (reelId: string) => {
    const res = await api.delete(`/reels/${reelId}`);
    return res.data;
  },
  update: async (reelId: string, data: any) => {
    const res = await api.put(`/reels/${reelId}`, data);
    return res.data;
  },
};
