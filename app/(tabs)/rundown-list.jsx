import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import api from "../../api/api";
import tw from "twrnc";
import { LinearGradient } from "expo-linear-gradient";
import { Search, X, ArrowLeft } from "lucide-react-native";

export default function RundownList() {
  const router = useRouter();

  const [rundowns, setRundowns] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRundowns(true);
  }, []);

  const fetchRundowns = async (isInitial = true, searchTxt = searchQuery) => {
    if (isInitial) setIsLoading(true);
    try {
      const response = await api.get(`/generated-rundowns?search=${searchTxt}`);
      if (response.data.success) {
        setRundowns(response.data.data || []);
        setNextCursor(response.data.next_cursor);
        setHasMore(response.data.has_more);
      }
    } catch (error) {
      console.error("Gagal memuat riwayat rundown:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await api.get(`/generated-rundowns?search=${searchQuery}`);
      if (response.data.success) {
        setRundowns(response.data.data || []);
        setNextCursor(response.data.next_cursor);
        setHasMore(response.data.has_more);
      }
    } catch (error) {
      console.error("Gagal memperbarui data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [searchQuery]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return;

    setIsLoadingMore(true);
    try {
      const response = await api.get(
        `/generated-rundowns?search=${searchQuery}&cursor=${nextCursor}`
      );
      if (response.data.success) {
        const newData = response.data.data || [];
        setRundowns((prev) => [...prev, ...newData]);
        setNextCursor(response.data.next_cursor);
        setHasMore(response.data.has_more);
      }
    } catch (error) {
      console.error("Gagal memuat data berikutnya:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    fetchRundowns(true, text);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/rundown-detail/${item.id}`)}
      activeOpacity={0.8}
      style={tw`bg-slate-800/80 border border-slate-700 p-4 rounded-2xl mb-3 flex-row items-center justify-between`}
    >
      <View style={tw`flex-1 mr-3`}>
        <Text style={tw`text-white text-sm font-black uppercase tracking-wide mb-1`} numberOfLines={1}>
          {item.event_name}
        </Text>
        <Text style={tw`text-slate-400 text-[11px] mb-1 font-semibold`}>
          📅 {item.date} • ⏱️ {item.time_info}
        </Text>
        <Text style={tw`text-slate-400 text-[11px] font-medium`} numberOfLines={1}>
          📍 {item.location} {item.pic ? `• 👤 PJ: ${item.pic}` : ""}
        </Text>
      </View>
      
      <View style={tw`items-end`}>
        <View style={tw`bg-teal-500/20 border border-teal-500/30 px-2 py-1 rounded-lg mb-1`}>
          <Text style={tw`text-teal-400 text-[9px] font-black uppercase`}>
            {item.items_count || 0} Acara
          </Text>
        </View>
        <View style={tw`bg-indigo-500/20 border border-indigo-500/30 px-2 py-1 rounded-lg`}>
          <Text style={tw`text-indigo-400 text-[9px] font-black uppercase`}>
            {item.invitations_count || 0} Undangan
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={tw`py-4 items-center`}>
          <ActivityIndicator size="small" color="#3bd9e8" />
          <Text style={tw`text-[10px] text-slate-400 mt-1 font-medium`}>Memuat data lama...</Text>
        </View>
      );
    }
    return (
      <View style={tw`mt-4 mb-8 items-center`}>
        <Text style={tw`text-[10px] text-slate-500 font-bold uppercase tracking-wider`}>
          Arsip Dokumen ROTAP
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#0d1731]`} edges={["bottom", "left", "right"]}>
      {/* HEADER GRADIEN DENGAN INPUT SEARCH */}
      <LinearGradient
        colors={["#3bd9e8", "#9359e9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={tw`px-5 pt-10 pb-5 rounded-b-3xl shadow-lg`}
      >
        <View style={tw`flex-row items-center mb-4`}>
          <TouchableOpacity onPress={() => router.back()} style={tw`mr-3`}>
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={tw`text-white text-lg font-black uppercase tracking-wide`}>
            Riwayat Rundown
          </Text>
        </View>
        <View style={tw`flex-row items-center bg-white/15 rounded-full px-4 border border-white/30`}>
          <Search size={18} color="#ffffff" strokeWidth={2.2} />
          <TextInput
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Cari nama acara atau tempat"
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={tw`flex-1 text-sm text-white py-2 ml-2`}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchRundowns(); }}>
              <X size={18} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={tw`flex-1`}
      >
        {isLoading ? (
          <View style={tw`flex-1 justify-center items-center`}>
            <ActivityIndicator size="large" color="#3bd9e8" />
            <Text style={tw`text-xs text-slate-400 mt-2`}>Memuat data...</Text>
          </View>
        ) : (
          <FlatList
            data={rundowns}
            renderItem={renderItem}
            keyExtractor={(item) => "rundown-list-item-" + item.id}
            contentContainerStyle={tw`px-5 pt-4`}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.2}
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#3bd9e8"]}
                tintColor="#3bd9e8"
              />
            }
            ListEmptyComponent={
              <View style={tw`py-20 items-center`}>
                <Text style={tw`text-slate-500 text-xs italic text-center`}>
                  Tidak ditemukan riwayat susunan acara.
                </Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}