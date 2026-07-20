import React, { useState, useEffect, useRef } from "react";
import { Modal, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/api";
import tw from "twrnc";
import { PinSession } from "../utils/session";

export default function PinGateModal({ visible, onAuthSuccess, onClose }) {
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingLocal, setCheckingLocal] = useState(true);

  const inputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setCheckingLocal(true);
      checkLivePinWithSavedString();
    } else {
      setPin("");
      setErrorMsg("");
    }
  }, [visible]);

  useEffect(() => {
    if (visible && !checkingLocal) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible, checkingLocal]);

  const checkLivePinWithSavedString = async () => {
    try {
      const savedPin = await AsyncStorage.getItem("saved_protokol_pin_string");

      if (savedPin && savedPin.length === 6) {
        const response = await api.post("/rundowns/verify-pin", { pin: savedPin });

        if (response.data.success) {
          PinSession.isVerified = true;
          api.defaults.headers.common['X-Protokol-Pin'] = savedPin;
          onAuthSuccess();
          return;
        }
      }
    } catch (error) {
      const status = error.response?.status;
      if (status === 401 || status === 403 || status === 422 || status === 400) {
        await AsyncStorage.removeItem("saved_protokol_pin_string");
        delete api.defaults.headers.common['X-Protokol-Pin'];
      }
    } finally {
      setCheckingLocal(false);
    }
  };

  const handleVerify = async () => {
    if (pin.length !== 6) {
      setErrorMsg("PIN harus 6 digit angka!");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const response = await api.post("/rundowns/verify-pin", { pin });
      if (response.data.success) {
        await AsyncStorage.setItem("saved_protokol_pin_string", pin);
        
        PinSession.isVerified = true;
        api.defaults.headers.common['X-Protokol-Pin'] = pin; 
        
        setPin("");
        onAuthSuccess();
      }
    } catch (error) {
      if (error.response?.status === 429) {
        setErrorMsg(error.response?.data?.message || "Terlalu banyak percobaan. Tunggu sesaat.");
      } else {
        setErrorMsg(error.response?.data?.message || "PIN Salah atau Sudah Dinonaktifkan!");
      }
      setPin("");
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  if (visible && checkingLocal) {
    return (
      <Modal visible={visible} animationType="none" transparent={true}>
        <View style={tw`flex-1 bg-black/85 justify-center items-center`}>
          <ActivityIndicator size="large" color="#3bd9e8" />
          <Text style={tw`text-[10px] text-slate-400 mt-2 tracking-wider`}>Memvalidasi Keamanan...</Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={tw`flex-1 bg-black/85 justify-center items-center px-6`}>
        <View style={tw`bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl`}>
          <Text style={tw`text-white text-base font-black uppercase text-center tracking-wide mb-1`}>
            🔒 Kunci Akses Protokol
          </Text>
          <Text style={tw`text-slate-400 text-xs text-center mb-5`}>
            Masukkan 6 digit PIN dinamis untuk akses fitur ini.
          </Text>

          <View style={tw`relative w-full mb-3`}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => inputRef.current?.focus()}
              style={tw`flex-row justify-between w-full`}
            >
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const isFilled = pin.length > index;
                const isCurrent = pin.length === index;
                const hasError = !!errorMsg;

                let borderColor = "border-slate-700";
                if (hasError) borderColor = "border-red-500";
                else if (isCurrent) borderColor = "border-purple-500";

                return (
                  <View
                    key={index}
                    style={tw`w-11 h-14 bg-slate-800 border-2 ${borderColor} rounded-xl justify-center items-center`}
                  >
                    {isFilled ? (
                      <View style={tw`w-3 h-3 bg-white rounded-full`} />
                    ) : null}
                  </View>
                );
              })}
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              value={pin}
              onChangeText={(txt) => {
                setPin(txt.replace(/[^0-9]/g, ""));
                if (errorMsg) setErrorMsg("");
              }}
              keyboardType="number-pad"
              maxLength={6}
              caretHidden={true}
              style={tw`absolute w-full h-full opacity-0`}
            />
          </View>

          {errorMsg ? <Text style={tw`text-red-400 text-[11px] text-center mb-3 font-medium`}>{errorMsg}</Text> : null}

          <View style={tw`flex-row gap-3 mt-2`}>
            <TouchableOpacity
              onPress={() => {
                setPin("");
                setErrorMsg("");
                onClose();
              }}
              style={tw`flex-1 bg-slate-800 py-3 rounded-xl items-center`}
            >
              <Text style={tw`text-slate-400 text-xs font-bold uppercase`}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleVerify} disabled={loading || pin.length !== 6} style={tw`flex-1 ${pin.length === 6 ? 'bg-purple-600' : 'bg-purple-900'} py-3 rounded-xl items-center justify-center`}>
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={tw`text-white text-xs font-black uppercase ${pin.length === 6 ? '' : 'opacity-50'}`}>Buka Akses</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}