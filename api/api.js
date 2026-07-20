import axios from "axios";
import Constants from "expo-constants";
import CryptoJS from "crypto-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native"; 
import { router } from "expo-router";
import { PinSession } from "../utils/session";

const { API_BASE_URL, STORAGE_BASE_URL } = Constants.expoConfig.extra;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-API-KEY': process.env.EXPO_PUBLIC_API_KEY,
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

export { API_BASE_URL, STORAGE_BASE_URL };
export default api;
