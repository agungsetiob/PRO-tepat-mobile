import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import axios from "axios";
import tw from "twrnc";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";

const { API_BASE_URL } = Constants.expoConfig.extra;

export default function RundownGenerator() {
  const router = useRouter();

  // State Form Utama
  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeInfo, setTimeInfo] = useState("08.00 WITA s.d. Selesai");
  const [location, setLocation] = useState("");
  const [pic, setPic] = useState("");

  // State Data Master & Baris Dinamis
  const [masterAgendas, setMasterAgendas] = useState([]);
  const [rundownRows, setRundownRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Pembantu Pengendali TimePicker & Modal Pencarian Agenda
  const [activeTimePicker, setActiveTimePicker] = useState(null);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [activeRowSearchIndex, setActiveRowSearchIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMasterAgendas();
  }, []);

  const fetchMasterAgendas = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/master-agendas`);
      if (response.data.success) {
        setMasterAgendas(response.data.data || []);
      }
    } catch (error) {
      console.error("Gagal memuat master agenda:", error);
      Alert.alert("Error", "Gagal mengambil bank data uraian kegiatan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRow = () => {
    setRundownRows((prev) => [
      ...prev,
      {
        master_agenda_id: masterAgendas[0]?.id || "",
        start_time: "08.00",
        end_time: "08.10",
      },
    ]);
  };

  const handleRemoveRow = (index) => {
    setRundownRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateRow = (index, field, value) => {
    setRundownRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const formatDateToString = (dateObj) => {
    if (!(dateObj instanceof Date)) return "";
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Memfilter daftar agenda berdasarkan input teks pencarian user
  const filteredAgendas = masterAgendas.filter((agenda) =>
    agenda.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openSearchModal = (rowIndex) => {
    setActiveRowSearchIndex(rowIndex);
    setSearchQuery("");
    setSearchModalVisible(true);
  };

  const selectAgendaFromSearch = (agendaId) => {
    if (activeRowSearchIndex !== null) {
      handleUpdateRow(activeRowSearchIndex, "master_agenda_id", agendaId);
    }
    setSearchModalVisible(false);
    setActiveRowSearchIndex(null);
  };

  const handleSubmit = async () => {
    if (!eventName || !location || rundownRows.length === 0) {
      Alert.alert("Peringatan", "Mohon lengkapi data acara dan isi minimal 1 baris susunan!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        event_name: eventName,
        date: formatDateToString(date),
        time_info: timeInfo,
        location: location,
        pic: pic,
        items: rundownRows,
      };

      const response = await axios.post(`${API_BASE_URL}/rundowns`, payload);

      if (response.data.success) {
        const savedRundown = response.data.data;

        const tableRowsHtml = savedRundown.items
          .map(
            (item, index) => `
          <tr>
            <td style="text-align: center; font-weight: bold; color: #475569;">${index + 1}</td>
            <td style="font-weight: bold; color: #0d9488; text-align: center;">${item.start_time} - ${item.end_time}</td>
            <td>${item.master_agenda ? item.master_agenda.name : "-"}</td>
          </tr>
        `
          )
          .join("");

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              @page { size: A4; margin: 20mm 15mm; }
              body { font-family: 'Arial', sans-serif; color: #1e293b; margin: 0; padding: 0; font-size: 10pt; line-height: 1.6; }
              .header { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 10px; margin-bottom: 20px; }
              .gov-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; color: #0f172a; margin: 0; }
              .gov-sub { font-size: 9.5pt; color: #475569; margin: 3px 0 0 0; font-weight: 500; }
              .doc-title { font-size: 12pt; font-weight: bold; text-transform: uppercase; color: #0f172a; text-align: center; margin: 20px 0; letter-spacing: 0.5px; }
              .meta-info { width: 100%; margin-bottom: 20px; font-size: 10pt; }
              .meta-info td { padding: 4px 0; vertical-align: top; }
              .meta-label { width: 15%; font-weight: bold; }
              .meta-value { width: 85%; }
              table.content-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              table.content-table th { background-color: #97aee4; color: white; font-weight: bold; text-transform: uppercase; font-size: 8.5pt; padding: 10px; border: 1px solid #0f172a; }
              table.content-table td { padding: 10px; border: 1px solid #cbd5e1; vertical-align: top; }
              table.content-table tr:nth-child(even) { background-color: #f8fafc; }
            </style>
          </head>
          <body>
            <div class="doc-title">RUNDOWN ACARA</div>
            <div class="doc-title">${savedRundown.event_name}</div>
            <div class="gov-title" style="text-align: center;">KABUPATEN TANAH BUMBU</div>
            <table class="meta-info">
              <tr><td class="meta-label">Hari, Tgl</td><td>:</td><td class="meta-value">${savedRundown.date}</td></tr>
              <tr><td class="meta-label">Waktu</td><td>:</td><td class="meta-value">${savedRundown.time_info}</td></tr>
              <tr><td class="meta-label">Tempat</td><td>:</td><td class="meta-value">${savedRundown.location}</td></tr>
              <tr><td class="meta-label">Pelaksana / PJ</td><td>:</td><td class="meta-value">${savedRundown.pic || '-'}</td></tr>
            </table>
            <table class="content-table">
              <thead>
                <tr>
                  <th style="width: 8%;">No.</th>
                  <th style="width: 22%;">Waktu</th>
                  <th style="width: 70%;">Uraian Kegiatan</th>
                </tr>
              </thead>
              <tbody>${tableRowsHtml}</tbody>
            </table>
          </body>
          </html>
        `;

        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri, {
          MIMEType: "application/pdf",
          dialogTitle: "Cetak Rundown Acara",
        });

        router.push("/");
      }
    } catch (error) {
      console.error("Gagal generate rundown & PDF:", error);
      Alert.alert("Gagal", "Terjadi kendala teknis saat memproses file cetakan.");
    } finally {
      setRundownRows([]);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 bg-[#0d1731] justify-center items-center`}>
        <ActivityIndicator size="large" color="#3bd9e8" />
        <Text style={tw`text-xs text-slate-400 mt-2`}>Menyiapkan Data Acara...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-[#0d1731]`} edges={["bottom", "left", "right"]}>
      {/* HEADER GRADIEN */}
      <LinearGradient
        colors={['#3bd9e8', '#9359e9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={tw`px-5 pt-10 pb-4 rounded-b-3xl`}
      >
        <View style={tw`flex-row items-center`}>
          <TouchableOpacity onPress={() => router.back()} style={tw`mr-3`}>
            <Text style={tw`text-white text-xl font-bold`}>❮</Text>
          </TouchableOpacity>
          <Text style={tw`text-white text-lg font-black uppercase tracking-wide`}>
            Rundown Generator
          </Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={tw`flex-1`}
      >
        <FlatList
          data={rundownRows}
          keyExtractor={(_, index) => "generator-row-" + index}
          contentContainerStyle={tw`px-5 pt-4 pb-28`}
          showsVerticalScrollIndicator={false}
          
          ListHeaderComponent={
            <View>
              <Text style={tw`text-slate-400 text-xs font-bold mb-1.5 uppercase`}>Nama Acara / Kegiatan</Text>
              <TextInput
                value={eventName}
                onChangeText={setEventName}
                placeholder="Contoh: Peresmian Gedung Dialisis RSUD"
                placeholderTextColor="#64748b"
                style={tw`bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-sm mb-3.5`}
              />

              <Text style={tw`text-slate-400 text-xs font-bold mb-1.5 uppercase`}>Tanggal Acara</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={tw`bg-slate-800 border border-slate-700 rounded-xl p-3 mb-3.5 justify-center`}
              >
                <Text style={tw`text-white text-sm`}>
                  📅 {date ? formatDateToString(date) : "Pilih Tanggal Acara"}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={date || new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setDate(selectedDate);
                  }}
                />
              )}

              <Text style={tw`text-slate-400 text-xs font-bold mb-1.5 uppercase`}>Waktu</Text>
              <TextInput
                value={timeInfo}
                onChangeText={setTimeInfo}
                placeholder="Contoh: 10.00 WITA s.d. Selesai"
                placeholderTextColor="#64748b"
                style={tw`bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-sm mb-3.5`}
              />

              <Text style={tw`text-slate-400 text-xs font-bold mb-1.5 uppercase`}>Tempat</Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Contoh: RSUD dr. H. Andi Abdurrahman Noor"
                placeholderTextColor="#64748b"
                style={tw`bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-sm mb-5`}
              />

              <Text style={tw`text-slate-400 text-xs font-bold mb-1.5 uppercase`}>Pelaksana</Text>
              <TextInput
                value={pic}
                onChangeText={setPic}
                placeholder="Contoh: Bagian Protokol Setda / RSUD"
                placeholderTextColor="#64748b"
                style={tw`bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-sm mb-5`}
              />

              <View style={tw`flex-row justify-between items-center border-t border-slate-800 pt-4 mb-2`}>
                <Text style={tw`text-slate-300 text-xs font-bold uppercase tracking-wider`}>
                  ⚡ Susunan Acara ({rundownRows.length})
                </Text>
                <TouchableOpacity
                  onPress={handleAddRow}
                  style={tw`bg-teal-400 px-3 py-1.5 rounded-lg`}
                >
                  <Text style={tw`text-white text-xs font-bold`}>➕</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          
          renderItem={({ item, index }) => {
            // Mencari nama agenda yang terpilih saat ini untuk ditampilkan di tombol UI
            const selectedAgenda = masterAgendas.find((a) => a.id === item.master_agenda_id);

            return (
              <View style={tw`bg-slate-800/60 border border-slate-700 p-3 rounded-2xl mb-3`}>
                <View style={tw`flex-row justify-between items-center mb-2`}>
                  <Text style={tw`text-teal-400 text-[11px] font-black`}>BARIS ACARA #{index + 1}</Text>
                  <TouchableOpacity onPress={() => handleRemoveRow(index)}>
                    <Text style={tw`text-red-400 text-xs font-bold`}>Hapus</Text>
                  </TouchableOpacity>
                </View>

                <View style={tw`flex-row gap-2 mb-2.5`}>
                  <TouchableOpacity
                    onPress={() => setActiveTimePicker({ index, field: "start_time" })}
                    style={tw`flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 items-center justify-center`}
                  >
                    <Text style={tw`text-white text-xs`}>⏱️ Mulai: {item.start_time}</Text>
                  </TouchableOpacity>

                  <Text style={tw`text-slate-500 self-center text-xs font-bold`}>s.d</Text>

                  <TouchableOpacity
                    onPress={() => setActiveTimePicker({ index, field: "end_time" })}
                    style={tw`flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 items-center justify-center`}
                  >
                    <Text style={tw`text-white text-xs`}>⏱️ Selesai: {item.end_time}</Text>
                  </TouchableOpacity>
                </View>

                {activeTimePicker && activeTimePicker.index === index && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(event, selectedTime) => {
                      const targetField = activeTimePicker.field;
                      setActiveTimePicker(null);
                      if (selectedTime) {
                        const hours = String(selectedTime.getHours()).padStart(2, "0");
                        const minutes = String(selectedTime.getMinutes()).padStart(2, "0");
                        handleUpdateRow(index, targetField, `${hours}.${minutes}`);
                      }
                    }}
                  />
                )}

                {/* REPLACEMENT PICKER: Menggunakan Tombol Trigger Modal Pencarian */}
                <TouchableOpacity
                  onPress={() => openSearchModal(index)}
                  style={tw`bg-slate-800 border border-slate-700 rounded-xl p-3 flex-row justify-between items-center`}
                >
                  <Text style={tw`text-xs ${selectedAgenda ? "text-white" : "text-slate-400"} flex-1`} numberOfLines={1}>
                    🔍 {selectedAgenda ? selectedAgenda.name : "Pilih Uraian Kegiatan..."}
                  </Text>
                  <Text style={tw`text-slate-400 text-xs ml-2`}>▼</Text>
                </TouchableOpacity>
              </View>
            );
          }}
          
          ListEmptyComponent={
            <Text style={tw`text-slate-500 text-xs italic text-center py-8`}>
              Belum ada susunan acara. Tekan tombol ➕ di atas untuk menambah susunan.
            </Text>
          }
        />
      </KeyboardAvoidingView>

      {/* Tombol Submit Mengambang */}
      <View style={tw`absolute bottom-4 left-5 right-5 bg-[#0d1731] pt-2`}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={tw`${isSubmitting ? "bg-slate-600" : "bg-purple-600"} p-3.5 rounded-xl items-center shadow-lg`}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={tw`text-white text-sm font-black uppercase tracking-wider`}>
              Buat Rundown
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* MODAL SEARCHABLE SELECTOR FOR MASTER AGENDAS */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <View style={tw`flex-1 bg-black/70 justify-end`}>
          <View style={tw`bg-slate-900 h-[70%] rounded-t-3xl p-5 border-t border-slate-800`}>
            {/* Header Modal */}
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-white text-sm font-black uppercase tracking-wide`}>Cari Uraian Kegiatan</Text>
              <TouchableOpacity onPress={() => setSearchModalVisible(false)} style={tw`bg-slate-800 p-2 rounded-full px-3`}>
                <Text style={tw`text-slate-400 text-xs font-bold`}>Tutup</Text>
              </TouchableOpacity>
            </View>

            {/* Input Kotak Pencarian */}
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Ketik kata kunci agenda..."
              placeholderTextColor="#64748b"
              autoFocus={true}
              style={tw`bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-sm mb-4`}
            />

            {/* List Agenda Master Terfilter */}
            <FlatList
              data={filteredAgendas}
              keyExtractor={(item) => "search-agenda-" + item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => selectAgendaFromSearch(item.id)}
                  style={tw`p-3.5 border-b border-slate-800 bg-slate-800/20 rounded-lg mb-1.5`}
                >
                  <Text style={tw`text-white text-xs`}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={tw`py-10 items-center`}>
                  <Text style={tw`text-slate-500 text-xs italic`}>Tidak ada kegiatan yang cocok.</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}