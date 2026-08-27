import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal } from "react-native";
import tw from "twrnc";

export default function AgendaSearchModal({ visible, onClose, onSelect, agendas }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAgendas = (agendas || []).filter((agenda) =>
    (agenda.name || "").toLowerCase().includes(searchQuery.toLowerCase())
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
            <Text style={tw`text-white text-sm font-black uppercase tracking-wide`}>Cari acara/agenda</Text>
            <TouchableOpacity onPress={handleClose} style={tw`bg-slate-700 p-1 rounded-full px-2`}>
              <Text style={tw`text-white font-bold`}>X</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Ketik kata kunci agenda..."
            placeholderTextColor="#64748b"
            autoFocus={true}
            style={tw`bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-sm mb-4`}
          />

          <FlatList
            data={filteredAgendas}
            keyExtractor={(item) => `search-agenda-${item.id}`}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelect(item.id)}
                style={tw`p-3.5 border-b border-slate-800 bg-slate-800/20 rounded-lg mb-1.5`}
              >
                <Text style={tw`text-white text-xs`}>{item.name}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={tw`py-10 items-center`}>
                <Text style={tw`text-slate-500 text-xs italic`}>Tidak ada acara/agenda.</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}