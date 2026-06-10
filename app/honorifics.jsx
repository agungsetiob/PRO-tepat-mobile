import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import axios from 'axios';
import tw from 'twrnc';

const API_BASE_URL = 'http://10.10.23.234:8000/api/v1';

export default function Honorifics() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [honorifics, setHonorifics] = useState([]);
  const [filteredHonorifics, setFilteredHonorifics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHonorifics();
  }, []);

  useEffect(() => {
    filterData();
  }, [search, honorifics]);

  const fetchHonorifics = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/honorifics`);
      if (response.data.success) {
        setHonorifics(response.data.data || []);
      }
    } catch (error) {
      console.error("Gagal memuat data kamus protokol:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterData = () => {
    let result = [...honorifics];

    // Filter murni berdasarkan keyword pencarian text (Jabatan atau Sapaan)
    if (search.trim().length > 0) {
      const query = search.toLowerCase();
      result = result.filter(item => 
        item.jabatan?.toLowerCase().includes(query) ||
        item.sapaan_resmi?.toLowerCase().includes(query) ||
        item.sapaan_lisan?.toLowerCase().includes(query)
      );
    }

    // Tetap kita urutkan berdasarkan kolom tingkat (agar urutan kepangkatan dari Laravel tetap rapi)
    result.sort((a, b) => a.tingkat - b.tingkat);

    setFilteredHonorifics(result);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER & SEARCH BAR */}
      <View style={tw`bg-slate-900 p-5 rounded-b-3xl shadow-md mb-3`}>
        <View style={tw`flex-row items-center mb-4`}>
          <TouchableOpacity onPress={() => router.back()} style={tw`mr-3`}>
            <Text style={tw`text-white text-xl font-bold`}>❮</Text>
          </TouchableOpacity>
          <View>
            <Text style={tw`text-teal-400 text-[10px] font-bold tracking-widest uppercase`}>
              Kamus Saku Protokol
            </Text>
            <Text style={tw`text-white text-base font-black uppercase tracking-wide`}>
              Sapaan & Tata Penghormatan
            </Text>
          </View>
        </View>

        {/* INPUT PENCARIAN */}
        <View style={tw`bg-white rounded-xl flex-row items-center px-4 py-1 shadow-sm`}>
          <Text style={tw`text-lg mr-2`}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Ketik jabatan (Bupati, Dandim, Camat...)"
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

      {/* LIST DATA SAPAAN */}
      {isLoading ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={tw`text-xs text-slate-400 mt-2`}>Sinkronisasi nama jabatan...</Text>
        </View>
      ) : (
        <ScrollView style={tw`flex-1 px-5 pt-2`}>
          {filteredHonorifics.length > 0 ? (
            filteredHonorifics.map((item) => (
              <View
                key={item.id}
                style={tw`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-3`}
              >
                {/* Bagian Atas Kartu */}
                <View style={tw`flex-row justify-between items-start mb-2`}>
                  <Text style={tw`text-sm font-black text-slate-800 flex-1 mr-2`}>
                    {item.jabatan}
                  </Text>
                  {/* Urutan hierarki internal tetap bisa diintip tipis-tipis lewat nomor tingkat */}
                  <View style={tw`bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded`}>
                    <Text style={tw`text-[9px] text-slate-400 font-bold`}>
                      #{item.tingkat}
                    </Text>
                  </View>
                </View>

                {/* Konten Utama */}
                <View style={tw`mt-2 pt-2 border-t border-slate-100 gap-2`}>
                  {/* Sapaan Resmi */}
                  <View>
                    <Text style={tw`text-[10px] text-slate-400 uppercase font-bold tracking-wide`}>
                      📢 Sapaan Resmi (Naskah / Sambutan)
                    </Text>
                    <Text style={tw`text-xs font-bold text-slate-700 mt-0.5`}>
                      {item.sapaan_resmi || '-'}
                    </Text>
                  </View>

                  {/* Sapaan Lisan */}
                  <View>
                    <Text style={tw`text-[10px] text-slate-400 uppercase font-bold tracking-wide`}>
                      🗣️ Sapaan Lisan (Oleh MC / Pembawa Acara)
                    </Text>
                    <Text style={tw`text-xs font-semibold text-teal-600 mt-0.5`}>
                      {item.sapaan_lisan || '-'}
                    </Text>
                  </View>

                  {/* Perlakuan Khusus */}
                  {item.perlakuan_khusus && (
                    <View style={tw`bg-red-50 p-2.5 rounded-xl mt-1 border border-red-100`}>
                      <Text style={tw`text-[10px] text-red-700 font-bold uppercase tracking-wide`}>
                        ⚠️ Perlakuan / Aturan Khusus
                      </Text>
                      <Text style={tw`text-[11px] text-red-600 font-medium mt-0.5 leading-relaxed`}>
                        {item.perlakuan_khusus}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={tw`bg-white border border-dashed border-slate-200 p-8 rounded-2xl items-center justify-center mt-4`}>
              <Text style={tw`text-sm text-slate-400 italic text-center`}>
                Jabatan atau sapaan tidak ditemukan.
              </Text>
            </View>
          )}
          <View style={tw`mb-12`} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}