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
    await AsyncStorage.setItem('authToken', token).catch(() => {});
    if (refreshToken) await AsyncStorage.setItem('refreshToken', refreshToken).catch(() => {});
  } else {
    delete api.defaults.headers.common['Authorization'];
    await AsyncStorage.removeItem('authToken').catch(() => {});
    await AsyncStorage.removeItem('refreshToken').catch(() => {});
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
  } catch (e) {}
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

export const AuthService = {
  login: async (phone: string, password: string) => {
    const res = await api.post('/auth/login', { phone, password });
    if (res.data?.data?.accessToken) {
      setAuthToken(res.data.data.accessToken, res.data.data.refreshToken);
    }
    return res.data;
  },
  register: async (data: { name: string; phone: string; password: string; email?: string }) => {
    const res = await api.post('/auth/register', data);
    if (res.data?.data?.accessToken) {
      setAuthToken(res.data.data.accessToken, res.data.data.refreshToken);
    }
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  updateProfile: async (data: any, imageUri?: string) => {
    if (imageUri) {
      const response = await FileSystem.uploadAsync(`${API_BASE_URL}/upload`, imageUri, {
        httpMethod: 'POST',
        uploadType: 1 as any, // FileSystemUploadType.MULTIPART
        fieldName: 'file',
        parameters: { folder: 'avatars' },
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      const resBody = JSON.parse(response.body);
      if (response.status >= 400) throw new Error(resBody.message || 'Image upload failed');
      
      const avatarUrl = resBody.data?.s3Url || resBody.s3Url;
      const avatarKey = resBody.data?.s3Key || resBody.s3Key;
      
      if (avatarUrl) data.avatarUrl = avatarUrl;
      if (avatarKey) data.avatar = avatarKey;
    }
    const res = await api.put('/auth/profile', data);
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

export const CommitteeService = {
  getAll: async (params?: { village?: string; district?: string; search?: string }) => {
    const res = await api.get('/committees', { params });
    return res.data;
  },
  getNearby: async (latitude: number, longitude: number, radius = 50) => {
    const res = await api.get('/committees/nearby', { params: { latitude, longitude, radius } });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get(`/committees/${id}`);
    return res.data;
  },
};

export const EventService = {
  getAll: async (params?: { status?: string; committeeId?: string }) => {
    const res = await api.get('/events', { params });
    return res.data;
  },
};

export const DonationService = {
  create: async (data: any, imageUri?: string) => {
    if (imageUri) {
      const cleanData: Record<string, string> = {};
      Object.keys(data).forEach(k => {
        if (data[k] !== undefined && data[k] !== null) {
          cleanData[k] = String(data[k]);
        }
      });
      const response = await FileSystem.uploadAsync(`${API_BASE_URL}/donations`, imageUri, {
        httpMethod: 'POST',
        uploadType: 1 as any,
        fieldName: 'file',
        parameters: cleanData,
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      const resBody = JSON.parse(response.body);
      if (response.status >= 400) throw new Error(resBody.message || 'Donation failed');
      return resBody;
    } else {
      const res = await api.post('/donations', data);
      return res.data;
    }
  },
  getMyDonations: async () => {
    const res = await api.get('/donations/my-donations');
    return res.data;
  },
};

export const ReelService = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const res = await api.get('/reels', { params });
    return res.data;
  },
  like: async (reelId: string) => {
    const res = await api.post(`/reels/${reelId}/like`);
    return res.data;
  },
  getComments: async (reelId: string) => {
    const res = await api.get(`/reels/${reelId}/comments`);
    return res.data;
  },
  addComment: async (reelId: string, content: string) => {
    const res = await api.post(`/reels/${reelId}/comments`, { content });
    return res.data;
  },
  delete: async (reelId: string) => {
    const res = await api.delete(`/reels/${reelId}`);
    return res.data;
  },
};
