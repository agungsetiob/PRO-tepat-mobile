import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import axios from 'axios';
import tw from 'twrnc';

const API_BASE_URL = 'http://10.10.23.251:8000/api/v1';
const STORAGE_BASE_URL = 'http://10.10.23.251:8000';

export default function Home() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search.trim().length > 0) {
        handleSearch(search);
      } else {
        setIsSearching(false);
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard`);
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setIsSearching(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/search?q=${query}`);
      if (response.data.success) {
        setSearchResults(response.data.data);
      }
    } catch (error) {
      console.error("Gagal melakukan pencarian:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Peta pembacaan Emoji berdasarkan key icon dari CMS
  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'binoculars': return '🪑';
      case 'dumbbell': return '📅';
      case 'anvil': return '👑';
      default: return '📁';
    }
  };

  const getCategoryColor = (type) => {
    switch (type) {
      case 'tempat': return 'bg-teal-600';
      case 'acara': return 'bg-amber-500';
      case 'hormat': return 'bg-slate-700';
      default: return 'bg-blue-500';
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER UTAMA */}
      <View style={tw`bg-slate-900 p-6 rounded-b-3xl shadow-md`}>
        <Text style={tw`text-white text-2xl font-black tracking-wide`}>PRO-Tepat</Text>
        <Text style={tw`text-teal-400 text-sm font-semibold tracking-wider uppercase`}>Kabupaten Tanah Bumbu</Text>
        
        {/* QUICK SEARCH BAR */}
        <View style={tw`mt-5 bg-white rounded-xl flex-row items-center px-4 py-1 shadow-sm`}>
          <Text style={tw`text-lg mr-2`}>🔍</Text>
          <TextInput 
            value={search}
            onChangeText={setSearch}
            placeholder="Cari kata kunci aturan (umum, bupati)..." 
            placeholderTextColor="#94a3b8"
            style={tw`flex-1 text-sm text-slate-800 py-2.5`}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={tw`text-slate-400 font-bold px-2 text-lg`}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={tw`flex-1 px-5 pt-6`}>
        {search.trim().length > 0 ? (
          /* ================= HASIL PENCARIAN LIVE ================= */
          <View>
            <Text style={tw`text-xs font-bold text-slate-400 tracking-widest uppercase mb-4`}>
              Hasil Pencarian: "{search}" ({searchResults.length})
            </Text>

            {isSearching ? (
              <ActivityIndicator size="small" color="#0d9488" style={tw`mt-4`} />
            ) : searchResults.length > 0 ? (
              searchResults.map((scenario) => (
                <TouchableOpacity 
                  key={scenario.id}
                  onPress={() => router.push(`/scenario/${scenario.slug}`)}
                  style={tw`bg-white p-3 rounded-2xl border border-slate-100 shadow-sm mb-3 flex-row items-center`}
                >
                  {scenario.thumbnail ? (
                    <Image 
                      source={{ uri: `${STORAGE_BASE_URL}${scenario.thumbnail}` }} 
                      style={tw`w-12 h-12 rounded-xl bg-slate-100 mr-3`}
                    />
                  ) : (
                    <View style={tw`${getCategoryColor(scenario.category?.type)} w-12 h-12 rounded-xl items-center justify-center mr-3`}>
                      <Text style={tw`text-lg text-white`}>{getCategoryIcon(scenario.category?.icon)}</Text>
                    </View>
                  )}
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-sm font-bold text-slate-800`} numberOfLines={1}>{scenario.title}</Text>
                    <Text style={tw`text-[11px] text-teal-600 font-medium mt-0.5`}>{scenario.category?.name} • Layout {scenario.layout_type}</Text>
                  </View>
                  <Text style={tw`text-slate-300 font-bold px-1`}>❯</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={tw`text-sm text-slate-400 text-center mt-6`}>Pedoman protokol tidak ditemukan.</Text>
            )}
          </View>
        ) : (
          /* ================= DAFTAR KATEGORI KONDISI NORMAL ================= */
          <View>
            <Text style={tw`text-xs font-bold text-slate-400 tracking-widest uppercase mb-4`}>
              Daftar Kategori Pedoman
            </Text>

            {isLoading ? (
              <ActivityIndicator size="large" color="#0d9488" style={tw`mt-10`} />
            ) : (
              categories.map((cat) => (
                <View key={cat.id} style={tw`mb-5`}>
                  {/* Judul Kategori */}
                  <View style={tw`flex-row items-center mb-3`}>
                    <View style={tw`${getCategoryColor(cat.type)} w-8 h-8 rounded-lg items-center justify-center mr-2 shadow-sm`}>
                      <Text style={tw`text-white text-sm`}>{getCategoryIcon(cat.icon)}</Text>
                    </View>
                    <Text style={tw`text-sm font-extrabold text-slate-800 uppercase tracking-wide`}>{cat.name}</Text>
                  </View>

                  {/* List Skenario di Bawah Kategori */}
                  {cat.scenarios && cat.scenarios.length > 0 ? (
                    cat.scenarios.map((scen) => (
                      <TouchableOpacity 
                        key={scen.id}
                        onPress={() => router.push(`/scenario/${scen.slug}`)}
                        style={tw`bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex-row items-center mb-2`}
                        activeOpacity={0.7}
                      >
                        {scen.thumbnail && (
                          <Image 
                            source={{ uri: `${STORAGE_BASE_URL}${scen.thumbnail}` }} 
                            style={tw`w-10 h-10 rounded-xl bg-slate-200 mr-3`}
                          />
                        )}
                        <View style={tw`flex-1`}>
                          <Text style={tw`text-xs font-bold text-slate-800`}>{scen.title}</Text>
                          <Text style={tw`text-[10px] text-slate-400 mt-0.5 uppercase`}>{scen.jenis_acara} • Layout {scen.layout_type}</Text>
                        </View>
                        <Text style={tw`text-slate-300 font-bold`}>❯</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={tw`bg-slate-100 p-3 rounded-xl border border-dashed border-slate-200`}>
                      <Text style={tw`text-[11px] text-slate-400 italic`}>Belum ada sub-skenario di kategori ini.</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}
        <View style={tw`mt-6 mb-12 items-center`}>
          <Text style={tw`text-[10px] text-slate-400 font-medium`}>PRO-Tepat v1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}