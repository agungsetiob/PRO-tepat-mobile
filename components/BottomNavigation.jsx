import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import tw from "twrnc";
import * as LucideIcons from "lucide-react-native";

const DynamicIcon = ({ name, color = "#ffffff", size = 22 }) => {
  const pascalCaseName = name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
  const IconComponent = LucideIcons[pascalCaseName] || LucideIcons.Folder;
  return <IconComponent color={color} size={size} strokeWidth={2.5} />;
};

export default function BottomNavigation({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  const focusedRoute = state.routes[state.index];
  const focusedDescriptor = descriptors[focusedRoute.key];
  const focusedOptions = focusedDescriptor.options;

  if (focusedOptions.tabBarStyle?.display === 'none') {
    return null;
  }

  const mainTabs = ["index", "search", "honorifics", "about"];

  return (
    <View style={[
      tw`flex-row bg-[#081024] border-t border-slate-800 justify-between items-center px-6 pt-3`,
      { paddingBottom: Math.max(insets.bottom, 16) }
    ]}>
      {state.routes
        .filter((route) => mainTabs.includes(route.name))
        .map((route) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === state.routes.indexOf(route);

          let iconName = "folder";
          if (route.name === "index") iconName = "home";
          else if (route.name === "search") iconName = "search";
          else if (route.name === "honorifics") iconName = "users";
          else if (route.name === "about") iconName = "info";

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={tw`items-center flex-1`}
            >
              <View
                style={[
                  styles.iconWrapper,
                  {
                    backgroundColor: isFocused ? 'rgba(20, 184, 166, 0.2)' : 'transparent',
                  }
                ]}
              >
                <DynamicIcon name={iconName} color={isFocused ? "#3bd9e8" : "#64748b"} size={20} />
              </View>
              <Text style={[
                tw`text-[10px] ${isFocused ? "text-[#3bd9e8]" : "text-slate-500"}`,
                { fontFamily: 'Montserrat-Bold' }
              ]}>
                {options.tabBarLabel ?? options.title ?? route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    width: 56,
    height: 32,
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});