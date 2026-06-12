import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
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

// Import semua komponen ikon dari lucide-react-native
import * as LucideIcons from "lucide-react-native";

const { width } = Dimensions.get("window");
const { API_BASE_URL, STORAGE_BASE_URL } = Constants.expoConfig.extra;

// Komponen Helper untuk Merender Ikon Lucide secara Dinamis
const DynamicIcon = ({ name, color = "#ffffff", size = 22 }) => {
  const pascalCaseName = name
    ? name
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("")
    : "Folder";

  const IconComponent = LucideIcons[pascalCaseName] || LucideIcons.Folder;
  return <IconComponent color={color} size={size} strokeWidth={2.5} />;
};

export default function Home() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  
  const [scenarios, setScenarios] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
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

  // Memuat data awal gabungan
  const initApp = async () => {
    try {
      const [catRes, scenRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboard`),
        axios.get(`${API_BASE_URL}/scenarios`), // Memanggil method index()
      ]);

      if (catRes.data.success) setCategories(catRes.data.data);
      if (scenRes.data.success) {
        setScenarios(scenRes.data.data || []);
        setNextCursor(scenRes.data.next_cursor);
        setHasMore(scenRes.data.has_more);
      }

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

  // Fungsi Pull to Refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const [catRes, scenRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboard`),
        axios.get(`${API_BASE_URL}/scenarios`),
      ]);

      if (catRes.data.success) setCategories(catRes.data.data);
      if (scenRes.data.success) {
        setScenarios(scenRes.data.data || []);
        setNextCursor(scenRes.data.next_cursor);
        setHasMore(scenRes.data.has_more);
      }
    } catch (error) {
      console.error("Gagal memperbarui data:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Fungsi pemicu saat user scroll mendekati bagian bawah Beranda
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return;

    setIsLoadingMore(true);
    try {
      // Mengirimkan token next_cursor ke backend Laravel
      const response = await axios.get(`${API_BASE_URL}/scenarios?cursor=${nextCursor}`);
      
      if (response.data.success) {
        const newData = response.data.data || [];
        setScenarios((prev) => [...prev, ...newData]);
        setNextCursor(response.data.next_cursor);
        setHasMore(response.data.has_more);
      }
    } catch (error) {
      console.error("Gagal memuat skenario berikutnya:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Komponen Loader Tambahan di Bawah List saat mengambil data lama
  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={tw`py-4 items-center`}>
          <ActivityIndicator size="small" color="#0d9488" />
          <Text style={tw`text-[10px] text-slate-400 mt-1 font-medium`}>Memuat skenario lama...</Text>
        </View>
      );
    }
    return (
      <View style={tw`mt-6 mb-12 items-center`}>
        <Text style={tw`text-[10px] text-slate-400 font-medium`}>PROTAP v1.1</Text>
      </View>
    );
  };

  // ===================== RENDER COMPONENT HEADER =====================
  const renderHeader = () => (
    <View style={tw`pt-6`}>
      {/* UTILITIES SHORTCUT (KAMUS SAKU) */}
      <TouchableOpacity
        onPress={() => router.push("/honorifics")}
        style={tw`bg-slate-900 p-4 rounded-2xl shadow-sm mb-6 flex-row items-center justify-between`}
      >
        <View style={tw`flex-row items-center`}>
          <View style={tw`bg-teal-700/40 p-2 rounded-xl mr-3`}>
            <DynamicIcon name="crown" color="#ffffff" size={20} />
          </View>
          <View>
            <Text style={tw`text-white text-xs font-bold uppercase tracking-wider`}>
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
      <Text style={tw`text-xs font-bold text-slate-400 tracking-widest uppercase mb-3`}>
        Kategori Pedoman
      </Text>
      <View style={tw`flex-row flex-wrap gap-3 mb-6`}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => router.push(`/category/${cat.slug}/scenarios`)}
            style={tw`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-1 min-w-[45%] items-center`}
          >
            <View style={tw`${getCategoryColor(cat.type)} w-12 h-12 rounded-2xl items-center justify-center mb-3 shadow-sm`}>
              <DynamicIcon name={cat.icon} color="#ffffff" size={22} />
            </View>
            <Text style={tw`text-xs font-black text-slate-800 text-center uppercase tracking-wide`}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* JUDUL WIDGET SEBELUM DAFTAR LIST ITEM */}
      <Text style={tw`text-xs font-bold text-slate-400 tracking-widest uppercase mb-3`}>
        ⚡ Skenario Protokol Terkini
      </Text>
    </View>
  );

  // Component Item untuk dirender berulang kali di FlatList
  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/scenarios/${item.slug}`)}
      style={tw`bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex-row items-center mb-2.5`}
    >
      <Image
        source={
          item.thumbnail
            ? { uri: `${STORAGE_BASE_URL}${item.thumbnail}` }
            : require("../assets/bupati-dan-wakil.png")
        }
        style={tw`w-12 h-12 rounded-xl bg-slate-200 mr-3`}
      />
      <View style={tw`flex-1`}>
        <Text style={tw`text-xs font-black text-slate-800`} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={tw`text-[10px] text-slate-400 mt-0.5 uppercase font-semibold`}>
          {item.category?.name || "Pedoman"} • {item.layout_type || 'Resmi'}
        </Text>
      </View>
      <Text style={tw`text-slate-300 font-bold px-1`}>❯</Text>
    </TouchableOpacity>
  );

  // ===================== RENDER SPLASH SCREEN =====================
  if (showSplash) {
    return (
      <View style={[tw`flex-1 justify-center items-center`, { backgroundColor: "#ff4d29" }]}>
        <StatusBar barStyle="light-content" />
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            alignItems: "center",
          }}
        >
          <Image
            source={require("../assets/beraksi-logo.png")}
            style={{ width: width * 0.6, height: 150 }}
            resizeMode="contain"
          />
          <View style={tw`mt-8 items-center`}>
            <Text style={tw`text-white text-2xl font-black tracking-widest`}>PROTAP</Text>
            <View style={tw`h-1 w-12 bg-teal-500 my-2 rounded-full`} />
            <Text style={tw`text-teal-700 text-xs font-bold uppercase tracking-widest`}>
              Protokol & Tata Tempat
            </Text>
          </View>
        </Animated.View>

        <View style={tw`absolute bottom-12 items-center`}>
          <ActivityIndicator color="#165e54" size="small" />
          <Text style={tw`text-slate-500 text-[10px] mt-4 font-bold uppercase tracking-widest`}>
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
      <View style={[tw`p-5 pt-12 rounded-b-3xl`, { backgroundColor: "#ff4d29" }]}>
        <Text style={tw`text-white text-2xl font-black tracking-wide`}>PROTAP</Text>
        <Text style={tw`text-teal-700 text-sm font-semibold tracking-wider uppercase`}>
          Kabupaten Tanah Bumbu
        </Text>

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

      {/* LAYOUT UTAMA */}
      <FlatList
        data={scenarios}
        renderItem={renderItem}
        keyExtractor={(item) => "home-scen-" + item.id.toString()}
        contentContainerStyle={tw`px-5`}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2} // Ambil data baru saat scroll sisa 20%
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0d9488"]}
            tintColor="#0d9488"
          />
        }
      />
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