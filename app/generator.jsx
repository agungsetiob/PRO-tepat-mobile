import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";

import api from "../api/api";
import AgendaSearchModal from "../components/AgendaSearchModal";
import HonorificSearchModal from "../components/HonorificSearchModal";
import CustomAlertModal from "../components/CustomAlertModal";
import AppTimePickerModal from "../components/AppTimePickerModal";
import AppDatePickerModal from "../components/AppDatePickerModal";

export default function RundownGenerator() {
  const router = useRouter();

  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeInfo, setTimeInfo] = useState("08.00 WITA s.d. Selesai");
  const [location, setLocation] = useState("");
  const [pic, setPic] = useState("");

  const [masterAgendas, setMasterAgendas] = useState([]);
  const [rundownRows, setRundownRows] = useState([]);

  const [masterHonorifics, setMasterHonorifics] = useState([]);
  const [selectedInvitations, setSelectedInvitations] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeTimePicker, setActiveTimePicker] = useState(null);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [activeRowSearchIndex, setActiveRowSearchIndex] = useState(null);

  const [honorificModalVisible, setHonorificModalVisible] = useState(false);
  const [activeHonorificSearchIndex, setActiveHonorificSearchIndex] = useState(null);

  const [alertState, setAlertState] = useState({ visible: false, title: "", message: "" });

  useEffect(() => {
    fetchInitialMasterData();
  }, []);

  const triggerAlert = (title, message) => {
    setAlertState({ visible: true, title, message });
  };

  const closeAlert = () => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  };

  const fetchInitialMasterData = async () => {
    try {
      const [agendaResponse, honorificResponse] = await Promise.all([
        api.get("/master-agendas"),
        api.get("/honorifics"),
      ]);

      if (agendaResponse.data.success) {
        setMasterAgendas(agendaResponse.data.data || []);
      }
      if (honorificResponse.data.success) {
        setMasterHonorifics(honorificResponse.data.data || []);
      }
    } catch (error) {
      console.error("Gagal memuat data master generator:", error);
      triggerAlert("Error", "Gagal mengambil data master protokol dari server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRow = () => {
    const available = masterAgendas.filter((a) => !selectedAgendaIds.includes(a.id));
    
    if (available.length === 0) {
      triggerAlert("Info", "Semua agenda/acara master sudah dipilih.");
      return;
    }

    setRundownRows((prev) => [
      ...prev,
      { master_agenda_id: available[0].id, start_time: "08.00", end_time: "08.10" },
    ]);
  };

  const handleRemoveRow = (index) => {
    setRundownRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateRow = (index, field, value) => {
    setRundownRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const handleAddInvitationRow = () => {
    const available = masterHonorifics.filter((h) => !selectedHonorificIds.includes(h.id));
    
    if (available.length === 0) {
      triggerAlert("Info", "Semua pejabat/undangan master sudah ditambahkan.");
      return;
    }

    setSelectedInvitations((prev) => [
      ...prev,
      { honorific_id: available[0].id },
    ]);
  };

  const handleRemoveInvitationRow = (index) => {
    setSelectedInvitations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateInvitationRow = (index, value) => {
    setSelectedInvitations((prev) => prev.map((item, i) => (i === index ? { honorific_id: value } : item)));
  };

  const formatDateToString = (dateObj) => {
    if (!(dateObj instanceof Date)) return "";
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const openSearchModal = (rowIndex) => {
    setActiveRowSearchIndex(rowIndex);
    setSearchModalVisible(true);
  };

  const selectAgendaFromSearch = (agendaId) => {
    if (activeRowSearchIndex !== null) {
      handleUpdateRow(activeRowSearchIndex, "master_agenda_id", agendaId);
    }
    setSearchModalVisible(false);
    setActiveRowSearchIndex(null);
  };

  const openHonorificSearchModal = (rowIndex) => {
    setActiveHonorificSearchIndex(rowIndex);
    setHonorificModalVisible(true);
  };

  const selectHonorificFromSearch = (honorificId) => {
    if (activeHonorificSearchIndex !== null) {
      handleUpdateInvitationRow(activeHonorificSearchIndex, honorificId);
    }
    setHonorificModalVisible(false);
    setActiveHonorificSearchIndex(null);
  };

  const handleSubmit = async () => {
    if (!eventName || !location || rundownRows.length < 4 || selectedInvitations.length === 0) {
      triggerAlert("Peringatan", "Mohon lengkapi data acara, isi minimal 4 baris susunan, dan 1 orang undangan");
      return;
    }
    executeSubmit();
  };

  // Kumpulan ID yang sudah dipilih
  const selectedAgendaIds = rundownRows
    .map((row) => row.master_agenda_id)
    .filter(Boolean);

  const selectedHonorificIds = selectedInvitations
    .map((inv) => inv.honorific_id)
    .filter(Boolean);

  // Filter master data hanya menyisakan yang belum dipilih
  // (tetap sertakan ID dari baris aktif agar baris yang sedang diedit tetap valid)
  const getAvailableAgendas = (currentRowIndex) => {
    const currentId = rundownRows[currentRowIndex]?.master_agenda_id;
    return masterAgendas.filter(
      (a) => !selectedAgendaIds.includes(a.id) || a.id === currentId
    );
  };

  const getAvailableHonorifics = (currentRowIndex) => {
    const currentId = selectedInvitations[currentRowIndex]?.honorific_id;
    return masterHonorifics.filter(
      (h) => !selectedHonorificIds.includes(h.id) || h.id === currentId
    );
  };

  const executeSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // 1. Simpan rundown ke server
      const payload = {
        event_name: eventName,
        date: formatDateToString(date),
        time_info: timeInfo,
        location: location,
        pic: pic,
        items: rundownRows,
        invitations: selectedInvitations,
      };

      const response = await api.post("/rundowns", payload);

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Gagal menyimpan rundown.");
      }

      const savedRundown = response.data.data;

      // 2. Generate baris HTML tabel Rundown
      const tableRowsHtml = savedRundown.items
        .map(
          (item, index) => `
          <tr>
            <td style="text-align: center; font-weight: bold; color: #475569;">
              ${index + 1}
            </td>
            <td style="font-weight: bold; color: #0d9488; text-align: center;">
              ${item.start_time} - ${item.end_time}
            </td>
            <td>
              ${item.master_agenda ? item.master_agenda.name : "-"}
            </td>
          </tr>
        `
        )
        .join("");

      // 3. Generate baris HTML tabel Undangan Pejabat
      // Mendukung fallback ke masterHonorifics jika backend belum me-load relasi honorific
      const invitationsData = savedRundown.invitations || selectedInvitations;
      const invitationRowsHtml = invitationsData
        .map((inv, index) => {
          const honorificDetail =
            inv.honorific ||
            masterHonorifics.find((h) => h.id === (inv.honorific_id || inv.id));

          const jabatan = honorificDetail?.jabatan || "-";
          const sapaanResmi = honorificDetail?.sapaan_resmi || "-";
          const sapaanLisan = honorificDetail?.sapaan_lisan || "-";

          return `
          <tr>
            <td style="text-align: center; font-weight: bold; color: #475569;">
              ${index + 1}
            </td>
            <td style="font-weight: bold; color: #1e293b;">
              ${jabatan}
            </td>
            <td style="color: #334155;">
              ${sapaanResmi}
            </td>
            <td style="color: #334155;">
              ${sapaanLisan}
            </td>
          </tr>
        `;
        })
        .join("");

      // 4. Struktur HTML Lengkap dengan Tabel Undangan
      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: A4; margin: 20mm 15mm; }
          body { font-family: 'Arial', sans-serif; color: #1e293b; margin: 0; padding: 0; font-size: 10pt; line-height: 1.5; }
          .brand-container { text-align: center; margin-bottom: 5px; }
          .gov-logo { width: 70px; height: auto; display: inline-block; }
          .header-text-group { text-align: center; margin-bottom: 25px; }
          .doc-title { font-size: 13pt; font-weight: 800; text-transform: uppercase; color: #0f172a; margin: 4px 0; letter-spacing: 0.5px; }
          .gov-title { font-size: 11pt; font-weight: bold; text-transform: uppercase; color: #475569; margin: 2px 0; }
          .section-title { font-size: 10.5pt; font-weight: bold; text-transform: uppercase; color: #1e293b; margin-top: 25px; margin-bottom: 8px; letter-spacing: 0.5px; }
          .meta-info { width: 100%; margin-bottom: 20px; font-size: 10pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 15px; }
          .meta-info td { padding: 4px 0; vertical-align: top; }
          .meta-label { width: 18%; font-weight: bold; color: #334155; }
          .meta-spacer { width: 2%; color: #334155; }
          .meta-value { width: 80%; color: #0f172a; }
          table.content-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
          table.content-table th { background-color: #7497e9; color: white; font-weight: bold; text-transform: uppercase; font-size: 8.5pt; padding: 10px; border: 1px solid #475569; }
          table.content-table th.invitation-th { background-color: #4f46e5; }
          table.content-table td { padding: 8px 10px; border: 1px solid #475569; vertical-align: middle; font-size: 9pt; }
          table.content-table tr:nth-child(even) { background-color: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="brand-container">
          <img class="gov-logo" src="https://protap.tanahbumbukab.go.id/logo-tanbu.png" alt="Logo Kabupaten" />
        </div>
        <div class="header-text-group">
          <div class="doc-title">RUNDOWN ACARA</div>
          <div class="doc-title">${savedRundown.event_name}</div>
          <div class="gov-title">KABUPATEN TANAH BUMBU</div>
        </div>
        <table class="meta-info">
          <tr><td class="meta-label">Hari, Tgl</td><td class="meta-spacer">:</td><td class="meta-value">${savedRundown.date}</td></tr>
          <tr><td class="meta-label">Waktu</td><td class="meta-spacer">:</td><td class="meta-value">${savedRundown.time_info}</td></tr>
          <tr><td class="meta-label">Tempat</td><td class="meta-spacer">:</td><td class="meta-value">${savedRundown.location}</td></tr>
          <tr><td class="meta-label">Pelaksana / PJ</td><td class="meta-spacer">:</td><td class="meta-value">${savedRundown.pic || "-"}</td></tr>
        </table>

        <!-- TABEL RUNDOWN -->
        <div class="section-title">I. SUSUNAN ACARA</div>
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

        <!-- TABEL DAFTAR UNDANGAN -->
        <div class="section-title">II. DAFTAR SAPAAN UNDANGAN PEJABAT</div>
        <table class="content-table">
          <thead>
            <tr>
              <th class="invitation-th" style="width: 8%;">No.</th>
              <th class="invitation-th" style="width: 32%;">Jabatan</th>
              <th class="invitation-th" style="width: 30%;">Sapaan Resmi</th>
              <th class="invitation-th" style="width: 30%;">Sapaan Lisan</th>
            </tr>
          </thead>
          <tbody>${invitationRowsHtml}</tbody>
        </table>
      </body>
      </html>
    `;

      // 5. Generate PDF
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      if (!uri) {
        throw new Error("PDF berhasil diproses tetapi file tidak ditemukan.");
      }

      // 6. Reset state form
      setRundownRows([]);
      setSelectedInvitations([]);
      setIsSubmitting(false);

      // 7. Trigger Share / Download secara background
      const triggerShare = async () => {
        try {
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(uri, {
              mimeType: "application/pdf",
              dialogTitle: "Cetak Rundown Acara",
              UTI: "com.adobe.pdf",
            });
          }
        } catch (shareErr) {
          console.warn("Share/Download diabaikan atau ditutup:", shareErr);
        }
      };

      triggerShare();
      router.replace("/");
    } catch (error) {
      setIsSubmitting(false);
      console.error("Gagal generate rundown & PDF:", error);

      let title = "Gagal";
      let errorMessage = "Terjadi kendala teknis saat memproses data.";

      if (error.response?.data) {
        if (error.response.data.errors) {
          title = "Validasi Gagal";
          const errorsObj = error.response.data.errors;
          errorMessage = Object.keys(errorsObj)
            .map((key) => `• ${errorsObj[key][0]}`)
            .join("\n");
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      triggerAlert(title, errorMessage);
    }
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 bg-[#0d1731] justify-center items-center`}>
        <ActivityIndicator size="large" color="#3bd9e8" />
        <Text style={tw`text-xs text-slate-400 mt-2`}>Menyiapkan Data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-[#0d1731]`} edges={["bottom", "left", "right"]}>
      <LinearGradient
        colors={["#3bd9e8", "#9359e9"]}
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
          keyExtractor={(_, index) => `generator-row-${index}`}
          contentContainerStyle={tw`px-5 pt-4 pb-36`}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              <Text style={tw`text-slate-400 text-xs font-bold mb-1.5 uppercase`}>Nama Acara</Text>
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
                placeholder="Contoh: Kantor Bupati"
                placeholderTextColor="#64748b"
                style={tw`bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-sm mb-3.5`}
              />

              <Text style={tw`text-slate-400 text-xs font-bold mb-1.5 uppercase`}>Pelaksana</Text>
              <TextInput
                value={pic}
                onChangeText={setPic}
                placeholder="Contoh: Bagian Protokol"
                placeholderTextColor="#64748b"
                style={tw`bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-sm mb-5`}
              />

              <View style={tw`flex-row justify-between items-center border-t border-slate-800 pt-4 mb-3.5`}>
                <Text style={tw`text-slate-300 text-xs font-bold uppercase tracking-wider`}>
                  👥 Daftar Undangan Pejabat ({selectedInvitations.length})
                </Text>
                <TouchableOpacity
                  onPress={handleAddInvitationRow}
                  style={tw`bg-indigo-600 px-3 py-1.5 rounded-lg`}
                >
                  <Text style={tw`text-white text-xs font-bold`}>➕</Text>
                </TouchableOpacity>
              </View>

              {selectedInvitations.map((invItem, invIndex) => {
                const selectedPejabat = masterHonorifics.find((h) => h.id === invItem.honorific_id);
                return (
                  <View key={`invitation-row-${invIndex}`} style={tw`bg-slate-800/40 border border-slate-700/80 p-3 rounded-2xl mb-2.5 flex-row items-center gap-2`}>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-slate-400 text-[9px] font-black tracking-widest uppercase mb-1`}>URUTAN SAPAAN #{invIndex + 1}</Text>
                      <TouchableOpacity
                        onPress={() => openHonorificSearchModal(invIndex)}
                        style={tw`bg-slate-800 border border-slate-700 rounded-xl p-2.5 flex-row justify-between items-center`}
                      >
                        <Text style={tw`text-xs ${selectedPejabat ? "text-white font-bold" : "text-slate-400"} flex-1`} numberOfLines={1}>
                          {selectedPejabat ? `${selectedPejabat.jabatan} (${selectedPejabat.sapaan_resmi || "-"})` : "Pilih Undangan Pejabat..."}
                        </Text>
                        <Text style={tw`text-slate-400 text-[10px] ml-2`}>▼</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveInvitationRow(invIndex)}
                      style={tw`bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl self-end`}
                    >
                      <Text style={tw`text-red-400 text-xs font-bold`}>Hapus</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              {selectedInvitations.length === 0 && (
                <Text style={tw`text-slate-500 text-xs italic text-center py-4 mb-3 border border-dashed border-slate-800 rounded-xl`}>
                  Belum ada daftar pejabat ditambahkan. Tekan "+" di atas.
                </Text>
              )}

              <View style={tw`flex-row justify-between items-center border-t border-slate-800 pt-4 mb-3`}>
                <Text style={tw`text-slate-300 text-xs font-bold uppercase tracking-wider`}>
                  ⚡ Susunan Acara / Rundown ({rundownRows.length})
                </Text>
                <TouchableOpacity
                  onPress={handleAddRow}
                  style={tw`bg-teal-500 px-3 py-1.5 rounded-lg`}
                >
                  <Text style={tw`text-white text-xs font-bold`}>➕</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          renderItem={({ item, index }) => {
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

                <TouchableOpacity
                  onPress={() => openSearchModal(index)}
                  style={tw`bg-slate-800 border border-slate-700 rounded-xl p-3 flex-row justify-between items-center`}
                >
                  <Text style={tw`text-xs ${selectedAgenda ? "text-white" : "text-slate-400"} flex-1`} numberOfLines={1}>
                    {selectedAgenda ? selectedAgenda.name : "Pilih Uraian Kegiatan..."}
                  </Text>
                  <Text style={tw`text-slate-400 text-xs ml-2`}>▼</Text>
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={tw`text-slate-500 text-xs italic text-center py-8`}>
              Belum ada susunan acara. Tekan tombol "+" di atas untuk menambah susunan.
            </Text>
          }
        />
      </KeyboardAvoidingView>

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

      {/* Modal Components */}
      <AgendaSearchModal
        visible={searchModalVisible}
        onClose={() => {
          setSearchModalVisible(false);
          setActiveRowSearchIndex(null);
        }}
        onSelect={selectAgendaFromSearch}
        agendas={getAvailableAgendas(activeRowSearchIndex)}
      />

      <HonorificSearchModal
        visible={honorificModalVisible}
        onClose={() => {
          setHonorificModalVisible(false);
          setActiveHonorificSearchIndex(null);
        }}
        onSelect={selectHonorificFromSearch}
        honorifics={getAvailableHonorifics(activeHonorificSearchIndex)}
      />

      <CustomAlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        onClose={closeAlert}
      />

      <AppTimePickerModal
        visible={activeTimePicker !== null}
        initialTime={
          activeTimePicker
            ? rundownRows[activeTimePicker.index]?.[activeTimePicker.field]
            : "08.00"
        }
        onClose={() => setActiveTimePicker(null)}
        onConfirm={(formattedTime) => {
          if (activeTimePicker) {
            handleUpdateRow(activeTimePicker.index, activeTimePicker.field, formattedTime);
          }
        }}
      />

      <AppDatePickerModal
        visible={showDatePicker}
        initialDate={date}
        onClose={() => setShowDatePicker(false)}
        onConfirm={(selectedDate) => setDate(selectedDate)}
      />
    </SafeAreaView>
  );
}