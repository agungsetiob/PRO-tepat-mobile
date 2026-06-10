import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import axios from "axios";
import tw from "twrnc";

const API_BASE_URL = "http://10.10.23.234:8000/api/v1";
const STORAGE_BASE_URL = "http://10.10.23.234:8000";

export default function Home() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [popularScenarios, setPopularScenarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [catRes, popRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboard`),
        axios
          .get(`${API_BASE_URL}/scenarios/popular`)
          .catch(() => ({ data: { success: false } })),
      ]);

      if (catRes.data.success) setCategories(catRes.data.data);
      if (popRes.data.success) setPopularScenarios(popRes.data.data);
    } catch (error) {
      console.error("Gagal memuat data beranda:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case "binoculars":
        return "🪑";
      case "dumbbell":
        return "📅";
      case "anvil":
        return "👑";
      default:
        return "📁";
    }
  };

  const getCategoryColor = (type) => {
    switch (type) {
      case "tempat":
        return "bg-teal-600";
      case "acara":
        return "bg-amber-500";
      case "hormat":
        return "bg-slate-700";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER & SEARCH BUTTON */}
      <View style={tw`bg-slate-900 p-6 rounded-b-3xl shadow-md`}>
        <Text style={tw`text-white text-2xl font-black tracking-wide`}>
          PRO-Tepat
        </Text>
        <Text
          style={tw`text-teal-400 text-sm font-semibold tracking-wider uppercase`}
        >
          Kabupaten Tanah Bumbu
        </Text>

        {/* Akses Menuju Halaman Search Global Terpusat */}
        <TouchableOpacity
          onPress={() => router.push("/search")}
          activeOpacity={0.9}
          style={tw`bg-white rounded-2xl flex-row items-center px-4 py-3.5 shadow-sm mt-4 border border-slate-100`}
        >
          <Text style={tw`text-base mr-3`}>🔍</Text>
          <Text style={tw`text-slate-400 text-sm flex-1 font-medium`}>
            Cari acara, denah, atau pedoman..
          </Text>
        </TouchableOpacity>
      </View>

      {/* KONTEN UTAMA */}
      <ScrollView style={tw`flex-1 px-5 pt-6`}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#0d9488" style={tw`mt-10`} />
        ) : (
          <View>
            {/* UTILITIES SHORTCUT (KAMUS SAKU) */}
            <TouchableOpacity
              onPress={() => router.push("/honorifics")}
              style={tw`bg-teal-600 p-4 rounded-2xl shadow-sm mb-6 flex-row items-center justify-between`}
            >
              <View style={tw`flex-row items-center`}>
                <Text style={tw`text-2xl mr-3`}>👑</Text>
                <View>
                  <Text
                    style={tw`text-white text-xs font-bold uppercase tracking-wider`}
                  >
                    Kamus Saku Protokol
                  </Text>
                  <Text style={tw`text-teal-100 text-[11px] mt-0.5`}>
                    Database Sapaan Resmi & Lisan Pejabat
                  </Text>
                </View>
              </View>
              <Text style={tw`text-white font-bold text-base`}>❯</Text>
            </TouchableOpacity>

            {/* GRID KATEGORI UTAMA */}
            <Text
              style={tw`text-xs font-bold text-slate-400 tracking-widest uppercase mb-3`}
            >
              Kategori Pedoman
            </Text>
            <View style={tw`flex-row flex-wrap gap-3 mb-6`}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => router.push(`/category/${cat.slug}/scenarios`)}
                  style={tw`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-1 min-w-[45%] items-center`}
                  activeOpacity={0.8}
                >
                  <View
                    style={tw`${getCategoryColor(cat.type)} w-12 h-12 rounded-2xl items-center justify-center mb-3 shadow-sm`}
                  >
                    <Text style={tw`text-white text-xl`}>
                      {getCategoryIcon(cat.icon)}
                    </Text>
                  </View>
                  <Text
                    style={tw`text-xs font-black text-slate-800 text-center uppercase tracking-wide`}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* WIDGET PEDOMAN POPULER / TERKINI */}
            <Text
              style={tw`text-xs font-bold text-slate-400 tracking-widest uppercase mb-3`}
            >
              ⚡ Skenario Protokol Terkini
            </Text>

            {popularScenarios && popularScenarios.length > 0 ? (
              popularScenarios.map((scen) => (
                <TouchableOpacity
                  key={scen.id}
                  onPress={() => router.push(`/scenarios/${scen.slug}`)}
                  style={tw`bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex-row items-center mb-2.5`}
                  activeOpacity={0.7}
                >
                  {scen.thumbnail ? (
                    <Image
                      source={{ uri: `${STORAGE_BASE_URL}${scen.thumbnail}` }}
                      style={tw`w-12 h-12 rounded-xl bg-slate-200 mr-3`}
                    />
                  ) : (
                    <View
                      style={tw`bg-slate-100 w-12 h-12 rounded-xl items-center justify-center mr-3`}
                    >
                      <Text style={tw`text-base`}>📋</Text>
                    </View>
                  )}
                  <View style={tw`flex-1`}>
                    <Text
                      style={tw`text-xs font-black text-slate-800`}
                      numberOfLines={1}
                    >
                      {scen.title}
                    </Text>
                    <Text
                      style={tw`text-[10px] text-slate-400 mt-0.5 uppercase font-semibold`}
                    >
                      {scen.category?.name || "Pedoman"} • Layout{" "}
                      {scen.layout_type}
                    </Text>
                  </View>
                  <Text style={tw`text-slate-300 font-bold px-1`}>❯</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View
                style={tw`bg-white border border-dashed border-slate-200 p-4 rounded-xl items-center justify-center`}
              >
                <Text style={tw`text-xs text-slate-400 italic`}>
                  Tidak ada skenario terkini.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* FOOTER */}
        <View style={tw`mt-6 mb-12 items-center`}>
          <Text style={tw`text-[10px] text-slate-400 font-medium`}>
            PRO-Tepat v1.1
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}