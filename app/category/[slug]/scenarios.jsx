import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Image,
  //SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import tw from "twrnc";
import Constants from "expo-constants";
import { Search } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { API_BASE_URL, STORAGE_BASE_URL } = Constants.expoConfig.extra;

export default function CategoryScenarios() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  
  // State manajemen pagination data
  const [scenarios, setScenarios] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchInitialScenarios();
    }
  }, [slug]);

  // Load Halaman Pertama (Page 1)
  const fetchInitialScenarios = async () => {
    setIsLoading(true);
    try {
      // Menembak endpoint Laravel: /api/scenarios/category/{slug}?page=1
      const response = await axios.get(
        `${API_BASE_URL}/categories/${slug}/scenarios?page=1`
      );
      if (response.data.success) {
        setScenarios(response.data.data || []);
        setCategoryName(response.data.category_name || "Daftar Skenario");
        setCount(response.data.total || 0);
        setHasMore(response.data.has_more || false);
        setPage(1);
      }
    } catch (error) {
      console.error("Gagal memuat skenario kategori:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load Halaman Berikutnya (Lazy Loading) saat di-scroll ke bawah
  const fetchMoreScenarios = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/categories/${slug}/scenarios?page=${nextPage}`
      );
      if (response.data.success) {
        // Gabungkan array data lama dengan data baru hasil load more
        setScenarios((prev) => [...prev, ...(response.data.data || [])]);
        setHasMore(response.data.has_more || false);
        setPage(nextPage);
      }
    } catch (error) {
      console.error("Gagal memuat halaman berikutnya:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Render Loader Tambahan di Bawah Item Saat Loading More Berjalan
  const renderFooter = () => {
    if (!isLoadingMore) return <View style={tw`h-10`} />;
    return (
      <View style={tw`py-4 items-center`}>
        <ActivityIndicator size="small" color="#0d9488" />
        <Text style={tw`text-[10px] text-slate-400 mt-1`}>Memuat data lama...</Text>
      </View>
    );
  };

  // Render Baris Item Skenario (Dibungkus useCallback agar Render Performance Lebih Stabil)
  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/scenarios/${item.slug}`)}
      style={tw`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-3 flex-row items-center`}
      activeOpacity={0.7}
    >
      {item.thumbnail ? (
        <Image
          source={{ uri: `${STORAGE_BASE_URL}${item.thumbnail}` }}
          style={tw`w-14 h-14 rounded-xl bg-slate-100 mr-4`}
          resizeMode="cover"
        />
      ) : (
        <View style={tw`bg-teal-50 w-14 h-14 rounded-xl items-center justify-center mr-4`}>
          <Text style={tw`text-xl`}>📄</Text>
        </View>
      )}

      <View style={tw`flex-1`}>
        <Text style={tw`text-sm font-extrabold text-slate-800 mb-0.5`}>
          {item.title}
        </Text>
        <Text style={tw`text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-2`}>
          {item.jenis_acara || 'Resmi'} • {item.layout_type || 'Standar'}
        </Text>

        {/* Render Mini Tags List */}
        <View style={tw`flex-row flex-wrap gap-1`}>
          {item.tags?.map((tag) => (
            <View
              key={tag.id}
              style={tw`bg-slate-50 border border-slate-100 px-2 py-0.5 rounded`}
            >
              <Text style={tw`text-[9px] text-slate-500`}>#{tag.name}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={tw`text-slate-300 font-bold ml-2`}>❯</Text>
    </TouchableOpacity>
  ), []);

  // Memindahkan Struktur Header ke Atas List Agar Ikut Ter-scroll
  const renderHeader = () => (
    <View>
      {/* TOP HEADER */}
      <View style={[tw`p-5 pt-12 rounded-b-3xl`, { backgroundColor: "#ff4d29" }]}>
        <View style={tw`flex-row items-center mb-4`}>
          <TouchableOpacity onPress={() => router.back()} style={tw`mr-4`}>
            <Text style={tw`text-white text-xl font-bold`}>❮</Text>
          </TouchableOpacity>
          <View style={tw`flex-1`}>
            <Text style={tw`text-teal-400 text-[10px] font-bold tracking-widest uppercase`}>
              Kategori Pedoman
            </Text>
            <Text style={tw`text-white text-base font-black uppercase tracking-wide`}>
              {categoryName}
            </Text>
          </View>
        </View>

        {/* SEARCH BAR (Navigasi Ke Layar Search) */}
        <TouchableOpacity
          onPress={() => router.push("/search")}
          activeOpacity={0.9}
          style={tw`flex-row items-center bg-white rounded-full px-4 py-2.5 shadow-md border border-slate-200`}
        >
          <Search size={18} color="#64748b" strokeWidth={2.2} />
          <Text style={tw`text-slate-400 text-sm flex-1 font-medium ml-2`}>
            Cari acara, denah, atau pedoman...
          </Text>
        </TouchableOpacity>
      </View>

      {/* SUBTITLE DAFTAR */}
      <View style={tw`px-5 pt-5 pb-1`}>
        <Text style={tw`text-xs font-bold text-slate-400 uppercase tracking-wider`}>
          Silahkan Pilih Pedoman ({count})
        </Text>
      </View>
    </View>
  );

  // Loader Utama Saat Halaman Pertama Kali Dibuka
  if (isLoading) {
    return (
      <View style={tw`flex-1 bg-slate-50 justify-center items-center`}>
        <ActivityIndicator size="large" color="#ff4d29" />
        <Text style={tw`text-xs text-slate-400 mt-2`}>
          Memuat daftar pedoman...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      <FlatList
        data={scenarios}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        
        // Trigerred Infinite Scroll
        onEndReached={fetchMoreScenarios}
        onEndReachedThreshold={0.25} // Muat data baru saat sisa scroll tinggal 25% lagi
        
        // Pull To Refresh (Tarik ke atas untuk refresh data dari awal)
        refreshing={isLoading}
        onRefresh={fetchInitialScenarios}
        
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-6`}
        ListEmptyComponent={
          <View style={tw`mx-5 bg-white border border-dashed border-slate-200 p-8 rounded-2xl items-center justify-center mt-4`}>
            <Text style={tw`text-sm text-slate-400 italic text-center`}>
              Belum ada sub-skenario yang aktif di dalam kategori ini.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}