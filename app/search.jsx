import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import axios from 'axios';
import tw from 'twrnc';

const API_BASE_URL = 'http://10.10.23.234:8000/api/v1';

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [scenarios, setScenarios] = useState([]);
  const [filteredScenarios, setFilteredScenarios] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Ambil semua daftar skenario di awal untuk pencarian lokal yang instan
  useEffect(() => {
    fetchAllScenarios();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [query, scenarios]);

  const fetchAllScenarios = async () => {
    setIsLoading(true);
    try {
      // Endpoint yang mengembalikan seluruh daftar skenario aktif
      const response = await axios.get(`${API_BASE_URL}/scenarios`);
      
      // Jika backend Anda belum punya endpoint global /scenarios, alternatifnya 
      // Mas bisa menembak endpoint kategori atau memfilter data lokal.
      if (response.data.success) {
        setScenarios(response.data.data || []);
      }
    } catch (error) {
      console.error("Gagal memuat master data skenario:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (query.trim().length === 0) {
      setFilteredScenarios([]);
      return;
    }

    const keyword = query.toLowerCase();
    const result = scenarios.filter(scen => 
      scen.title?.toLowerCase().includes(keyword) ||
      scen.description?.toLowerCase().includes(keyword) ||
      scen.jenis_acara?.toLowerCase().includes(keyword)
    );

    setFilteredScenarios(result);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`}>
      <StatusBar barStyle="dark-content" />

      {/* SEARCH BAR HEADER */}
      <View style={tw`bg-slate-900 p-5 rounded-b-3xl shadow-md`}>
        <View style={tw`flex-row items-center`}>
          <TouchableOpacity onPress={() => router.back()} style={tw`mr-3`}>
            <Text style={tw`text-white text-xl font-bold`}>❮</Text>
          </TouchableOpacity>
          
          <View style={tw`flex-1 bg-white rounded-xl flex-row items-center px-3 py-0.5 border border-slate-100`}>
            <Text style={tw`text-base mr-2`}>🔍</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Cari susunan acara, denah, pedoman..."
              placeholderTextColor="#94a3b8"
              autoFocus={true}
              style={tw`flex-1 text-sm text-slate-800 py-2.5`}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Text style={tw`text-slate-400 font-bold px-2 text-lg`}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* HASIL PENCARIAN */}
      {isLoading ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={tw`text-xs text-slate-400 mt-2`}>Mempersiapkan indeks pencarian...</Text>
        </View>
      ) : (
        <ScrollView style={tw`flex-1 px-5 pt-4`}>
          {query.trim().length === 0 ? (
            <View style={tw`items-center justify-center py-12`}>
              <Text style={tw`text-2xl mb-2`}>💡</Text>
              <Text style={tw`text-xs text-slate-400 font-medium text-center leading-relaxed px-6`}>
                Ketikkan kata kunci seperti "Pelantikan", "Upacara", atau "Sumpah" untuk mencari pedoman protokol dengan cepat.
              </Text>
            </View>
          ) : filteredScenarios.length > 0 ? (
            <View>
              <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1`}>
                Hasil Pencarian Pedoman ({filteredScenarios.length})
              </Text>
              
              {filteredScenarios.map((scen) => (
                <TouchableOpacity
                  key={scen.id}
                  onPress={() => router.push(`/scenarios/${scen.slug}`)}
                  style={tw`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-3 flex-row items-center`}
                  activeOpacity={0.7}
                >
                  <View style={tw`bg-teal-50 w-11 h-11 rounded-xl items-center justify-center mr-3.5`}>
                    <Text style={tw`text-base`}>📋</Text>
                  </View>

                  <View style={tw`flex-1`}>
                    <Text style={tw`text-xs font-black text-slate-800 mb-0.5`} numberOfLines={1}>
                      {scen.title}
                    </Text>
                    <Text style={tw`text-[9px] text-slate-400 font-bold uppercase tracking-wide`}>
                      {scen.jenis_acara} • {scen.category?.name || 'Pedoman'}
                    </Text>
                  </View>
                  
                  <Text style={tw`text-slate-300 font-bold ml-2`}>❯</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={tw`bg-white border border-dashed border-slate-200 p-8 rounded-2xl items-center justify-center mt-2`}>
              <Text style={tw`text-sm text-slate-400 italic text-center`}>
                Pedoman dengan kata kunci "{query}" tidak ditemukan.
              </Text>
            </View>
          )}
          <View style={tw`mb-12`} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}