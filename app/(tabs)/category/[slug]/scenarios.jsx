import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "../../../../api/api";
import { STORAGE_BASE_URL } from '@env';
import tw from "twrnc";
import Constants from "expo-constants";
import { Search, ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export default function CategoryScenarios() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();

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

  const fetchInitialScenarios = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(
        `/categories/${slug}/scenarios?page=1`
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

  const fetchMoreScenarios = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const response = await api.get(
        `/categories/${slug}/scenarios?page=${nextPage}`
      );
      if (response.data.success) {
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

  const renderFooter = () => {
    if (!isLoadingMore) return <View style={tw`h-10`} />;
    return (
      <View style={tw`py-4 items-center`}>
        <ActivityIndicator size="large" color="#22a594" />
      </View>
    );
  };

  const renderItem = useCallback(
    ({ item }) => (
      <TouchableOpacity
        onPress={() => router.push(`/scenarios/${item.slug}`)}
        style={tw`bg-slate-800/80 p-4 rounded-2xl border border-slate-700 shadow-sm mb-3 flex-row items-center`}
        activeOpacity={0.7}
      >
        <Image
          source={
            item.thumbnail
              ? { uri: `${STORAGE_BASE_URL}${item.thumbnail}` }
              : require("../../../../assets/icon-protap.png")
          }
          style={tw`w-14 h-14 rounded-xl bg-slate-700 mr-3`}
        />

        <View style={tw`flex-1`}>
          <Text style={tw`text-sm font-extrabold text-white mb-0.5`}>
            {item.title}
          </Text>
          <Text
            style={tw`text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-2`}
          >
            {item.jenis_acara || "Resmi"} • {item.layout_type || "Standar"}
          </Text>

          <View style={tw`flex-row flex-wrap gap-1`}>
            {item.tags?.map((tag) => (
              <View
                key={tag.id}
                style={tw`bg-slate-700 border border-slate-600 px-2 py-0.5 rounded`}
              >
                <Text style={tw`text-[9px] text-slate-300`}>#{tag.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={tw`text-slate-500 font-bold ml-2`}>❯</Text>
      </TouchableOpacity>
    ),
    []
  );

  if (isLoading) {
    return (
      <View style={tw`flex-1 bg-[#0d1731] justify-center items-center`}>
        <ActivityIndicator size="large" color="#3bd9e8" />
        <Text style={tw`text-xs text-slate-400 mt-2`}>
          Memuat daftar pedoman...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={tw`flex-1 bg-[#0d1731]`}
      edges={['left', 'right']}
    >
      <StatusBar barStyle="light-content" />

      {/* HEADER FIXED */}
      <LinearGradient
        colors={["#3bd9e8", "#9359e9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={tw`p-5 pt-12 rounded-b-3xl`}
      >
        <View style={tw`flex-row items-center mb-4`}>
          <TouchableOpacity onPress={() => router.back()} style={tw`mr-3`}>
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={tw`flex-1`}>
            <Text
              style={tw`text-teal-100 text-[10px] font-bold tracking-widest uppercase`}
            >
              Kategori Pedoman
            </Text>
            <Text
              style={tw`text-white text-base font-black uppercase tracking-wide`}
            >
              {categoryName}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/search")}
          activeOpacity={0.9}
          style={tw`flex-row items-center bg-white/15 rounded-full px-4 py-2.5 shadow-md border border-white/30`}
        >
          <Search size={18} color="#ffffff" strokeWidth={2.2} />
          <Text style={tw`text-white/90 text-sm flex-1 font-medium ml-2`}>
            Cari acara, denah, atau pedoman...
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={tw`px-5 pt-5 pb-1`}>
        <Text
          style={tw`text-xs font-bold text-slate-300 uppercase tracking-wider`}
        >
          Silahkan Pilih Pedoman ({count})
        </Text>
      </View>

      {/* LIST */}
      <FlatList
        data={scenarios}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListFooterComponent={renderFooter}
        onEndReached={fetchMoreScenarios}
        onEndReachedThreshold={0.25}
        refreshing={isLoading}
        onRefresh={fetchInitialScenarios}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-6`}
        ListEmptyComponent={
          <View
            style={tw`mx-5 bg-slate-800/80 border border-dashed border-slate-600 p-8 rounded-2xl items-center justify-center mt-4`}
          >
            <Text style={tw`text-sm text-slate-400 italic text-center`}>
              Belum ada skenario yang aktif di dalam kategori ini.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
