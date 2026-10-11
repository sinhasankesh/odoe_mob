import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/auth/AuthContext';
import { schoolLoginDestination } from '@/api/schoolLoginDestination';

export default function AuthCallback() {
  const params = useLocalSearchParams<{ token?: string; error?: string }>();
  const { loginWithGoogleToken } = useAuth();
  const [message, setMessage] = useState('Completing Google sign-in…');
  useEffect(() => {
    if (params.error) { setMessage('Google sign-in was cancelled or could not be completed. Return to Odoe and try again.'); return; }
    if (!params.token) { setMessage('No sign-in token was returned. Return to Odoe and try again.'); return; }
    let active = true;
    loginWithGoogleToken(params.token).then(async (session) => {
      const destination = await schoolLoginDestination(session.user.userRole || session.user.role, session.token);
      if (active) router.replace(destination as any);
    }).catch((error: any) => { if (active) setMessage(error.message || 'Could not complete Google sign-in.'); });
    return () => { active = false; };
  }, [params.token, params.error]);
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16, backgroundColor: '#071525' }}><ActivityIndicator color="#35B9EF" /><Text style={{ color: '#E7F0FC', textAlign: 'center', lineHeight: 22 }}>{message}</Text></View>;
}
