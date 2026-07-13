import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "./../api/api";
import tw from "twrnc";
import { LinearGradient } from "expo-linear-gradient";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import {
  Download,
  FileText,
  ChevronLeft,
  Calendar,
  User,
  HardDrive,
} from "lucide-react-native";

export default function ManualDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [manual, setManual] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      const response = await api.get(`/manual-books/${id}`);
      if (response.data.success) {
        setManual(response.data.data);
      } else {
        Alert.alert("Error", "Gagal memuat detail manual book.");
      }
    } catch (error) {
      console.error("Error fetching manual detail:", error);
      Alert.alert("Error", "Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!manual || isDownloading) return;

    setIsDownloading(true);

    try {
      const downloadUrl = `${api.defaults.baseURL}/manual-books/${id}/download`;
      const ext = manual.file_name.split(".").pop() || "pdf";

      const uniqueSuffix = Date.now();
      const fileName = `${manual.title.replace(/[^\w]/g, "_")}-${uniqueSuffix}.${ext}`;

      const targetFile = new File(Paths.cache, fileName);
      if (targetFile.exists) {
        await targetFile.deleteAsync();
      }

      const downloadedFile = await File.downloadFileAsync(
        downloadUrl,
        targetFile,
        {
          headers: {
            "X-API-KEY": api.defaults.headers["X-API-KEY"] || "",
          },
        },
      );

      if (downloadedFile.exists) {
        const isSharingAvailable = await Sharing.isAvailableAsync();

        if (isSharingAvailable) {
          await Sharing.shareAsync(downloadedFile.uri, {
            mimeType: manual.mime_type,
            dialogTitle: "Simpan Manual Book",
          });
        } else {
          Alert.alert(
            "Tidak Didukung",
            "Fitur berbagi file tidak tersedia di perangkat ini.",
          );
        }
      } else {
        throw new Error(
          "Gagal mengunduh file, ukuran file kosong atau tidak tersedia.",
        );
      }
    } catch (err) {
      console.error("Gagal memproses download:", err);
      Alert.alert(
        "Gagal",
        "Download gagal. Terjadi kendala saat mengunduh manual.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          tw`flex-1 justify-center items-center`,
          { backgroundColor: "#0d1731" },
        ]}
      >
        <ActivityIndicator size="large" color="#3bd9e8" />
        <Text style={tw`text-xs text-slate-400 mt-2`}>Memuat data...</Text>
      </View>
    );
  }

  if (!manual) {
    return (
      <View style={tw`flex-1 bg-[#0d1731] justify-center items-center p-6`}>
        <Text style={tw`text-white font-bold`}>Manual tidak ditemukan.</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={tw`mt-4 bg-slate-700 px-4 py-2 rounded-lg`}
        >
          <Text style={tw`text-white font-bold text-xs`}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-[#0d1731]`}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#3bd9e8"
        translucent={false}
      />

      <LinearGradient
        colors={["#3bd9e8", "#9359e9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={tw`p-5 pt-12 flex-row items-center rounded-b-3xl`}
      >
        <TouchableOpacity onPress={() => router.back()} style={tw`mr-4`}>
          <ChevronLeft color="#fff" size={28} />
        </TouchableOpacity>
        <View style={tw`flex-1`}>
          <Text
            style={tw`text-teal-100 text-[10px] font-bold tracking-widest uppercase`}
          >
            Manual Book
          </Text>
          <Text style={tw`text-white text-base font-black`} numberOfLines={1}>
            {manual.title}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={tw`flex-1`}>
        <View style={tw`p-5`}>
          <View
            style={tw`bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-sm mb-5`}
          >
            <View style={tw`flex-row items-center mb-4`}>
              <FileText color="#3bd9e8" size={24} style={tw`mr-3`} />
              <Text style={tw`text-white text-lg font-bold flex-1`}>
                {manual.title}
              </Text>
            </View>

            {manual.description && (
              <Text style={tw`text-slate-300 text-sm leading-5 mb-4`}>
                {manual.description}
              </Text>
            )}

            <View style={tw`flex-row items-center mb-2`}>
              <HardDrive color="#94a3b8" size={16} style={tw`mr-2`} />
              <Text style={tw`text-slate-400 text-xs`}>
                {manual.size_formatted}
              </Text>
            </View>
            <View style={tw`flex-row items-center mb-2`}>
              <FileText color="#94a3b8" size={16} style={tw`mr-2`} />
              <Text style={tw`text-slate-400 text-xs flex-1`}>{manual.file_name}</Text>
            </View>
            <View style={tw`flex-row items-center mb-2`}>
              <User color="#94a3b8" size={16} style={tw`mr-2`} />
              <Text style={tw`text-slate-400 text-xs`}>
                {manual.uploaded_by || "Admin"}
              </Text>
            </View>
            <View style={tw`flex-row items-center`}>
              <Calendar color="#94a3b8" size={16} style={tw`mr-2`} />
              <Text style={tw`text-slate-400 text-xs`}>
                {new Date(manual.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleDownload}
            disabled={isDownloading}
            style={tw`bg-teal-500 py-3 rounded-2xl flex-row justify-center items-center shadow-lg`}
          >
            {isDownloading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Download color="#fff" size={20} style={tw`mr-2`} />
                <Text style={tw`text-white font-bold text-base`}>Download</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={tw`text-slate-500 text-[10px] text-center mt-4`}>
            File akan disimpan di perangkat Anda melalui dialog share.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
