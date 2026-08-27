import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import tw from "twrnc";

export default function CustomAlertModal({ visible, title, message, onClose }) {
  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={tw`flex-1 bg-black/60 justify-center items-center px-6`}>
        <View style={tw`bg-slate-900 border border-slate-800 w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl`}>
          <View style={tw`p-5 items-center`}>
            <Text style={tw`text-white text-base font-black uppercase tracking-wide text-center mb-2`}>
              {title}
            </Text>
            <Text style={tw`text-slate-300 text-xs text-center leading-relaxed font-medium`}>
              {message}
            </Text>
          </View>
          <View style={tw`h-[1px] bg-slate-800 w-full`} />
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            style={tw`w-full py-3.5 items-center justify-center bg-slate-800/40`}
          >
            <Text style={tw`text-teal-400 font-bold text-sm tracking-wider`}>Mengerti</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}