import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import tw from "twrnc";

export default function AppDatePickerModal({
  visible,
  initialDate,
  onConfirm,
  onClose,
}) {
  const [tempDate, setTempDate] = useState(() => initialDate || new Date());

  useEffect(() => {
    if (visible) {
      setTempDate(initialDate || new Date());
    }
  }, [visible, initialDate]);

  const handleSave = () => {
    onConfirm(tempDate);
    onClose();
  };

  if (!visible) return null;

  // Di Android, langsung trigger native dialog
  if (Platform.OS === "android") {
    return (
      <DateTimePicker
        value={tempDate}
        mode="date"
        display="default"
        onChange={(event, selectedDate) => {
          onClose();
          if (event.type === "set" && selectedDate) {
            onConfirm(selectedDate);
          }
        }}
      />
    );
  }

  // Di iOS, iPadOS, dan macOS (Pop-up Modal Dark Mode)
  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={tw`flex-1 bg-black/60 justify-center items-center px-4`}>
        <View style={tw`bg-slate-900 border border-slate-700 w-full max-w-xs rounded-2xl p-5 shadow-2xl items-center`}>
          <Text style={tw`text-white text-sm font-black uppercase tracking-wider mb-2`}>
            Pilih Tanggal Acara
          </Text>

          <View style={tw`rounded-xl p-2 my-2 w-full items-center justify-center`}>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="inline"
              textColor="#ffffff"
              themeVariant="dark"
              onChange={(_, date) => {
                if (date) setTempDate(date);
              }}
            />
          </View>

          <View style={tw`flex-row gap-2 w-full mt-3`}>
            <TouchableOpacity
              onPress={onClose}
              style={tw`flex-1 bg-slate-800 border border-slate-700 py-2.5 rounded-xl items-center`}
            >
              <Text style={tw`text-slate-400 font-bold text-xs`}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              style={tw`flex-1 bg-teal-500 py-2.5 rounded-xl items-center`}
            >
              <Text style={tw`text-slate-950 font-black text-xs uppercase`}>Pilih</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}