import React, { useState, useEffect, useRef } from "react";
import { useFonts, Montserrat_400Regular, Montserrat_700Bold, Montserrat_900Black } from '@expo-google-fonts/montserrat';
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
import tw from "twrnc";
import Constants from "expo-constants";
import { LinearGradient } from 'expo-linear-gradient';
import * as LucideIcons from "lucide-react-native";
import api, { STORAGE_BASE_URL } from "./api/api";
import PinGateModal from "./components/PinGateModal";
import { PinSession } from "../utils/session";

const { width } = Dimensions.get("window");

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

  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Bold': Montserrat_700Bold,
    'Montserrat-Black': Montserrat_900Black,
  });

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [targetRoute, setTargetRoute] = useState("");

  // const handleProtectedNavigation = (routePath) => {
  //   setTargetRoute(routePath);
  //   setPinModalVisible(true);
  // };

  const handleProtectedNavigation = (routePath) => {
    // 2. CEK FAST-PASS: Jika sudah terverifikasi di sesi ini, langsung pindah!
    if (PinSession.isVerified) {
      router.push(routePath);
    } else {
      // Jika belum terverifikasi (atau app baru dibuka), baru tampilkan modal
      setTargetRoute(routePath);
      setPinModalVisible(true);
    }
  };


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

    initApp();
  }, []);

  const initApp = async () => {
    try {
      const [catRes, scenRes] = await Promise.all([
        api.get(`/dashboard`),
        api.get(`/scenarios`),
      ]);

      if (catRes.data.success) setCategories(catRes.data.data);
      if (scenRes.data.success) {
        setScenarios(scenRes.data.data || []);
        setNextCursor(scenRes.data.next_cursor);
        setHasMore(scenRes.data.has_more);
      }

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

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const [catRes, scenRes] = await Promise.all([
        api.get(`/dashboard`),
        api.get(`/scenarios`),
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

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return;

    setIsLoadingMore(true);
    try {
      const response = await api.get(`/scenarios?cursor=${nextCursor}`);

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

  if (!fontsLoaded) {
    return (
      <View style={[tw`flex-1 justify-center items-center`, { backgroundColor: "#0d1731" }]}>
        <ActivityIndicator color="#22a594" size="large" />
      </View>
    );
  }

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={tw`py-4 items-center`}>
          <ActivityIndicator size="small" color="#6b46c1" />
          <Text style={[tw`text-[10px] text-slate-400 mt-1`, { fontFamily: 'Montserrat-Regular' }]}>Memuat data...</Text>
        </View>
      );
    }
    return (
      <View style={tw`mt-6 mb-12 items-center`}>
        <Text style={[tw`text-[10px] text-slate-400`, { fontFamily: 'Montserrat-Regular' }]}>PROTAP v1.1</Text>
      </View>
    );
  };

  // ===================== RENDER COMPONENT HEADER =====================
  const renderHeader = () => (
    <View style={tw`pt-6`}>
      <TouchableOpacity
        onPress={() => router.push("/honorifics")}
        style={tw`bg-slate-800/90 p-4 rounded-2xl shadow-sm mb-3 flex-row items-center justify-between`}
      >
        <View style={tw`flex-row items-center`}>
          <View style={tw`bg-teal-500/40 p-2 rounded-xl mr-3`}>
            <DynamicIcon name="crown" color="#ffffff" size={20} />
          </View>
          <View>
            <Text style={[tw`text-white text-xs uppercase tracking-wider`, { fontFamily: 'Montserrat-Bold' }]}>
              Panduan Digital Protokol
            </Text>
            <Text style={[tw`text-teal-200 text-[11px] mt-0.5`, { fontFamily: 'Montserrat-Regular' }]}>
              Sapaan Resmi & Lisan Pejabat
            </Text>
          </View>
        </View>
        <Text style={tw`text-white font-bold text-base`}>❯</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleProtectedNavigation("/generator")}
        style={tw`bg-slate-800/90 p-4 rounded-2xl shadow-sm mb-3 flex-row items-center justify-between`}
      >
        <View style={tw`flex-row items-center`}>
          <View style={tw`bg-purple-500/30 p-2 rounded-xl mr-3`}>
            <DynamicIcon name="file-text" color="#a855f7" size={20} />
          </View>
          <View>
            <Text style={[tw`text-white text-xs uppercase tracking-wider`, { fontFamily: 'Montserrat-Bold' }]}>
              Rundown Generator
            </Text>
            <Text style={[tw`text-purple-300 text-[11px] mt-0.5`, { fontFamily: 'Montserrat-Regular' }]}>
              Buat Susunan Acara (PDF)
            </Text>
          </View>
        </View>
        <Text style={tw`text-white font-bold text-base`}>❯</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/rundown-list")}
        style={tw`bg-slate-800/90 p-4 rounded-2xl shadow-sm mb-3 flex-row items-center justify-between`}
      >
        <View style={tw`flex-row items-center`}>
          <View style={tw`bg-green-500/30 p-2 rounded-xl mr-3`}>
            <DynamicIcon name="file-list" color="#55f78b" size={20} />
          </View>
          <View>
            <Text style={[tw`text-white text-xs uppercase tracking-wider`, { fontFamily: 'Montserrat-Bold' }]}>
              List Rundown
            </Text>
            <Text style={[tw`text-green-300 text-[11px] mt-0.5`, { fontFamily: 'Montserrat-Regular' }]}>
              Rundown dan Presensi Forkopimda
            </Text>
          </View>
        </View>
        <Text style={tw`text-white font-bold text-base`}>❯</Text>
      </TouchableOpacity>

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
            <Text style={tw`text-xs font-bold text-white text-center uppercase tracking-wide`}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          key="manuals"
          onPress={() => router.push(`/manuals`)}
          style={tw`bg-slate-800/80 p-4 rounded-2xl border border-slate-700 shadow-sm flex-1 min-w-[45%] items-center`}
        >
          <View style={tw`bg-sky-500 w-12 h-12 rounded-2xl items-center justify-center mb-3 shadow-sm`}>
            <DynamicIcon name="book-open" color="#ffffff" size={22} />
          </View>
          <Text style={tw`text-xs font-bold text-white text-center uppercase tracking-wide`}>
            Manual Book
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[tw`text-xs text-slate-300 tracking-widest uppercase mb-3`, { fontFamily: 'Montserrat-Bold' }]}>
        ⚡ Skenario Protokol Terkini
      </Text>
    </View>
  );

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
        <Text style={[tw`text-xs text-white`, { fontFamily: 'Montserrat-Bold' }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[tw`text-[10px] text-slate-400 mt-0.5 uppercase`, { fontFamily: 'Montserrat-Bold' }]}>
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
              source={require("../assets/icon-protap.png")}
              style={{ width: width * 0.3, height: 115 }}
              resizeMode="contain"
            />

            <Text style={[tw`text-white text-4xl tracking-wide`, { fontFamily: 'Montserrat-Black' }]}>
              PROTAP
            </Text>


            <Image
              source={require("../assets/protokoler.png")}
              style={{ width: width * 1.85, height: 410, marginTop: -75 }}
              resizeMode="contain"
            />

            <View style={tw`-mt-28 items-center`}>
              <Text style={[tw`text-teal-400 text-lg uppercase text-center px-2`, { fontFamily: 'Montserrat-Bold' }]}>
                Panduan Resmi Operasional Tata Acara Protokol
              </Text>
            </View>
          </View>
        </Animated.View>

        <View style={tw`absolute bottom-12 items-center`}>
          <ActivityIndicator color="#22a594" size="large" />
          <Text style={[tw`text-white text-[12px] mt-4 uppercase tracking-widest`, { fontFamily: 'Montserrat-Bold' }]}>
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
              <Text style={[tw`text-white text-2xl tracking-wide`, { fontFamily: 'Montserrat-Black' }]}>
                ROTAP
              </Text>
            </View>

            <Image
              source={require('../assets/beraksi-logo.png')}
              style={tw`h-16 w-28`}
              resizeMode="contain"
            />
          </View>

          <Text style={[tw`text-teal-200 text-sm tracking-wider uppercase`, { fontFamily: 'Montserrat-Bold' }]}>
            Kabupaten Tanah Bumbu
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/search")}
            activeOpacity={0.9}
            style={tw`flex-row items-center bg-white/15 rounded-full px-4 py-2.5 shadow-md mt-4 border border-white/30`}
          >
            <DynamicIcon name="search" color="#ffffff" size={18} />
            <Text style={[tw`text-white/90 text-sm flex-1 ml-2`, { fontFamily: 'Montserrat-Regular' }]}>
              Cari acara, denah, atau pedoman...
            </Text>
          </TouchableOpacity>
        </LinearGradient>

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
      <PinGateModal
        visible={pinModalVisible}
        onClose={() => setPinModalVisible(false)}
        onAuthSuccess={() => {
          router.push(targetRoute);
          setTimeout(() => {
            setPinModalVisible(false);
          }, 400); 
        }}
      />
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