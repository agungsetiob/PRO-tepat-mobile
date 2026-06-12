import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import tw from "twrnc";
import Constants from "expo-constants";

const { API_BASE_URL, STORAGE_BASE_URL } = Constants.expoConfig.extra;

export default function ScenarioDetail() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const [scenario, setScenario] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDetailScenario();
  }, [slug]);

  const fetchDetailScenario = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/scenarios/${slug}`);
      if (response.data.success) {
        setScenario(response.data.data);
      }
    } catch (error) {
      console.error("Gagal memuat detail skenario:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanHtml = (htmlStr) => {
    if (!htmlStr) return "";
    return htmlStr
      .replace(/<\/p>/g, "\n")
      .replace(/<\/li>/g, "\n")
      .replace(/<[^>]*>/g, "")
      .trim();
  };

  if (isLoading) {
    return (
      <View
        style={[
          tw`flex-1 justify-center items-center`,
          { backgroundColor: "#ff4d29" },
        ]}
      >
        <ActivityIndicator size="large" color="#165e54" />
        <Text style={tw`text-xs text-slate-400 mt-2`}>
          Sinkronisasi data CMS...
        </Text>
      </View>
    );
  }

  if (!scenario) {
    return (
      <View style={tw`flex-1 bg-slate-50 justify-center items-center p-6`}>
        <Text style={tw`text-slate-500 font-bold`}>
          Pedoman tidak ditemukan.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={tw`mt-4 bg-slate-900 px-4 py-2 rounded-lg`}
        >
          <Text style={tw`text-white font-bold text-xs`}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Cek apakah ini tipe tata tempat atau tata acara/hormat
  const isTypeTempat = scenario.category?.type === "tempat";

  return (
    <ScrollView style={tw`flex-1 bg-slate-50`}>
      <StatusBar barStyle="light-content" />

      {/* BAR ATAS */}
      <View
        style={[
          tw`p-5 pt-12 flex-row items-center`,
          { backgroundColor: "#ff4d29" },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={tw`mr-4`}>
          <Text style={tw`text-white text-xl font-bold`}>❮</Text>
        </TouchableOpacity>
        <View style={tw`flex-1`}>
          <Text
            style={tw`text-teal-400 text-[10px] font-bold tracking-widest uppercase`}
          >
            {scenario.category?.name} • {scenario.jenis_acara}
          </Text>
          <Text style={tw`text-white text-base font-black`}>
            {scenario.title}
          </Text>
        </View>
      </View>

      {/* HEADER GAMBAR SKENARIO (THUMBNAIL) */}
      {scenario.thumbnail && (
        <Image
          source={{ uri: `${STORAGE_BASE_URL}${scenario.thumbnail}` }}
          style={tw`w-full h-44 bg-slate-200`}
          resizeMode="cover"
        />
      )}

      {/* DESKRIPSI & TAGS */}
      <View style={tw`bg-white p-5 border-b border-slate-100 shadow-sm`}>
        <Text
          style={tw`text-xs font-bold text-slate-400 uppercase tracking-wider mb-1`}
        >
          Deskripsi Aturan
        </Text>
        <Text style={tw`text-xs text-slate-600 leading-relaxed mb-4`}>
          {scenario.description || "Tidak ada deskripsi tambahan."}
        </Text>

        <View style={tw`flex-row flex-wrap gap-1.5`}>
          {scenario.tags?.map((tag) => (
            <View key={tag.id} style={tw`bg-slate-100 px-2.5 py-1 rounded-md`}>
              <Text style={tw`text-[10px] text-slate-500 font-bold`}>
                #{tag.name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* RENDER KONTEN UTAMA BERDASARKAN TIPE KATEGORI */}
      <View style={tw`p-5`}>
        {isTypeTempat ? (
          /* ===================================================================
             LAYOUT UTAMA: TATA TEMPAT (Membaca Protocols & Seating Rules)
             =================================================================== */
          scenario.protocols && scenario.protocols.length > 0 ? (
            scenario.protocols.map((protocol, index) => (
              <View key={protocol.id} style={tw`mb-6`}>
                <Text style={tw`text-sm font-black text-slate-800 mb-2`}>
                  {index + 1}. {protocol.title}
                </Text>

                {protocol.content && (
                  <View
                    style={tw`bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-3`}
                  >
                    <Text
                      style={tw`text-xs text-slate-700 leading-relaxed font-medium`}
                    >
                      {cleanHtml(protocol.content)}
                    </Text>
                  </View>
                )}

                {protocol.image_infographic && (
                  <View
                    style={tw`bg-white p-2 rounded-xl border border-slate-100 shadow-sm mb-4`}
                  >
                    <Image
                      source={{
                        uri: `${STORAGE_BASE_URL}${protocol.image_infographic}`,
                      }}
                      style={tw`w-full h-56 bg-slate-50 rounded-lg`}
                      resizeMode="contain"
                    />
                    <Text
                      style={tw`text-[10px] text-slate-400 italic text-center mt-1.5`}
                    >
                      📷 Lampiran Gambar Infografis Denah
                    </Text>
                  </View>
                )}

                {protocol.seating_rules &&
                  protocol.seating_rules.length > 0 && (
                    <View>
                      <Text
                        style={tw`text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1`}
                      >
                        Urutan Penempatan Jabatan (
                        {protocol.seating_rules.length})
                      </Text>

                      {protocol.seating_rules.map((rule, index) => (
                        <View
                          key={rule.id}
                          style={tw`bg-white rounded-xl shadow-sm mb-3 overflow-hidden`}
                        >
                          {/* ACCENT BORDER */}
                          <View style={tw`h-1 bg-teal-600`} />

                          <View style={tw`p-4`}>
                            {/* HEADER SECTION - Responsive row */}
                            <View style={tw`flex-row items-start gap-3 mb-3`}>
                              {/* POSITION BADGE - Flexible width, better text handling */}
                              <View
                                style={tw`bg-teal-600 rounded-full px-3 py-1.5 min-w-[60px] max-w-[100px]`}
                              >
                                <Text
                                  style={tw`text-white font-bold text-[11px] text-center`}
                                  numberOfLines={2}
                                  adjustsFontSizeToFit
                                >
                                  {rule.position_label}
                                </Text>
                              </View>

                              {/* TITLE & NOTE CONTAINER */}
                              <View style={tw`flex-1 gap-1`}>
                                <Text
                                  style={tw`text-sm font-bold text-slate-800 leading-5`}
                                  numberOfLines={3}
                                >
                                  {rule.honorific?.jabatan || "Nama Jabatan"}
                                </Text>

                                {/* NOTE BADGE - Redesigned for long text */}
                                {rule.note && (
                                  <View
                                    style={tw`bg-amber-50 border border-amber-200 px-2 py-1 rounded-md self-start max-w-full`}
                                  >
                                    <Text
                                      style={tw`text-[10px] text-amber-700 font-semibold`}
                                      numberOfLines={3}
                                    >
                                      📌 {rule.note}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>

                            {/* DETAIL SECTION - Improved spacing and icons */}
                            <View style={tw`bg-slate-50 rounded-lg p-3 mt-1`}>
                              <View style={tw`gap-2`}>
                                <View style={tw`flex-row items-start gap-2`}>
                                  <Text
                                    style={tw`text-[11px] text-slate-500 min-w-[85px]`}
                                  >
                                    📢 Sapaan Resmi:
                                  </Text>
                                  <Text
                                    style={tw`flex-1 text-[11px] font-semibold text-slate-700`}
                                    numberOfLines={2}
                                  >
                                    {rule.honorific?.sapaan_resmi || "-"}
                                  </Text>
                                </View>

                                <View style={tw`flex-row items-start gap-2`}>
                                  <Text
                                    style={tw`text-[11px] text-slate-500 min-w-[85px]`}
                                  >
                                    🗣️ Sapaan Lisan:
                                  </Text>
                                  <Text
                                    style={tw`flex-1 text-[11px] font-semibold text-slate-700`}
                                    numberOfLines={2}
                                  >
                                    {rule.honorific?.sapaan_lisan || "-"}
                                  </Text>
                                </View>

                                {/* SPECIAL TREATMENT - Improved visibility */}
                                {rule.honorific?.perlakuan_khusus && (
                                  <View
                                    style={tw`bg-red-50 border-l-4 border-red-500 p-2.5 rounded-r-md mt-1`}
                                  >
                                    <Text
                                      style={tw`text-[11px] text-red-700 leading-5`}
                                    >
                                      <Text style={tw`font-bold`}>
                                        Perlakuan Khusus:
                                      </Text>{" "}
                                      {rule.honorific.perlakuan_khusus}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
              </View>
            ))
          ) : (
            <Text style={tw`text-xs text-slate-400 italic text-center py-6`}>
              Belum ada protokol operasional yang diinput.
            </Text>
          )
        ) : (
          /* ===================================================================
             LAYOUT UTAMA: TATA ACARA / HORMAT (Membaca Checklists & Equipments)
             =================================================================== */
          <View>
            {/* Bagian Checklist / Susunan Acara */}
            <Text
              style={tw`text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1`}
            >
              ⏱️ Susunan Acara & Checklist Kegiatan
            </Text>

            {scenario.checklists && scenario.checklists.length > 0 ? (
              scenario.checklists.map((check, cIdx) => (
                <View
                  key={check.id}
                  style={tw`bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-2.5 flex-row items-center`}
                >
                  <View style={tw`bg-amber-100 px-2 py-1 rounded-lg mr-3`}>
                    <Text
                      style={tw`text-amber-800 text-[10px] font-extrabold uppercase`}
                    >
                      {cIdx + 1}
                    </Text>
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-xs font-bold text-slate-800`}>
                      {check.item}
                    </Text>
                    <Text
                      style={tw`text-[10px] text-slate-400 font-medium mt-0.5`}
                    >
                      {check.section}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text
                style={tw`text-xs text-slate-400 italic text-center py-4 bg-white rounded-xl mb-4`}
              >
                Belum ada item checklist acara.
              </Text>
            )}

            {/* Bagian Atribut & Kebutuhan Alat */}
            <Text
              style={tw`text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-3 ml-1`}
            >
              📦 Perlengkapan & Kebutuhan Logistik
            </Text>

            {scenario.equipments && scenario.equipments.length > 0 ? (
              <View
                style={tw`bg-white rounded-xl border border-slate-100 shadow-sm p-4`}
              >
                {scenario.equipments.map((eq, eIdx) => (
                  <View
                    key={eq.id}
                    style={tw`flex-row items-center justify-between py-2 ${eIdx !== scenario.equipments.length - 1 ? "border-b border-slate-50" : ""}`}
                  >
                    <Text style={tw`text-xs font-semibold text-slate-700`}>
                      • {eq.name}
                    </Text>
                    <Text
                      style={tw`text-[10px] bg-slate-100 text-slate-500 font-bold px-2.5 py-0.5 rounded-full uppercase`}
                    >
                      {eq.category}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text
                style={tw`text-xs text-slate-400 italic text-center py-4 bg-white rounded-xl`}
              >
                Belum ada daftar logistik perlengkapan.
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={tw`mb-12`} />
    </ScrollView>
  );
}
