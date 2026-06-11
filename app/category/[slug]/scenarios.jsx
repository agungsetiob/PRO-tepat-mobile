import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import tw from "twrnc";
import Constants from "expo-constants";
import { Search } from "lucide-react-native";

const { API_BASE_URL, STORAGE_BASE_URL } = Constants.expoConfig.extra;

export default function CategoryScenarios() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const [scenarios, setScenarios] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchScenarios();
    }
  }, [slug]);

  const fetchScenarios = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/categories/${slug}/scenarios`,
      );
      if (response.data.success) {
        setScenarios(response.data.data || []);
        setCategoryName(response.data.category_name || "Daftar Skenario");
        setCount(response.data.count || 0);
      }
    } catch (error) {
      console.error("Gagal memuat skenario kategori:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 bg-slate-50 justify-center items-center`}>
        <ActivityIndicator size="large" color="#0d9488" />
        <Text style={tw`text-xs text-slate-400 mt-2`}>
          Memuat daftar pedoman...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={tw`flex-1 bg-slate-50`}>
      <StatusBar barStyle="light-content" />

      {/* TOP HEADER */}
      <View style={tw`bg-slate-900 p-5 pt-12 rounded-b-3xl`}>
        <View style={tw`flex-row items-center mb-4`}>
          <TouchableOpacity onPress={() => router.back()} style={tw`mr-4`}>
            <Text style={tw`text-white text-xl font-bold`}>❮</Text>
          </TouchableOpacity>
          <View style={tw`flex-1`}>
            <Text
              style={tw`text-teal-400 text-[10px] font-bold tracking-widest uppercase`}
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

        {/* SEARCH BAR */}
        <TouchableOpacity
          onPress={() => router.push("/search")}
          activeOpacity={0.9}
          style={tw`flex-row items-center bg-white rounded-full px-4 py-2.5 shadow-md border border-slate-200`}
        >
          <Search size={18} color="#64748b" strokeWidth={2.2} />
          <Text style={tw`text-slate-400 text-sm flex-1 font-medium`}>
            Cari acara, denah, atau pedoman...
          </Text>
        </TouchableOpacity>
      </View>

      {/* LIST KONTEN SKENARIO */}
      <View style={tw`p-5`}>
        <Text
          style={tw`text-xs font-bold text-slate-400 uppercase tracking-wider mb-4`}
        >
          Silahkan Pilih Sub-Skenario ({count})
        </Text>

        {scenarios && scenarios.length > 0 ? (
          scenarios.map((scen) => (
            <TouchableOpacity
              key={scen.id}
              onPress={() => router.push(`/scenarios/${scen.slug}`)}
              style={tw`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-3 flex-row items-center`}
              activeOpacity={0.7}
            >
              {scen.thumbnail ? (
                <Image
                  source={{ uri: `${STORAGE_BASE_URL}${scen.thumbnail}` }}
                  style={tw`w-14 h-14 rounded-xl bg-slate-100 mr-4`}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={tw`bg-teal-50 w-14 h-14 rounded-xl items-center justify-center mr-4`}
                >
                  <Text style={tw`text-xl`}>📄</Text>
                </View>
              )}

              <View style={tw`flex-1`}>
                <Text
                  style={tw`text-sm font-extrabold text-slate-800 mb-0.5`}
                  numberOfLines={1}
                >
                  {scen.title}
                </Text>
                <Text
                  style={tw`text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-2`}
                >
                  {scen.jenis_acara} • {scen.layout_type}
                </Text>

                {/* Render Mini Tags List */}
                <View style={tw`flex-row flex-wrap gap-1`}>
                  {scen.tags?.map((tag) => (
                    <View
                      key={tag.id}
                      style={tw`bg-slate-50 border border-slate-100 px-2 py-0.5 rounded`}
                    >
                      <Text style={tw`text-[9px] text-slate-500`}>
                        #{tag.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <Text style={tw`text-slate-300 font-bold ml-2`}>❯</Text>
            </TouchableOpacity>
          ))
        ) : (
          <View
            style={tw`bg-white border border-dashed border-slate-200 p-8 rounded-2xl items-center justify-center`}
          >
            <Text style={tw`text-sm text-slate-400 italic text-center`}>
              Belum ada sub-skenario yang aktif di dalam kategori ini.
            </Text>
          </View>
        )}
      </View>

      <View style={tw`mb-12`} />
    </ScrollView>
  );
}
