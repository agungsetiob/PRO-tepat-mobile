import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import api from "../api/api";
import tw from "twrnc";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";

const { STORAGE_BASE_URL } = Constants.expoConfig.extra;

export default function RundownDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [rundownData, setRundownData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("rundown"); // 'rundown' atau 'presensi'
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      const response = await api.get(`/generated-rundowns/${id}`);
      if (response.data.success) {
        setRundownData(response.data.data);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal memuat detail rundown.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi memicu Kamera HP Protokol & kirim data presensi ke Laravel
  const handlePresence = async (invitationId, statusTarget) => {
    if (statusTarget === "tidak_hadir") {
      // Jika tidak hadir, langsung tembak tanpa foto
      executePresenceUpload(invitationId, statusTarget, null);
      return;
    }

    // Jika hadir, minta izin kamera dan ambil foto pejabat bersangkutan
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Izin Ditolak", "Aplikasi butuh akses kamera untuk mengambil foto bukti fisik kehadiran.");
      return;
    }

    const cameraResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
    });

    if (!cameraResult.canceled && cameraResult.assets[0]) {
      executePresenceUpload(invitationId, statusTarget, cameraResult.assets[0].uri);
    }
  };

  const executePresenceUpload = async (invitationId, status, imageUri) => {
    setUpdatingId(invitationId);
    try {
      const formData = new FormData();
      formData.append("status", status);

      if (imageUri) {
        const filename = imageUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append("photo", { uri: imageUri, name: filename, type });
      }

      const response = await api.post(`/invitations/${invitationId}/presence`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        // Update state lokal undangan biar UI langsung berubah warna
        setRundownData((prev) => ({
          ...prev,
          invitations: prev.invitations.map((inv) =>
            inv.id === invitationId ? { ...inv, status: response.data.data.status, presence_photo: response.data.data.presence_photo } : inv
          ),
        }));
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Gagal", "Gagal memperbarui status kehadiran.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading || !rundownData) {
    return (
      <View style={tw`flex-1 bg-[#0d1731] justify-center items-center`}>
        <ActivityIndicator size="large" color="#3bd9e8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-[#0d1731]`} edges={["bottom", "left", "right"]}>
      {/* HEADER BANNER */}
      <LinearGradient colors={["#3bd9e8", "#9359e9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`px-5 pt-8 pb-4 rounded-b-3xl shadow-md`}>
        <View style={tw`flex-row items-center mb-3`}>
          <TouchableOpacity onPress={() => router.back()} style={tw`mr-3`}><Text style={tw`text-white text-xl font-bold`}>❮</Text></TouchableOpacity>
          <Text style={tw`text-white text-base font-black uppercase flex-1`} numberOfLines={1}>{rundownData.event_name}</Text>
        </View>
        <Text style={tw`text-teal-100 text-[11px] font-medium`}>📍 {rundownData.location} • 📅 {rundownData.date}</Text>
      </LinearGradient>

      {/* NAVIGATOR TAB BAR */}
      <View style={tw`flex-row mx-5 bg-slate-800 p-1 rounded-xl mt-4 border border-slate-700`}>
        <TouchableOpacity onPress={() => setActiveTab("rundown")} style={tw`flex-1 py-2 rounded-lg items-center ${activeTab === "rundown" ? "bg-teal-500" : ""}`}>
          <Text style={tw`text-xs font-black uppercase ${activeTab === "rundown" ? "text-slate-900" : "text-slate-400"}`}>⚡ Rundown</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab("presensi")} style={tw`flex-1 py-2 rounded-lg items-center ${activeTab === "presensi" ? "bg-indigo-500" : ""}`}>
          <Text style={tw`text-xs font-black uppercase ${activeTab === "presensi" ? "text-white" : "text-slate-400"}`}>👥 Presensi VIP</Text>
        </TouchableOpacity>
      </View>

      {/* MONITORING KONTEN TAB */}
      {activeTab === "rundown" ? (
        <FlatList
          data={rundownData.items}
          keyExtractor={(item) => "det-row-" + item.id}
          contentContainerStyle={tw`px-5 pt-4 pb-10`}
          renderItem={({ item, index }) => (
            <View style={tw`bg-slate-800/60 border border-slate-700 p-3.5 rounded-2xl mb-2.5 flex-row gap-3 items-center`}>
              <Text style={tw`text-teal-400 font-black text-xs`}>#{index + 1}</Text>
              <View style={tw`flex-1`}>
                <Text style={tw`text-white text-xs font-bold mb-0.5`}>{item.master_agenda?.name}</Text>
                <Text style={tw`text-slate-400 text-[10px]`}>⏱️ Rentang: {item.start_time} - {item.end_time} WITA</Text>
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={rundownData.invitations}
          keyExtractor={(item) => "inv-row-" + item.id}
          contentContainerStyle={tw`px-5 pt-4 pb-10`}
          renderItem={({ item }) => {
            // Evaluasi warna latar baris berdasarkan status presensi saat ini
            let statusColor = "border-slate-700 bg-slate-800/60";
            if (item.status === "hadir") statusColor = "border-emerald-500/40 bg-emerald-950/20";
            if (item.status === "tidak_hadir") statusColor = "border-red-500/30 bg-red-950/20";

            return (
              <View style={tw`border p-3.5 rounded-2xl mb-3 ${statusColor}`}>
                <View style={tw`flex-row justify-between items-start mb-2.5`}>
                  <View style={tw`flex-1 mr-2`}>
                    <Text style={tw`text-white text-sm font-black uppercase`}>{item.honorific?.jabatan}</Text>
                    <Text style={tw`text-slate-400 text-[11px] mt-0.5`}>👤 Sapaan Resmi: {item.honorific?.sapaan_resmi || "-"}</Text>
                    <Text style={tw`text-amber-300/90 text-[10px] italic mt-0.5`}>📢 Sapaan Lisan: "{item.honorific?.sapaan_lisan}"</Text>
                  </View>
                  
                  {/* Foto Bukti Kehadiran */}
                  {item.status === "hadir" && item.presence_photo && (
                    <Image source={{ uri: `${STORAGE_BASE_URL}${item.presence_photo}` }} style={tw`w-12 h-16 bg-slate-700 rounded-lg border border-slate-600`} resizeMode="cover" />
                  )}
                </View>

                {/* AREA ACTION BUTTON PROTOKOL */}
                <View style={tw`flex-row gap-2 border-t border-slate-800 pt-2.5 mt-1`}>
                  {updatingId === item.id ? (
                    <ActivityIndicator size="small" color="#3bd9e8" style={tw`mx-auto`} />
                  ) : (
                    <>
                      <TouchableOpacity
                        onPress={() => handlePresence(item.id, "hadir")}
                        style={tw`flex-1 py-2 rounded-xl items-center flex-row justify-center gap-1.5 ${item.status === "hadir" ? "bg-emerald-600" : "bg-slate-700"}`}
                      >
                        <Text style={tw`text-[11px] font-black text-white uppercase`}>📸 Hadir</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handlePresence(item.id, "tidak_hadir")}
                        style={tw`flex-1 py-2 rounded-xl items-center flex-row justify-center gap-1.5 ${item.status === "tidak_hadir" ? "bg-red-600" : "bg-slate-700"}`}
                      >
                        <Text style={tw`text-[11px] font-black text-white uppercase`}>❌ Absen</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}