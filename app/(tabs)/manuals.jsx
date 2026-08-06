import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import tw from "twrnc";
import { LinearGradient } from "expo-linear-gradient";
import * as LucideIcons from "lucide-react-native";
import api from "../../api/api";
import { STORAGE_BASE_URL } from '@env';

const DynamicIcon = ({ name, color = "#ffffff", size = 22 }) => {
  const pascalCaseName = name
    ? name
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("")
    : "Folder";
  const IconComponent = LucideIcons[pascalCaseName] || LucideIcons.Folder;
  return <IconComponent color={color} size={size} strokeWidth={2.5} />;
};

export default function Manuals() {
  const router = useRouter();
  const [manuals, setManuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchManuals = async () => {
    try {
      const response = await api.get("/manual-books");
      if (response.data.success) {
        setManuals(response.data.data || []);
        setError(null);
      } else {
        setError("Gagal memuat data manual book.");
      }
    } catch (err) {
      console.error("Error fetching manuals:", err);
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchManuals();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchManuals();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/manual/${item.id}`)}
      activeOpacity={0.7}
      style={tw`bg-slate-800/80 p-4 rounded-2xl border border-slate-700 shadow-sm mb-3 flex-row items-center`}
    >
      <View
        style={tw`bg-teal-500/20 w-14 h-14 rounded-xl items-center justify-center mr-4`}
      >
        <DynamicIcon name="book-open" color="#3bd9e8" size={24} />
      </View>

      <View style={tw`flex-1`}>
        <Text
          style={[
            tw`text-sm text-white mb-1`,
            { fontFamily: "Montserrat-Bold" },
          ]}
        >
          {item.title}
        </Text>

        <Text
          style={[
            tw`text-[10px] text-slate-400 uppercase`,
            { fontFamily: "Montserrat-Regular" },
          ]}
        >
          {item.uploaded_by || "Admin"} •{" "}
          {new Date(item.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Text>
      </View>

      <Text style={tw`text-slate-500 font-bold ml-2`}>❯</Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={tw`flex-1 justify-center items-center py-12`}>
      <DynamicIcon name="file" color="#475569" size={48} />
      <Text
        style={[
          tw`text-slate-400 text-lg mt-4`,
          { fontFamily: "Montserrat-Bold" },
        ]}
      >
        Belum ada manual book
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={tw`flex-1 bg-[#0d1731] justify-center items-center`}>
        <ActivityIndicator size="large" color="#22a594" />
        <Text
          style={[
            tw`text-white text-sm mt-4`,
            { fontFamily: "Montserrat-Regular" },
          ]}
        >
          Memuat manual book...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={tw`flex-1 bg-[#0d1731]`}
      edges={["bottom", "left", "right"]}
    >
      <LinearGradient
        colors={["#3bd9e8", "#9359e9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={tw`p-5 pt-12 rounded-b-3xl`}
      >
        <View style={tw`flex-row items-center mb-4`}>
          <TouchableOpacity onPress={() => router.back()} style={tw`mr-3`}>
            <DynamicIcon name="arrow-left" size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
          <View>
            <Text
              style={tw`text-white text-base font-black uppercase tracking-wide`}
            >
              Manual Book
            </Text>
          </View>
        </View>
      </LinearGradient>

      {error ? (
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <Text
            style={[
              tw`text-red-400 text-base text-center`,
              { fontFamily: "Montserrat-Regular" },
            ]}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={fetchManuals}
            style={tw`mt-4 bg-teal-500 px-6 py-2 rounded-full`}
          >
            <Text style={tw`text-white font-bold`}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={manuals}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={tw`px-5 pt-4 pb-8`}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3bd9e8"]}
              tintColor="#3bd9e8"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
