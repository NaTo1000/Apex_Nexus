import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 60 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#C41E3A",
        tabBarInactiveTintColor: "#6B7280",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: "#080808",
          borderTopColor: "#2A2A35",
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol size={size} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol size={size} name="music.note.list" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: "Drop",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: focused ? "#C41E3A" : "#1A0A0E",
                borderWidth: 1.5,
                borderColor: focused ? "#C41E3A" : "#C41E3A66",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 4,
              }}
            >
              <IconSymbol size={22} name="arrow.up.circle.fill" color={focused ? "#F5F5F5" : "#C41E3A"} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="jamy"
        options={{
          title: "Jamy",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol size={size} name="headphones" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol size={size} name="person.crop.circle.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
