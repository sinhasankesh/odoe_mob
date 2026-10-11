import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001').replace(/\/$/, '');
const TOKEN_KEY = 'odoe.session.token';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.name = 'ApiError'; this.status = status; }
}

export async function saveToken(token: string) {
  if (Platform.OS === 'web') await AsyncStorage.setItem(TOKEN_KEY, token);
  else await SecureStore.setItemAsync(TOKEN_KEY, token);
}
export async function getToken() {
  return Platform.OS === 'web' ? AsyncStorage.getItem(TOKEN_KEY) : SecureStore.getItemAsync(TOKEN_KEY);
}
export async function clearToken() {
  if (Platform.OS === 'web') await AsyncStorage.removeItem(TOKEN_KEY);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function api<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const stored = token === undefined ? await getToken() : token;
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (stored) headers.set('Authorization', `Bearer ${stored}`);
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api${path}`, { ...options, headers });
  } catch (error: any) {
    if (error?.name === 'AbortError') throw error;
    const loopback = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(API_URL);
    const message = loopback
      ? `Could not reach Odoe at ${API_URL}. On a physical phone, replace localhost with your computer’s Wi-Fi IP in .env.`
      : `Could not reach Odoe at ${API_URL}. Check that the backend is running, your device can reach this address, and both are on the same network.`;
    throw new ApiError(message, 0);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && token !== null) await clearToken();
    throw new ApiError(body.message || body.error || 'Something went wrong. Please try again.', response.status);
  }
  return body as T;
}

export function unwrap<T>(body: any): T {
  if (body?.success === false) throw new ApiError(body.message || 'Request failed.', 400);
  return (body?.data ?? body) as T;
}

export function query(values: Record<string, string | number | undefined | null>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') params.set(key, String(value)); });
  return params.toString();
}
