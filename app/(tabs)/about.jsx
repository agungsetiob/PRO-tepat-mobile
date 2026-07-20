import React, { useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';

export default function About() {
  const router = useRouter();

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
        {/* GAMBAR */}
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

        {/* VERSI */}
        <View style={tw`bg-slate-800/80 p-4 rounded-2xl border border-slate-700 shadow-md mb-4 flex-row justify-between`}>
          <Text style={[tw`text-slate-400 text-sm`, { fontFamily: 'Montserrat-Regular' }]}>Versi</Text>
          <Text style={[tw`text-white text-sm font-bold`, { fontFamily: 'Montserrat-Bold' }]}>1.1.0</Text>
        </View>

        {/* FOOTER KABUPATEN */}
        <View style={tw`items-center mt-4 mb-8`}>
          <Text style={[tw`text-slate-500 text-xs uppercase tracking-widest`, { fontFamily: 'Montserrat-Bold' }]}>
            Kabupaten Tanah Bumbu
          </Text>
          <Text style={[tw`text-slate-600 text-[10px] mt-1`, { fontFamily: 'Montserrat-Regular' }]}>
            © 2026 Pemerintah Kab. Tanah Bumbu
          </Text>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}