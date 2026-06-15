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
import { LinearGradient } from 'expo-linear-gradient';

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
        axios.get(`${API_BASE_URL}/scenarios`),
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
          <ActivityIndicator size="small" color="#6b46c1" />
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
        style={tw`bg-slate-800/90 p-4 rounded-2xl shadow-sm mb-6 flex-row items-center justify-between`}
      >
        <View style={tw`flex-row items-center`}>
          <View style={tw`bg-teal-500/40 p-2 rounded-xl mr-3`}>
            <DynamicIcon name="crown" color="#ffffff" size={20} />
          </View>
          <View>
            <Text style={tw`text-white text-xs font-bold uppercase tracking-wider`}>
              Panduan Digital Protokol
            </Text>
            <Text style={tw`text-teal-200 text-[11px] mt-0.5`}>
              Sapaan Resmi & Lisan Pejabat
            </Text>
          </View>
        </View>
        <Text style={tw`text-white font-bold text-base`}>❯</Text>
      </TouchableOpacity>

      {/* GRID KATEGORI UTAMA */}
      <Text style={tw`text-xs font-bold text-slate-300 tracking-widest uppercase mb-3`}>
        Kategori Pedoman
      </Text>
      <View style={tw`flex-row flex-wrap gap-3 mb-6`}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => router.push(`/category/${cat.slug}/scenarios`)}
            style={tw`bg-slate-800/80 p-4 rounded-2xl border border-slate-700 shadow-sm flex-1 min-w-[45%] items-center`}
          >
            <View style={tw`${getCategoryColor(cat.type)} w-12 h-12 rounded-2xl items-center justify-center mb-3 shadow-sm`}>
              <DynamicIcon name={cat.icon} color="#ffffff" size={22} />
            </View>
            <Text style={tw`text-xs font-black text-white text-center uppercase tracking-wide`}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* JUDUL WIDGET SEBELUM DAFTAR LIST ITEM */}
      <Text style={tw`text-xs font-bold text-slate-300 tracking-widest uppercase mb-3`}>
        ⚡ Skenario Protokol Terkini
      </Text>
    </View>
  );

  // Component Item untuk dirender berulang kali di FlatList
  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/scenarios/${item.slug}`)}
      style={tw`bg-slate-800/80 p-3 rounded-2xl border border-slate-700 shadow-sm flex-row items-center mb-2.5`}
    >
      <Image
        source={
          item.thumbnail
            ? { uri: `${STORAGE_BASE_URL}${item.thumbnail}` }
            : require("../assets/icon-protap.png")
        }
        style={tw`w-12 h-12 rounded-xl bg-slate-700 mr-3`}
      />
      <View style={tw`flex-1`}>
        <Text style={tw`text-xs font-black text-white`} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={tw`text-[10px] text-slate-400 mt-0.5 uppercase font-semibold`}>
          {item.category?.name || "Pedoman"} • {item.layout_type || 'Resmi'}
        </Text>
      </View>
      <Text style={tw`text-slate-500 font-bold px-1`}>❯</Text>
    </TouchableOpacity>
  );

  // ===================== RENDER SPLASH SCREEN =====================
  if (showSplash) {
    return (
      <View style={[tw`flex-1 justify-center items-center`, { backgroundColor: "#0d1731" }]}>
        <StatusBar barStyle="light-content" />
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            alignItems: "center",
            justifyContent: "center",
            width: '100%',
          }}
        >
          <View style={tw`items-center justify-center`}>
            <Image
              source={require("../assets/icon-protap-splash.png")}
              style={{ width: width * 1.1, height: 210, marginBottom: -50 }}
              resizeMode="contain"
            />

            <Image
              source={require("../assets/protokoler.png")}
              style={{ width: width * 1.85, height: 410, marginTop: -75 }}
              resizeMode="contain"
            />

            <View style={tw`-mt-28 items-center`}>
              <Text style={tw`text-teal-400 text-lg font-black uppercase text-center px-2`}>
                Panduan Resmi Operasional Tata Acara Protokol
              </Text>
            </View>
          </View>
        </Animated.View>

        <View style={tw`absolute bottom-12 items-center`}>
          <ActivityIndicator color="#22a594" size="small" />
          <Text style={tw`text-white text-[10px] mt-4 font-bold uppercase tracking-widest`}>
            Kabupaten Tanah Bumbu
          </Text>
        </View>
      </View>
    );
  }

  // ===================== RENDER DASHBOARD UTAMA =====================
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#3bd9e8" translucent={false} />
      <SafeAreaView style={tw`flex-1 bg-[#0d1731]`} edges={['bottom', 'left', 'right']}>
        <LinearGradient
          colors={['#3bd9e8', '#9359e9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={tw`p-5 pt-12 rounded-b-3xl`}>
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
              <Image
                source={require('../assets/icon-protap.png')}
                style={tw`w-7 h-7 -mr-1`}
                resizeMode="contain"
              />
              <Text style={tw`text-white text-2xl font-black tracking-wide`}>
                ROTAP
              </Text>
            </View>

            <Image
              source={require('../assets/beraksi-logo.png')}
              style={tw`h-16 w-28`}
              resizeMode="contain"
            />
          </View>

          <Text style={tw`text-teal-200 text-sm font-semibold tracking-wider uppercase`}>
            Kabupaten Tanah Bumbu
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/search")}
            activeOpacity={0.9}
            style={tw`flex-row items-center bg-white/15 rounded-full px-4 py-2.5 shadow-md mt-4 border border-white/30`}
          >
            <DynamicIcon name="search" color="#ffffff" size={18} />
            <Text style={tw`text-white/90 text-sm flex-1 font-medium ml-2`}>
              Cari acara, denah, atau pedoman...
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* LAYOUT UTAMA - FLATLIST UNTUK KONTEN SCROLLABLE */}
        <FlatList
          data={scenarios}
          renderItem={renderItem}
          keyExtractor={(item) => "home-scen-" + item.id.toString()}
          contentContainerStyle={tw`px-5`}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3bd9e8"]}
              tintColor="#3bd9e8"
            />
          }
        />
      </SafeAreaView>
    </>
  );
}

const getCategoryColor = (type) => {
  switch (type) {
    case "tempat":
      return "bg-blue-500";
    case "acara":
      return "bg-amber-500";
    case "hormat":
      return "bg-teal-500";
    default:
      return "bg-slate-500";
  }
};