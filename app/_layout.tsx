import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/auth/AuthContext';
import { colors } from '@/theme';

export default function RootLayout() {
  return <AuthProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}><Stack.Screen name="(tabs)" /><Stack.Screen name="login" options={{ presentation: 'modal' }} /><Stack.Screen name="register" options={{ presentation: 'modal' }} /><Stack.Screen name="course/[id]" /><Stack.Screen name="tuition" /><Stack.Screen name="schools" /><Stack.Screen name="ai-learning" /><Stack.Screen name="test/[id]" /><Stack.Screen name="result/[id]" /></Stack></AuthProvider>;
}
