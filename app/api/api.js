import axios from "axios";
import Constants from "expo-constants";
import { API_SECRET } from "@env";
import CryptoJS from "crypto-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native"; 
import { router } from "expo-router";
import { PinSession } from "../../utils/session";

const { API_BASE_URL, STORAGE_BASE_URL } = Constants.expoConfig.extra;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Interceptor berjalan setiap kali ada request API
api.interceptors.request.use(
  (config) => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = (config.method || "GET").toUpperCase();

    let finalUrl = config.url;

    // 1. Tangani Query Parameters (GET)
    if (config.params) {
      const params = new URLSearchParams(config.params);
      params.sort();
      const queryString = params.toString();
      if (queryString) {
        finalUrl += (finalUrl.includes("?") ? "&" : "?") + queryString;
      }
      delete config.params;
      config.url = finalUrl;
    }

    let path =
      "api/v1" + (finalUrl.startsWith("/") ? finalUrl : "/" + finalUrl);

    // 2. Tangani Body Data (POST / PUT / PATCH)
    let bodyString = "";
    if (config.data && ["POST", "PUT", "PATCH"].includes(method)) {
      if (config.data instanceof FormData) {
        bodyString = ""; 
      } else {
        bodyString = typeof config.data === "string" ? config.data : JSON.stringify(config.data);
        config.data = bodyString;
      }
    }

    // 3. Gabungkan Payload: Method + Path + Timestamp + Body
    const payload = method + path + timestamp + bodyString;

    // 4. Generate Signature
    const signature = CryptoJS.HmacSHA256(payload, API_SECRET).toString(
      CryptoJS.enc.Hex,
    );

    config.headers["X-Timestamp"] = timestamp;
    config.headers["X-Signature"] = signature;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

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
