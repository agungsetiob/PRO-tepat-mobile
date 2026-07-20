import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Mengubah warna background dasar stack menjadi warna gelap aplikasi
        contentStyle: { backgroundColor: '#0d1731' }, 
        
        // Animasi transisi antar halaman (gunakan 'fade' atau 'slide_from_right')
        animation: 'slide_from_right', 
      }}
    >
      {/* Mengarahkan root route ke sistem Tabs */}
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}