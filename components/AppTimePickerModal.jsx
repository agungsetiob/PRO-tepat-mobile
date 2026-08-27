import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import tw from "twrnc";

export default function AppTimePickerModal({
  visible,
  initialTime = "08.00",
  onConfirm,
  onClose,
}) {
  const parseTimeString = (timeStr) => {
    const d = new Date();
    if (!timeStr) return d;
    const parts = timeStr.replace(":", ".").split(".");
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const [tempDate, setTempDate] = useState(() => parseTimeString(initialTime));

  useEffect(() => {
    if (visible) {
      setTempDate(parseTimeString(initialTime));
    }
  }, [visible, initialTime]);

  const handleSave = () => {
    const hours = String(tempDate.getHours()).padStart(2, "0");
    const minutes = String(tempDate.getMinutes()).padStart(2, "0");
    onConfirm(`${hours}.${minutes}`);
    onClose();
  };

  if (!visible) return null;

  // Di Android, biarkan native dialog langsung muncul
  if (Platform.OS === "android") {
    return (
      <DateTimePicker
        value={tempDate}
        mode="time"
        is24Hour={true}
        display="default"
        onChange={(event, selectedTime) => {
          onClose();
          if (event.type === "set" && selectedTime) {
            const hours = String(selectedTime.getHours()).padStart(2, "0");
            const minutes = String(selectedTime.getMinutes()).padStart(2, "0");
            onConfirm(`${hours}.${minutes}`);
          }
        }}
      />
    );
  }

  // Di iOS, iPadOS, dan macOS (Designed for iPad / Mac Catalyst)
  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={tw`flex-1 bg-black/60 justify-center items-center px-4`}>
        <View style={tw`bg-slate-900 border border-slate-700 w-full max-w-xs rounded-2xl p-5 shadow-2xl items-center`}>
          <Text style={tw`text-white text-sm font-black uppercase tracking-wider mb-2`}>
            Pilih Waktu
          </Text>

          <View style={tw`bg-slate-800/80 rounded-xl p-2 my-2 w-full items-center justify-center`}>
            <DateTimePicker
              value={tempDate}
              mode="time"
              is24Hour={true}
              display="spinner"
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