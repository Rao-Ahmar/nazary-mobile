import axios from 'axios';

// Use your machine's local IP so the phone/emulator can reach the Rails server
const BASE_URL = 'http://192.168.100.65:3000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/** Attach bearer token to every request when available. */
export function setAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
}
