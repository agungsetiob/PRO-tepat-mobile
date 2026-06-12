import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, TextInput, TouchableOpacity, FlatList, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import axios from 'axios';
import tw from 'twrnc';
import Constants from 'expo-constants';
import { Search } from "lucide-react-native";

const { API_BASE_URL } = Constants.expoConfig.extra;

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [scenarios, setScenarios] = useState([]);
  
  // PERUBAHAN: Ganti nextCursor menjadi penanda halaman (page) angka reguler
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // DEBOUNCE EFFECT: Menunggu user selesai mengetik (selama 650ms) baru tembak API.
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 0) {
        // PERUBAHAN: Reset kembali ke halaman 1 saat user mengetik query baru
        fetchSearchData(query, 1, false);
      } else {
        setScenarios([]);
        setPage(1);
        setHasMore(false);
      }
    }, 650);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Fungsi Utama Fetch Data ke Backend (Disesuaikan untuk Offset Pagination)
  const fetchSearchData = async (searchQuery, pageNum = 1, isLoadMore = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      // PERBAIKAN: Arahkan ke endpoint /search bawaan quickSearch dengan parameter &page=
      const url = `${API_BASE_URL}/search?q=${encodeURIComponent(searchQuery)}&page=${pageNum}`;

      const response = await axios.get(url);
      
      if (response.data.success) {
        const newData = response.data.data || [];
        
        // Gabung array jika scroll-down (load more), timpa data jika ini query ketikan baru
        setScenarios(prev => isLoadMore ? [...prev, ...newData] : newData);
        setHasMore(response.data.has_more); // Menerima true/false dari metadata paginate Laravel
        setPage(response.data.current_page || pageNum); // Simpan status halaman saat ini
      }
    } catch (error) {
      console.error("Gagal memuat data pencarian:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Fungsi pemicu saat user scroll ke bawah mendekati ujung akhir list
  const handleLoadMore = () => {
    // Jalankan lazy load jika tidak sedang memuat data lama dan backend memastikan masih ada sisa baris
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      fetchSearchData(query, nextPage, true);
    }
  };

  // Render komponen loader di bagian bawah list item saat memuat halaman berikutnya
  const renderFooter = () => {
    if (!isLoadingMore) return <View style={tw`h-10`} />;
    return (
      <View style={tw`py-4 items-center`}>
        <ActivityIndicator size="small" color="#165e54" />
        <Text style={tw`text-[10px] text-slate-400 mt-1`}>Memuat lebih banyak...</Text>
      </View>
    );
  };

  // Render Tiap Item (Dipisah agar FlatList berjalan optimal)
  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/scenarios/${item.slug}`)}
      style={tw`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-3 flex-row items-center`}
      activeOpacity={0.7}
    >
      <View style={tw`bg-teal-50 w-11 h-11 rounded-xl items-center justify-center mr-3.5`}>
        <Text style={tw`text-base`}>📋</Text>
      </View>

      <View style={tw`flex-1`}>
        <Text style={tw`text-xs font-black text-slate-800 mb-0.5`}>
          {item.title}
        </Text>
        <Text style={tw`text-[9px] text-slate-400 font-bold uppercase tracking-wide`}>
          {item.jenis_acara || 'Resmi'} • {item.category?.name || 'Pedoman'}
        </Text>
      </View>
      
      <Text style={tw`text-slate-300 font-bold ml-2`}>❯</Text>
    </TouchableOpacity>
  ), []);

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`}>
      <StatusBar barStyle="dark-content" />

      {/* SEARCH BAR HEADER */}
      <View style={[tw`p-5 rounded-b-3xl shadow-md`, { backgroundColor: "#ff4d29" }]}>
        <View style={tw`flex-row items-center`}>
          <TouchableOpacity onPress={() => router.back()} style={tw`mr-3`}>
            <Text style={tw`text-white text-xl font-bold`}>❮</Text>
          </TouchableOpacity>
          
          <View style={tw`flex-1 bg-white rounded-full flex-row items-center px-3 border border-slate-100`}>
            <Search size={18} color="#64748b" strokeWidth={2.2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Cari susunan acara, denah, pedoman..."
              placeholderTextColor="#94a3b8"
              autoFocus={true}
              style={tw`flex-1 text-sm text-slate-800 py-2.5 ml-2`}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Text style={tw`text-slate-400 font-bold px-2 text-lg`}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* BODY AREA */}
      {isLoading ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#ff4d29" />
          <Text style={tw`text-xs text-slate-400 mt-2`}>Mencari pedoman protokol...</Text>
        </View>
      ) : query.trim().length === 0 ? (
        <View style={tw`items-center justify-center py-12 px-5`}>
          <Text style={tw`text-2xl mb-2`}>💡</Text>
          <Text style={tw`text-xs text-slate-400 font-medium text-center leading-relaxed px-6`}>
            Ketikkan kata kunci seperti "Pelantikan", "Upacara", atau "Sumpah" untuk mencari pedoman protokol dengan cepat.
          </Text>
        </View>
      ) : scenarios.length > 0 ? (
        <View style={tw`flex-1 px-5 pt-4`}>
          <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1`}>
            Hasil Pencarian Pedoman ({scenarios.length})
          </Text>
          
          <FlatList
            data={scenarios}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3} // Trigger ketika sisa scroll tinggal 30% dari bawah
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
          />
        </View>
      ) : (
        <View style={tw`mx-5 bg-white border border-dashed border-slate-200 p-8 rounded-2xl items-center justify-center mt-6`}>
          <Text style={tw`text-sm text-slate-400 italic text-center`}>
            Pedoman dengan kata kunci "{query}" tidak ditemukan.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}