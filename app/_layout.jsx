import { Stack } from 'expo-router';

export default function RootLayout() {
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