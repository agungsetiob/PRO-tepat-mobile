import React, { useState, useEffect } from "react";
import { Modal, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/api"; // Pastikan path instance api Mas sudah benar
import tw from "twrnc";

export default function PinGateModal({ visible, onAuthSuccess, onClose }) {
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingLocal, setCheckingLocal] = useState(true);

  useEffect(() => {
    if (visible) {
      checkLivePinWithSavedString();
    }
  }, [visible]);

  const checkLivePinWithSavedString = async () => {
    try {
      const savedPin = await AsyncStorage.getItem("saved_protokol_pin_string");
      
      if (savedPin && savedPin.length === 6) {
        setLoading(true);
        const response = await api.post("/rundowns/verify-pin", { pin: savedPin });
        
        if (response.data.success) {
          setLoading(false);
          setCheckingLocal(false);
          onAuthSuccess();
          return;
        }
      }
    } catch (error) {
      await AsyncStorage.removeItem("saved_protokol_pin_string");
    } finally {
      setLoading(false);
      setCheckingLocal(false);
    }
  };

  const handleVerify = async () => {
    if (pin.length !== 6) {
      setErrorMsg("PIN harus terdiri dari 6 digit angka!");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const response = await api.post("/rundowns/verify-pin", { pin });
      if (response.data.success) {
        await AsyncStorage.setItem("saved_protokol_pin_string", pin);
        setPin("");
        onAuthSuccess();
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "PIN Salah atau Sudah Dinonaktifkan!");
    } finally {
      setLoading(false);
    }
  };

  if (visible && checkingLocal && loading) {
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

          <TextInput
            value={pin}
            onChangeText={(txt) => setPin(txt.replace(/[^0-9]/g, ""))}
            placeholder="• • • • • •"
            placeholderTextColor="#475569"
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry={true}
            style={tw`bg-slate-800 border-2 ${errorMsg ? "border-red-500" : "border-slate-700"} text-white text-center text-xl font-bold tracking-widest rounded-2xl p-3.5 mb-3`}
          />

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

            <TouchableOpacity onPress={handleVerify} disabled={loading} style={tw`flex-1 bg-purple-600 py-3 rounded-xl items-center justify-center`}>
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={tw`text-white text-xs font-black uppercase`}>Buka Akses</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}