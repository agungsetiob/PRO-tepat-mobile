import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import axios from 'axios';
import tw from 'twrnc';
import Constants from 'expo-constants';
import { Search } from "lucide-react-native";

const { API_BASE_URL } = Constants.expoConfig.extra;

export default function Honorifics() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [honorifics, setHonorifics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHonorifics();
  }, []);

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

  const searchHonorifics = async (keyword) => {
    if (!keyword || keyword.trim().length === 0) {
      fetchHonorifics();
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/search-honorifics?q=${keyword}`);
      if (response.data.success) {
        setHonorifics(response.data.data || []);
      }
    } catch (error) {
      console.error("Gagal mencari data:", error);
    } finally {
      setIsLoading(false);
    }
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

        {/* SEARCH BAR dengan style cantik */}
        <View style={tw`flex-row items-center bg-white rounded-full px-4 shadow-md border border-slate-200`}>
          <Search size={18} color="#64748b" strokeWidth={2.2} />
          <TextInput
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              searchHonorifics(text);
            }}
            placeholder="Ketik jabatan (Bupati, Dandim, Camat...)"
            placeholderTextColor="#94a3b8"
            style={tw`flex-1 text-sm text-slate-800`}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); fetchHonorifics(); }}>
              <Text style={tw`text-slate-400 font-bold px-2 text-lg`}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* LIST DATA */}
      {isLoading ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={tw`text-xs text-slate-400 mt-2`}>
            Sinkronisasi nama jabatan...
          </Text>
        </View>
      ) : (
        <ScrollView style={tw`flex-1 px-5 pt-2`}>
          {honorifics.length > 0 ? (
            honorifics.map((item) => (
              <View
                key={item.id}
                style={tw`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-3`}
              >
                <View style={tw`flex-row justify-between items-start mb-2`}>
                  <Text style={tw`text-sm font-black text-slate-800 flex-1 mr-2`}>
                    {item.jabatan}
                  </Text>
                  <View style={tw`bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded`}>
                    <Text style={tw`text-[9px] text-slate-400 font-bold`}>
                      #{item.tingkat}
                    </Text>
                  </View>
                </View>

                <View style={tw`mt-2 pt-2 border-t border-slate-100 gap-2`}>
                  <View>
                    <Text style={tw`text-[10px] text-slate-400 uppercase font-bold tracking-wide`}>
                      📢 Sapaan Resmi
                    </Text>
                    <Text style={tw`text-xs font-bold text-slate-700 mt-0.5`}>
                      {item.sapaan_resmi || '-'}
                    </Text>
                  </View>
                  <View>
                    <Text style={tw`text-[10px] text-slate-400 uppercase font-bold tracking-wide`}>
                      🗣️ Sapaan Lisan
                    </Text>
                    <Text style={tw`text-xs font-semibold text-teal-600 mt-0.5`}>
                      {item.sapaan_lisan || '-'}
                    </Text>
                  </View>
                  {item.perlakuan_khusus && (
                    <View style={tw`bg-blue-50 p-2.5 rounded-xl mt-1 border border-blue-100`}>
                      <Text style={tw`text-[10px] text-blue-700 font-bold uppercase tracking-wide`}>
                        ⚠️ Perlakuan Khusus
                      </Text>
                      <Text style={tw`text-[11px] text-blue-600 font-medium mt-0.5 leading-relaxed`}>
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
