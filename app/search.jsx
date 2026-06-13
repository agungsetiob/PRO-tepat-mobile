import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, TextInput, TouchableOpacity, FlatList, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import axios from 'axios';
import tw from 'twrnc';
import Constants from 'expo-constants';
import { Search, X } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';

const { API_BASE_URL } = Constants.expoConfig.extra;

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [scenarios, setScenarios] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 0) {
        fetchSearchData(query, 1, false);
      } else {
        setScenarios([]);
        setPage(1);
        setHasMore(false);
      }
    }, 650);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const fetchSearchData = async (searchQuery, pageNum = 1, isLoadMore = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const url = `${API_BASE_URL}/search?q=${encodeURIComponent(searchQuery)}&page=${pageNum}`;
      const response = await axios.get(url);
      
      if (response.data.success) {
        const newData = response.data.data || [];
        setScenarios(prev => isLoadMore ? [...prev, ...newData] : newData);
        setHasMore(response.data.has_more);
        setPage(response.data.current_page || pageNum);
      }
    } catch (error) {
      console.error("Gagal memuat data pencarian:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      fetchSearchData(query, nextPage, true);
    }
  };

  const renderFooter = () => {
    if (!isLoadingMore) return <View style={tw`h-10`} />;
    return (
      <View style={tw`py-4 items-center`}>
        <ActivityIndicator size="small" color="#6b46c1" />
        <Text style={tw`text-[10px] text-slate-400 mt-1`}>Memuat lebih banyak...</Text>
      </View>
    );
  };

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/scenarios/${item.slug}`)}
      style={tw`bg-slate-800/90 p-4 rounded-2xl border border-slate-700 shadow-md mb-3 flex-row items-center`}
      activeOpacity={0.7}
    >
      <View style={tw`bg-teal-500/20 w-11 h-11 rounded-xl items-center justify-center mr-3.5`}>
        <Text style={tw`text-base`}>📋</Text>
      </View>

      <View style={tw`flex-1`}>
        <Text style={tw`text-xs font-black text-white mb-0.5`}>
          {item.title}
        </Text>
        <Text style={tw`text-[9px] text-slate-400 font-bold uppercase tracking-wide`}>
          {item.jenis_acara || 'Resmi'} • {item.category?.name || 'Pedoman'}
        </Text>
      </View>
      
      <Text style={tw`text-slate-500 font-bold ml-2`}>❯</Text>
    </TouchableOpacity>
  ), []);

  return (
    <SafeAreaView style={tw`flex-1 bg-[#0d1731]`} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#3bd9e8" translucent={false} />
      
      {/* HEADER */}
      <LinearGradient
        colors={['#3bd9e8', '#9359e9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={tw`p-5 pt-12 rounded-b-3xl shadow-lg`}
      >
        <View style={tw`flex-row items-center`}>
          <TouchableOpacity onPress={() => router.back()} style={tw`mr-3`}>
            <Text style={tw`text-white text-xl font-bold`}>❮</Text>
          </TouchableOpacity>
          
          <View style={tw`flex-1 bg-white/15 rounded-full flex-row items-center px-3 border border-white/30`}>
            <Search size={18} color="#ffffff" strokeWidth={2.2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Cari pedoman protokol..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              autoFocus={true}
              style={tw`flex-1 text-sm text-white py-2.5 ml-2`}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <X size={18} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* BODY */}
      {isLoading ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <LinearGradient
            colors={['#3bd9e8', '#9359e9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tw`p-6 rounded-2xl`}
          >
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={tw`text-xs text-white mt-3 font-semibold`}>
              Mencari pedoman protokol...
            </Text>
          </LinearGradient>
        </View>
      ) : query.trim().length === 0 ? (
        <View style={tw`flex-1 items-center justify-center px-6`}>
          <Text style={tw`text-3xl mb-3`}>💡</Text>
          <Text style={tw`text-xs text-slate-400 font-medium text-center leading-relaxed`}>
            Ketikkan kata kunci seperti "Pelantikan", "Upacara", atau "Sumpah" untuk mencari pedoman protokol dengan cepat.
          </Text>
        </View>
      ) : scenarios.length > 0 ? (
        <View style={tw`flex-1 px-5 pt-4`}>
          <Text style={tw`text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-3 ml-1`}>
            Hasil Pencarian ({scenarios.length})
          </Text>
          
          <FlatList
            data={scenarios}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
          />
        </View>
      ) : (
        <View style={tw`flex-1 mx-5 bg-slate-800/80 border border-dashed border-slate-600 p-8 rounded-2xl items-center justify-center mt-6`}>
          <Text style={tw`text-sm text-slate-400 italic text-center`}>
            Pedoman dengan kata kunci "{query}" tidak ditemukan.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
