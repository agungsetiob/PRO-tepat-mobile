import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import axios from "axios";
import tw from "twrnc";
import Constants from "expo-constants";

// 1. Import semua komponen ikon dari lucide-react-native
import * as LucideIcons from "lucide-react-native";

const { width } = Dimensions.get("window");
const { API_BASE_URL, STORAGE_BASE_URL } = Constants.expoConfig.extra;

// 2. Komponen Helper untuk Merender Ikon Lucide secara Dinamis
const DynamicIcon = ({ name, color = "#ffffff", size = 22 }) => {
  // Mengubah format kebab-case dari database (contoh: "shield-alert") menjadi PascalCase ("ShieldAlert")
  const pascalCaseName = name
    ? name
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("")
    : "Folder";

  // Ambil komponen dari daftar Lucide, jika tidak ada gunakan fallback 'Folder'
  const IconComponent = LucideIcons[pascalCaseName] || LucideIcons.Folder;

  return <IconComponent color={color} size={size} strokeWidth={2.5} />;
};

export default function Home() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [popularScenarios, setPopularScenarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animasi Ref
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Mulai Animasi Splash
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Ambil Data Awal
    initApp();
  }, []);

  const initApp = async () => {
    try {
      const [catRes, popRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboard`),
        axios
          .get(`${API_BASE_URL}/scenarios/popular`)
          .catch(() => ({ data: { success: false } })),
      ]);

      if (catRes.data.success) setCategories(catRes.data.data);
      if (popRes.data.success) setPopularScenarios(popRes.data.data);

      // Jalankan splash minimal 1.5 detik
      setTimeout(() => {
        setShowSplash(false);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Gagal memuat data:", error);
      setShowSplash(false);
      setIsLoading(false);
    }
  };

  // Fungsi yang dijalankan saat (Pull to Refresh)
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const [catRes, popRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboard`),
        axios
          .get(`${API_BASE_URL}/scenarios/popular`)
          .catch(() => ({ data: { success: false } })),
      ]);

      if (catRes.data.success) setCategories(catRes.data.data);
      if (popRes.data.success) setPopularScenarios(popRes.data.data);
    } catch (error) {
      console.error("Gagal memperbarui data:", error);
    } finally {
      setRefreshing(false); // Matikan loading spinner refresh
    }
  }, []);

  // ===================== RENDER SPLASH SCREEN =====================
  if (showSplash) {
    return (
      <View style={tw`flex-1 bg-slate-900 justify-center items-center`}>
        <StatusBar barStyle="light-content" />
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            alignItems: "center",
          }}
        >
          {/* LOGO BERAKSI */}
          <Image
            source={require("../assets/beraksi-logo.png")}
            style={{ width: width * 0.6, height: 150 }}
            resizeMode="contain"
          />

          <View style={tw`mt-8 items-center`}>
            <Text style={tw`text-white text-2xl font-black tracking-widest`}>
              PRO-TEPAT
            </Text>
            <View style={tw`h-1 w-12 bg-teal-500 my-2 rounded-full`} />
            <Text
              style={tw`text-teal-400 text-xs font-bold uppercase tracking-widest`}
            >
              Protokol & Tata Tempat
            </Text>
          </View>
        </Animated.View>

        <View style={tw`absolute bottom-12 items-center`}>
          <ActivityIndicator color="#2dd4bf" size="small" />
          <Text
            style={tw`text-slate-500 text-[10px] mt-4 font-bold uppercase tracking-widest`}
          >
            Kabupaten Tanah Bumbu
          </Text>
        </View>
      </View>
    );
  }

  // ===================== RENDER DASHBOARD UTAMA =====================
  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER & SEARCH BUTTON */}
      <View style={tw`bg-slate-900 p-6 rounded-b-3xl shadow-md`}>
        <Text style={tw`text-white text-2xl font-black tracking-wide`}>
          PRO-Tepat
        </Text>

        <Text
          style={tw`text-teal-400 text-sm font-semibold tracking-wider uppercase`}
        >
          Kabupaten Tanah Bumbu
        </Text>

        {/* SEARCH BAR */}
        <TouchableOpacity
          onPress={() => router.push("/search")}
          activeOpacity={0.9}
          style={tw`flex-row items-center bg-white rounded-full px-4 py-2.5 shadow-md mt-4 border border-slate-200`}
        >
          <DynamicIcon name="search" color="#64748b" size={18} />
          <Text style={tw`text-slate-400 text-sm flex-1 font-medium ml-2`}>
            Cari acara, denah, atau pedoman...
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pasang RefreshControl di ScrollView */}
      <ScrollView
        style={tw`flex-1 px-5 pt-6`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0d9488"]} // Warna spinner untuk Android (teal-600)
            tintColor="#0d9488" // Warna spinner untuk iOS
          />
        }
      >
        <View>
          {/* UTILITIES SHORTCUT (KAMUS SAKU) */}
          <TouchableOpacity
            onPress={() => router.push("/honorifics")}
            style={tw`bg-teal-600 p-4 rounded-2xl shadow-sm mb-6 flex-row items-center justify-between`}
          >
            <View style={tw`flex-row items-center`}>
              {/* Mengganti Emoji Mahkota Lama dengan Ikon Lucide Crown */}
              <View style={tw`bg-teal-700/40 p-2 rounded-xl mr-3`}>
                <DynamicIcon name="crown" color="#ffffff" size={20} />
              </View>
              <View>
                <Text
                  style={tw`text-white text-xs font-bold uppercase tracking-wider`}
                >
                  Kamus Saku Protokol
                </Text>
                <Text style={tw`text-teal-100 text-[11px] mt-0.5`}>
                  Sapaan Resmi & Lisan Pejabat
                </Text>
              </View>
            </View>
            <Text style={tw`text-white font-bold text-base`}>❯</Text>
          </TouchableOpacity>

          {/* GRID KATEGORI UTAMA */}
          <Text
            style={tw`text-xs font-bold text-slate-400 tracking-widest uppercase mb-3`}
          >
            Kategori Pedoman
          </Text>
          <View style={tw`flex-row flex-wrap gap-3 mb-6`}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => router.push(`/category/${cat.slug}/scenarios`)}
                style={tw`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-1 min-w-[45%] items-center`}
              >
                {/* MENGGUNAKAN IKON STRUG DARI API LARAVEL VIA DYNAMIC ICON */}
                <View
                  style={tw`${getCategoryColor(cat.type)} w-12 h-12 rounded-2xl items-center justify-center mb-3 shadow-sm`}
                >
                  <DynamicIcon name={cat.icon} color="#ffffff" size={22} />
                </View>
                <Text
                  style={tw`text-xs font-black text-slate-800 text-center uppercase tracking-wide`}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* WIDGET PEDOMAN TERKINI */}
          <Text
            style={tw`text-xs font-bold text-slate-400 tracking-widest uppercase mb-3`}
          >
            ⚡ Skenario Protokol Terkini
          </Text>

          {popularScenarios.map((scen) => (
            <TouchableOpacity
              key={scen.id}
              onPress={() => router.push(`/scenarios/${scen.slug}`)}
              style={tw`bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex-row items-center mb-2.5`}
            >
              <Image
                source={
                  scen.thumbnail
                    ? { uri: `${STORAGE_BASE_URL}${scen.thumbnail}` }
                    : require("../assets/bupati-dan-wakil.png")
                }
                style={tw`w-12 h-12 rounded-xl bg-slate-200 mr-3`}
              />
              <View style={tw`flex-1`}>
                <Text
                  style={tw`text-xs font-black text-slate-800`}
                  numberOfLines={1}
                >
                  {scen.title}
                </Text>
                <Text
                  style={tw`text-[10px] text-slate-400 mt-0.5 uppercase font-semibold`}
                >
                  {scen.category?.name || "Pedoman"} • {scen.layout_type}
                </Text>
              </View>
              <Text style={tw`text-slate-300 font-bold px-1`}>❯</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={tw`mt-6 mb-12 items-center`}>
          <Text style={tw`text-[10px] text-slate-400 font-medium`}>
            PRO-Tepat v1.1
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getCategoryColor = (type) => {
  switch (type) {
    case "tempat":
      return "bg-blue-600";
    case "acara":
      return "bg-amber-500";
    case "hormat":
      return "bg-slate-700";
    default:
      return "bg-blue-500";
  }
};
