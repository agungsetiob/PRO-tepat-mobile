import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import tw from "twrnc";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function AgendaSearchModal({ visible, onClose, onSelect, agendas }) {
  const [searchQuery, setSearchQuery] = useState("");
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Jika ditarik ke bawah lebih dari 120px atau ditarik cepat
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            handleClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            bounciness: 4,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

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
        <Animated.View
          style={[
            tw`bg-slate-900 h-[75%] rounded-t-3xl p-5 border-t border-slate-800`,
            { transform: [{ translateY }] },
          ]}
        >
          {/* Gesture Drag Bar & Header Container */}
          <View {...panResponder.panHandlers} style={tw`w-full items-center pt-1 pb-4`}>
            {/* Garis Handle Swipe */}
            <View style={tw`w-12 h-1.5 bg-slate-600 rounded-full mb-3`} />

            <View style={tw`flex-row justify-between items-center w-full`}>
              <Text style={tw`text-white text-sm font-black uppercase tracking-wide`}>
                Cari Acara / Agenda
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                style={tw`bg-slate-800 border border-slate-700 w-7 h-7 rounded-full items-center justify-center`}
              >
                <Text style={tw`text-slate-400 font-bold text-xs`}>✕</Text>
              </TouchableOpacity>
            </View>
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
                <Text style={tw`text-slate-500 text-xs italic`}>Tidak ada acara/agenda tersedia.</Text>
              </View>
            }
          />
        </Animated.View>
      </View>
    </Modal>
  );
}