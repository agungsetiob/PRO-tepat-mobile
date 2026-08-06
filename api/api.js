import axios from "axios";
import { API_BASE_URL, EXPO_PUBLIC_API_KEY } from '@env';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PinSession } from "../utils/session";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-API-KEY': EXPO_PUBLIC_API_KEY,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem("saved_protokol_pin_string");
      delete api.defaults.headers.common['X-Protokol-Pin'];
      PinSession.isVerified = false;
    }
    return Promise.reject(error);
  }
);

export default api;
