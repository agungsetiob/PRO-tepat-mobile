import React, { useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Modal,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ShieldCheck, X } from 'lucide-react-native';
import RenderHtml from 'react-native-render-html';
import api from '../../api/api';

export default function About() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  // State untuk Modal Privacy Policy
  const [modalVisible, setModalVisible] = useState(false);
  const [policyData, setPolicyData] = useState(null);
  const [isLoadingPolicy, setIsLoadingPolicy] = useState(false);

  // Fungsi Fetch Kebijakan Privasi dari Server Laravel
  const fetchPrivacyPolicy = async () => {
    setModalVisible(true);
    if (policyData) return; // Jika sudah pernah di-fetch, tidak perlu request ulang

    setIsLoadingPolicy(true);
    try {
      const response = await api.get('/privacy-policy');
      if (response.data.success) {
        setPolicyData(response.data.data);
      }
    } catch (error) {
      console.error('Gagal mengambil Privacy Policy:', error);
    } finally {
      setIsLoadingPolicy(false);
    }
  };

  // Styling khusus tag HTML dari WYSIWYG agar menyatu dengan theme Dark Mode
  const tagsStyles = {
    body: {
      color: '#cbd5e1',
      fontSize: 13,
      lineHeight: 20,
      fontFamily: 'Montserrat-Regular',
    },
    h1: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    h2: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginTop: 12, marginBottom: 6 },
    h3: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 4 },
    p: { marginBottom: 10 },
    li: { color: '#cbd5e1', marginBottom: 4 },
    a: { color: '#3bd9e8', textDecorationLine: 'underline' },
    strong: { color: '#ffffff', fontWeight: 'bold' },
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#0d1731]`} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#3bd9e8" translucent={false} />

      {/* HEADER GRADIENT */}
      <LinearGradient
        colors={['#3bd9e8', '#9359e9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={tw`p-5 pt-12 rounded-b-3xl shadow-lg`}
      >
        <View style={tw`flex-row items-center mb-4`}>
          <TouchableOpacity onPress={() => router.back()} style={tw`mr-3`}>
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
          <View>
            <Text style={tw`text-white/80 text-[10px] font-bold tracking-widest uppercase`}>
              Tentang
            </Text>
            <Text style={tw`text-white text-base font-black uppercase tracking-wide`}>
              Aplikasi PROTAP
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* KONTEN */}
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-5 pt-6 pb-12`}>
        <View style={tw`items-center mb-6`}>
          <Image
            source={require('../../assets/beraksi-logo.png')}
            style={{ width: '100%', height: 200, resizeMode: 'contain' }}
          />
        </View>

        {/* TENTANG APLIKASI */}
        <View style={tw`bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-md mb-4`}>
          <Text style={[tw`text-white text-base font-bold mb-2`, { fontFamily: 'Montserrat-Bold' }]}>
            Tentang PROTAP
          </Text>
          <Text style={[tw`text-slate-300 text-sm leading-relaxed`, { fontFamily: 'Montserrat-Regular' }]}>
            PROTAP (Panduan Resmi Operasional Tata Acara Protokol) adalah aplikasi panduan protokol
            untuk mendukung kegiatan pemerintahan dan acara resmi di lingkungan Kabupaten Tanah Bumbu.
          </Text>
          <Text style={[tw`text-slate-300 text-sm leading-relaxed mt-2`, { fontFamily: 'Montserrat-Regular' }]}>
            Aplikasi ini menyediakan informasi mengenai tata cara penghormatan, sapaan resmi dan lisan,
            denah tempat, rundown acara, serta berbagai skenario protokol yang dapat diakses dengan cepat
            dan mudah.
          </Text>
        </View>

        {/* TOMBOL BUKA PRIVACY POLICY */}
        <TouchableOpacity
          onPress={fetchPrivacyPolicy}
          activeOpacity={0.8}
          style={tw`bg-slate-800/80 p-4 rounded-2xl border border-slate-700 shadow-md mb-4 flex-row justify-between items-center`}
        >
          <View style={tw`flex-row items-center`}>
            <ShieldCheck size={20} color="#3bd9e8" style={tw`mr-3`} />
            <Text style={[tw`text-white text-sm font-bold`, { fontFamily: 'Montserrat-Bold' }]}>
              Kebijakan Privasi (Privacy Policy)
            </Text>
          </View>
          <Text style={tw`text-slate-400 text-xs font-bold`}>❯</Text>
        </TouchableOpacity>

        <View style={tw`bg-slate-800/80 p-4 rounded-2xl border border-slate-700 shadow-md mb-4 flex-row justify-between`}>
          <Text style={[tw`text-slate-400 text-sm`, { fontFamily: 'Montserrat-Regular' }]}>Versi</Text>
          <Text style={[tw`text-white text-sm font-bold`, { fontFamily: 'Montserrat-Bold' }]}>1.1.0</Text>
        </View>

        <View style={tw`items-center mt-4 mb-8`}>
          <Text style={[tw`text-slate-500 text-xs uppercase tracking-widest`, { fontFamily: 'Montserrat-Bold' }]}>
            Kabupaten Tanah Bumbu
          </Text>
          <Text style={[tw`text-slate-600 text-[10px] mt-1`, { fontFamily: 'Montserrat-Regular' }]}>
            © 2026 Pemerintah Kab. Tanah Bumbu
          </Text>
        </View>
      </ScrollView>

      {/* MODAL POP-UP PRIVACY POLICY */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={tw`flex-1 bg-black/80 justify-end`}>
          <View style={tw`bg-slate-900 h-[85%] rounded-t-3xl p-5 border-t border-slate-800`}>
            
            {/* Modal Header */}
            <View style={tw`flex-row justify-between items-center pb-4 border-b border-slate-800 mb-4`}>
              <View style={tw`flex-row items-center`}>
                <ShieldCheck size={20} color="#3bd9e8" style={tw`mr-2`} />
                <Text style={tw`text-white text-base font-black uppercase tracking-wide`}>
                  Kebijakan Privasi
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={tw`bg-slate-800 p-2 rounded-full`}
              >
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            {isLoadingPolicy ? (
              <View style={tw`flex-1 justify-center items-center`}>
                <ActivityIndicator size="large" color="#3bd9e8" />
                <Text style={tw`text-xs text-slate-400 mt-2`}>Memuat kebijakan privasi...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-10`}>
                {policyData?.updated_at && (
                  <Text style={tw`text-[10px] text-teal-400 mb-3 font-semibold`}>
                    Pembaruan Terakhir: {policyData.updated_at}
                  </Text>
                )}
                
                {policyData?.description ? (
                  <RenderHtml
                    contentWidth={width - 40}
                    source={{ html: policyData.description }}
                    tagsStyles={tagsStyles}
                  />
                ) : (
                  <Text style={tw`text-slate-500 text-xs italic text-center py-10`}>
                    Belum ada dokumen kebijakan privasi yang dikonfigurasi.
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}