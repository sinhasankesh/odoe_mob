import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

const icons: Record<string, keyof typeof Ionicons.glyphMap> = { index: 'home', learn: 'book', explore: 'compass', profile: 'person' };
export default function TabsLayout() {
  const insets=useSafeAreaInsets();
  return <Tabs screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: '#245C73', tabBarInactiveTintColor: '#81909E', tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginBottom: 4 }, tabBarStyle: { height: 66 + Math.max(insets.bottom,8), paddingBottom: Math.max(insets.bottom,8), paddingTop: 10, borderTopColor: '#E3E8EF', backgroundColor: '#FFFFFF' }, tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? icons[route.name] : `${icons[route.name]}-outline` as keyof typeof Ionicons.glyphMap} size={size} color={color} /> })}><Tabs.Screen name="index" options={{ title: 'Home' }} /><Tabs.Screen name="learn" options={{ title: 'My learning' }} /><Tabs.Screen name="explore" options={{ title: 'Explore' }} /><Tabs.Screen name="profile" options={{ title: 'Profile' }} /></Tabs>;
}
