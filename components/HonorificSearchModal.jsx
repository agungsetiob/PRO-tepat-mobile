import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal } from "react-native";
import tw from "twrnc";

export default function HonorificSearchModal({ visible, onClose, onSelect, honorifics }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHonorifics = (honorifics || []).filter((hp) =>
    (hp.jabatan || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (hp.sapaan_resmi || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (hp.sapaan_lisan || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (id) => {
    onSelect(id);
    setSearchQuery("");
  };

  const handleClose = () => {
    setSearchQuery("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={tw`flex-1 bg-black/70 justify-end`}>
        <View style={tw`bg-slate-900 h-[70%] rounded-t-3xl p-5 border-t border-slate-800`}>
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text style={tw`text-white text-sm font-black uppercase tracking-wide`}>Cari Jabatan / Nama Undangan</Text>
            <TouchableOpacity onPress={handleClose} style={tw`bg-slate-700 p-1 rounded-full px-2`}>
              <Text style={tw`text-white font-bold`}>X</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Ketik jabatan Pejabat..."
            placeholderTextColor="#64748b"
            autoFocus={true}
            style={tw`bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-sm mb-4`}
          />

          <FlatList
            data={filteredHonorifics}
            keyExtractor={(item) => `search-honorific-${item.id}`}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelect(item.id)}
                style={tw`p-3.5 border-b border-slate-800 bg-slate-800/20 rounded-lg mb-1.5`}
              >
                <Text style={tw`text-white text-xs font-bold`}>{item.jabatan}</Text>
                {item.sapaan_resmi && (
                  <Text style={tw`text-slate-400 text-[11px] mt-0.5`}>{item.sapaan_resmi}</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={tw`py-10 items-center`}>
                <Text style={tw`text-slate-500 text-xs italic`}>Tidak ada data jabatan/undangan ditemukan.</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}