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
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../../api/api";
import tw from "twrnc";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";
import { ArrowLeft } from "lucide-react-native";
import PinGateModal from "../../../components/PinGateModal";
import { STORAGE_BASE_URL } from '@env';

export default function RundownDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [rundownData, setRundownData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("rundown"); 
  const [updatingId, setUpdatingId] = useState(null);

  const [pinModalVisible, setPinModalVisible] = useState(false);
  
  const [pendingAction, setPendingAction] = useState(null); 

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

  const handlePresencePress = async (invitationId, statusTarget) => {
    try {
      const savedPin = await AsyncStorage.getItem("saved_protokol_pin_string");
      
      if (savedPin && savedPin.length === 6) {
        setUpdatingId(invitationId);
        const response = await api.post("/rundowns/verify-pin", { pin: savedPin });
        setUpdatingId(null);
        
        if (response.data.success) {
          proceedWithPresence(invitationId, statusTarget);
          return;
        }
      }
      
      setPendingAction({ action: 'proceed', invitationId, statusTarget });
      setPinModalVisible(true);

    } catch (error) {
      setUpdatingId(null);
      setPendingAction({ action: 'proceed', invitationId, statusTarget });
      setPinModalVisible(true);
    }
  };

  const proceedWithPresence = async (invitationId, statusTarget) => {
    if (statusTarget === "tidak_hadir") {
      executePresenceUpload(invitationId, statusTarget, null);
      return;
    }

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
      executePresenceUpload(
        invitationId,
        statusTarget,
        cameraResult.assets[0].uri,
      );
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

      const response = await api.post(
        `/invitations/${invitationId}/presence`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.data.success) {
        setRundownData((prev) => ({
          ...prev,
          invitations: prev.invitations.map((inv) =>
            inv.id === invitationId
              ? {
                  ...inv,
                  status: response.data.data.status,
                  presence_photo: response.data.data.presence_photo,
                }
              : inv,
          ),
        }));
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setPendingAction({ action: 'upload', invitationId, statusTarget: status, imageUri });
        setPinModalVisible(true);
      } else {
        Alert.alert("Gagal", "Gagal memperbarui status kehadiran.");
      }
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
          <TouchableOpacity onPress={() => router.back()} style={tw`mr-3`}>
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={tw`text-white text-base font-black uppercase flex-1`} numberOfLines={1}>
            {rundownData.event_name}
          </Text>
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
            let cardStyle = tw`bg-slate-800/80 border-slate-700/60 opacity-100`;
            let leftBarColor = tw`bg-slate-600`;

            if (item.status === "hadir") {
              cardStyle = tw`bg-emerald-950/20 border-emerald-500/30 opacity-100`;
              leftBarColor = tw`bg-emerald-500 shadow-emerald-500/50`;
            } else if (item.status === "tidak_hadir") {
              cardStyle = tw`bg-slate-900/40 border-red-500/20 opacity-60`;
              leftBarColor = tw`bg-red-500`;
            }

            return (
              <View style={[tw`border rounded-2xl mb-3 flex-row overflow-hidden`, cardStyle]}>
                <View style={[tw`w-1.5 h-full`, leftBarColor]} />
                <View style={tw`flex-1 p-3.5`}>
                  <View style={tw`flex-row justify-between items-start mb-2.5`}>
                    <View style={tw`flex-1 mr-2`}>
                      <Text style={tw`text-white text-sm font-black uppercase tracking-wide`}>{item.honorific?.jabatan}</Text>
                      <Text style={tw`text-slate-400 text-[11px] mt-0.5 font-medium`}>👤 Nama: {item.honorific?.sapaan_resmi || "-"}</Text>
                      <Text style={tw`text-amber-300/80 text-[10px] italic mt-0.5 font-medium`}>📢 Sapaan: "{item.honorific?.sapaan_lisan}"</Text>
                    </View>

                    {item.status === "hadir" && item.presence_photo && (
                      <Image
                        source={{ uri: `${STORAGE_BASE_URL}${item.presence_photo}` }}
                        style={tw`w-16 h-12 bg-slate-700 rounded-xl border border-emerald-500/30`}
                        resizeMode="cover"
                      />
                    )}
                  </View>

                  <View style={tw`flex-row gap-2 border-t border-slate-800/60 pt-2.5 mt-1`}>
                    {updatingId === item.id ? (
                      <ActivityIndicator size="small" color="#3bd9e8" style={tw`mx-auto py-1`} />
                    ) : (
                      <>
                        <TouchableOpacity onPress={() => handlePresencePress(item.id, "hadir")} style={tw`flex-1 py-2 rounded-xl items-center justify-center flex-row gap-1.5 ${item.status === "hadir" ? "bg-emerald-600 shadow-md" : "bg-slate-700/50 border border-slate-600/40"}`}>
                          <Text style={tw`text-[11px] font-black text-white uppercase`}>📸 Hadir</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => handlePresencePress(item.id, "tidak_hadir")} style={tw`flex-1 py-2 rounded-xl items-center justify-center flex-row gap-1.5 ${item.status === "tidak_hadir" ? "bg-red-600 shadow-md" : "bg-slate-700/50 border border-slate-600/40"}`}>
                          <Text style={tw`text-[11px] font-black text-white uppercase`}>❌ Absen</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      <PinGateModal
        visible={pinModalVisible}
        onClose={() => {
          setPinModalVisible(false);
          setPendingAction(null);
        }}
        onAuthSuccess={() => {
          setPinModalVisible(false);
          if (pendingAction) {
            if (pendingAction.action === 'upload') {
              executePresenceUpload(pendingAction.invitationId, pendingAction.statusTarget, pendingAction.imageUri);
            } else {
              proceedWithPresence(pendingAction.invitationId, pendingAction.statusTarget);
            }
            setPendingAction(null);
          }
        }}
      />
    </SafeAreaView>
  );
}