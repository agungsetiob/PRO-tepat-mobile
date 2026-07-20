import { Tabs } from 'expo-router';
import BottomNavigation from '../../components/BottomNavigation';

export default function TabLayout() {
  return (
    <Tabs 
      tabBar={(props) => <BottomNavigation {...props} />}
      
      screenOptions={{ 
        headerShown: false,
        sceneStyle: { backgroundColor: '#0d1731' }
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="honorifics" options={{ title: "Forkopimda" }} />
      <Tabs.Screen name="about" options={{ title: "About" }} />
      <Tabs.Screen name="manuals" options={{ href: null }} />
      <Tabs.Screen name="rundown-list" options={{ href: null }} />      
      <Tabs.Screen name="category/[slug]/scenarios" options={{ href: null }} />
      <Tabs.Screen name="manual/[id]" options={{ href: null }} />
      <Tabs.Screen name="rundown-detail/[id]" options={{ href: null }} />
      <Tabs.Screen name="scenarios/[slug]" options={{ href: null }} />
    </Tabs>
  );
}