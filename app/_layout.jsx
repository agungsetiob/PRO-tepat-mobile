import { Stack } from 'expo-router';
import { useFonts, Montserrat_400Regular, Montserrat_700Bold, Montserrat_900Black } from '@expo-google-fonts/montserrat';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Bold': Montserrat_700Bold,
    'Montserrat-Black': Montserrat_900Black,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0d1731' },
        cardStyle: { backgroundColor: '#0d1731' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="generator"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
          cardStyle: { backgroundColor: '#0d1731' },
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
