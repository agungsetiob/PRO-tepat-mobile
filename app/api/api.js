import axios from 'axios';
import Constants from 'expo-constants';
import { API_KEY } from '@env';

const { API_BASE_URL, STORAGE_BASE_URL } = Constants.expoConfig.extra;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-API-KEY': API_KEY,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});
export { API_BASE_URL, STORAGE_BASE_URL };
export default api;