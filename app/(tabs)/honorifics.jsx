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
import api from "../../api/api";
import tw from 'twrnc';
import Constants from 'expo-constants';
import { Search, UserCircle2, Megaphone, Mic, Star, X, ArrowLeft } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';

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
      const response = await api.get('/honorifics');
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
      const response = await api.get(`/search-honorifics?q=${keyword}`);
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
    <SafeAreaView style={tw`flex-1 bg-[#0d1731]`} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#3bd9e8" translucent={false} />

      {/* HEADER GRADIENT */}
      <LinearGradient
        colors={['#3bd9e8', '#9359e9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={tw`p-5 pt-12 rounded-b-3xl shadow-lg`}
      >
        <View style={tw`flex-row items-center mb-4`}>
          <TouchableOpacity onPress={() => router.back()} style={tw`mr-3`}>
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
          <View>
            <Text style={tw`text-white/80 text-[10px] font-bold tracking-widest uppercase`}>
              Kamus Saku Protokol
            </Text>
            <Text style={tw`text-white text-base font-black uppercase tracking-wide`}>
              Sapaan & Tata Penghormatan
            </Text>
          </View>
        </View>

        {/* SEARCH BAR */}
        <View style={tw`flex-row items-center bg-white/15 rounded-full px-4 border border-white/30`}>
          <Search size={18} color="#ffffff" strokeWidth={2.2} />
          <TextInput
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              searchHonorifics(text);
            }}
            placeholder="Cari jabatan (Bupati, Dandim, Camat...)"
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={tw`flex-1 text-sm text-white py-2 ml-2`}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); fetchHonorifics(); }}>
              <X size={18} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* LIST DATA */}
      {isLoading ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#3bd9e8" />
          <Text style={tw`text-xs text-slate-400 mt-2`}>
            Sinkronisasi nama jabatan...
          </Text>
        </View>
      ) : (
        <ScrollView style={tw`flex-1 px-5 pt-4`}>
          {honorifics.length > 0 ? (
            honorifics.map((item) => (
              <View
                key={item.id}
                style={tw`bg-slate-800/90 p-4 rounded-2xl border border-slate-700 shadow-md mb-3`}
              >
                {/* Jabatan */}
                <View style={tw`flex-row justify-between items-start mb-2`}>
                  <View style={tw`flex-row items-center flex-1 mr-2`}>
                    <UserCircle2 size={18} color="#3bd9e8" style={tw`mr-2`} />
                    <Text style={tw`text-sm font-black text-white`}>
                      {item.jabatan}
                    </Text>
                  </View>
                  <View style={tw`bg-slate-700/40 px-2 py-0.5 rounded`}>
                    <Text style={tw`text-[9px] text-slate-300 font-bold`}>
                      #{item.tingkat}
                    </Text>
                  </View>
                </View>

                {/* Sapaan */}
                <View style={tw`mt-2 pt-2 border-t border-slate-700 gap-3`}>
                  <View style={tw`flex-row items-center`}>
                    <Megaphone size={14} color="#fcd34d" style={tw`mr-2`} />
                    <View>
                      <Text style={tw`text-[10px] text-slate-400 uppercase font-bold tracking-wide`}>
                        Sapaan Resmi
                      </Text>
                      <Text style={tw`text-xs font-bold text-slate-200 mt-0.5`}>
                        {item.sapaan_resmi || '-'}
                      </Text>
                    </View>
                  </View>

                  <View style={tw`flex-row items-center`}>
                    <Mic size={14} color="#3bd9e8" style={tw`mr-2`} />
                    <View>
                      <Text style={tw`text-[10px] text-slate-400 uppercase font-bold tracking-wide`}>
                        Sapaan Lisan
                      </Text>
                      <Text style={tw`text-xs font-semibold text-teal-400 mt-0.5`}>
                        {item.sapaan_lisan || '-'}
                      </Text>
                    </View>
                  </View>

                  {item.perlakuan_khusus && (
                    <View style={tw`bg-red-50/10 p-2.5 rounded-xl mt-1 border border-red-500/40 flex-row`}>
                      <Star size={14} color="#f87171" style={tw`mr-2 mt-0.5`} />
                      <View style={tw`flex-1`}>
                        <Text style={tw`text-[10px] text-red-400 font-bold uppercase tracking-wide`}>
                          Perlakuan Khusus
                        </Text>
                        <Text style={tw`text-[11px] text-red-300 font-medium mt-0.5 leading-relaxed`}>
                          {item.perlakuan_khusus}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={tw`bg-slate-800/80 border border-dashed border-slate-600 p-8 rounded-2xl items-center justify-center mt-4`}>
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
