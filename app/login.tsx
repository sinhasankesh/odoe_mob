import React, { useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { Button, Field } from '@/components/ui';
import { colors } from '@/theme';
import { schoolLoginDestination } from '@/api/schoolLoginDestination';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '133570863314-ma84sqlqdmnqbqt49dh946k8euvlfnvr.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [googleBusy, setGoogleBusy] = useState(false); const [error, setError] = useState('');
  const [googleRequest, googleResponse, promptGoogleLogin] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    selectAccount: true,
  }, { scheme: 'odoe' });
  const handledGoogleResponse = useRef<typeof googleResponse>(null);

  useEffect(() => {
    if (!googleResponse || handledGoogleResponse.current === googleResponse) return;
    handledGoogleResponse.current = googleResponse;
    if (googleResponse.type !== 'success') {
      setGoogleBusy(false);
      if (googleResponse.type === 'error') setError(googleResponse.error?.message || 'Google sign-in could not be completed.');
      return;
    }
    const idToken = googleResponse.params?.id_token || googleResponse.authentication?.idToken;
    if (!idToken) {
      setGoogleBusy(false);
      setError('Google did not return an ID token. Check the OAuth client configuration and redirect URI.');
      return;
    }
    loginWithGoogle(idToken)
      .then(async (session) => router.replace(await schoolLoginDestination(session.user.userRole || session.user.role, session.token) as any))
      .catch((e: any) => setError(e.message || 'Google sign-in failed.'))
      .finally(() => setGoogleBusy(false));
  }, [googleResponse, loginWithGoogle]);

  const googleLogin = async () => {
    if (Platform.OS === 'ios' && !GOOGLE_IOS_CLIENT_ID) { setError('Add EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID from Google Cloud Console to enable Google sign-in on iPhone.'); return; }
    if (Platform.OS === 'android' && !GOOGLE_ANDROID_CLIENT_ID) { setError('Add EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID from Google Cloud Console to enable Google sign-in on Android.'); return; }
    if (!googleRequest) { setError('Google sign-in is still loading. Try again in a moment.'); return; }
    setGoogleBusy(true); setError('');
    try {
      const result = await promptGoogleLogin();
      if (result.type !== 'success') setGoogleBusy(false);
    } catch (e: any) { setGoogleBusy(false); setError(e.message || 'Could not open Google sign-in.'); }
  };
  const submit = async () => { setBusy(true); setError(''); try { const session = await login(email.trim(), password); router.replace(await schoolLoginDestination(session.user.userRole || session.user.role, session.token) as any); } catch (e: any) { setError(e.message || 'We couldn’t sign you in.'); } finally { setBusy(false); } };
  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled"><Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={19} color={colors.ink} /></Pressable><View style={styles.brandCard}><Image source={require('../assets/odoe-logo.png')} resizeMode="contain" style={styles.brandImage}/></View><View style={styles.heading}><Text style={styles.kicker}>ONE DESTINATION OF EDUCATION</Text><Text style={styles.title}>Welcome back.</Text><Text style={styles.sub}>Sign in to continue learning, practicing, and tracking your progress.</Text></View><View style={styles.form}><Field label="Email address" placeholder="you@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" /><Field label="Password" placeholder="Your password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" onSubmitEditing={submit} /></View><Pressable onPress={() => setError('Password reset can be completed from your Odoe web account for now.')}><Text style={styles.forgot}>Forgot password?</Text></Pressable>{error ? <View style={styles.error}><Ionicons name="alert-circle" size={18} color={colors.red} /><Text style={styles.errorText}>{error}</Text></View> : null}<Button title="Sign in" onPress={submit} loading={busy} disabled={!email || !password} style={styles.submit} /><View style={styles.divider}><View style={styles.dividerLine}/><Text style={styles.or}>OR</Text><View style={styles.dividerLine}/></View><Pressable accessibilityRole="button" disabled={googleBusy || !googleRequest} onPress={googleLogin} style={[styles.google, (!googleRequest || googleBusy) && { opacity: 0.65 }]}><Ionicons name="logo-google" size={18} color="#4285F4" /><Text style={styles.googleText}>{googleBusy ? 'Signing in with Google…' : 'Continue with Google'}</Text></Pressable><View style={styles.note}><Ionicons name="lock-closed-outline" size={14} color={colors.muted} /><Text style={styles.noteText}>Your account is protected with secure sign-in.</Text></View><Text style={styles.foot}>New to Odoe? <Text style={{ color: colors.green, fontWeight: '800' }} onPress={() => router.push('/register' as any)}>Create an account</Text></Text></ScrollView></KeyboardAvoidingView>;
}
const styles = StyleSheet.create({screen:{flex:1,backgroundColor:'#F4F6FC'},page:{paddingHorizontal:24,paddingTop:22,paddingBottom:30,gap:17,flexGrow:1,maxWidth:520,width:'100%',alignSelf:'center'},back:{width:42,height:42,borderRadius:14,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#E1E6F0',alignItems:'center',justifyContent:'center'},brandCard:{backgroundColor:'#07112F',borderRadius:18,paddingHorizontal:15,paddingVertical:10,borderWidth:1,borderColor:'#293A78',alignItems:'center'},brandImage:{width:'100%',height:86},heading:{gap:8,marginTop:3},kicker:{color:'#405DE0',fontSize:9,fontWeight:'900',letterSpacing:1.5},title:{color:'#111A3A',fontSize:34,lineHeight:40,fontWeight:'900',letterSpacing:-1},sub:{color:'#69748D',fontSize:13,lineHeight:20},form:{gap:15,marginTop:5},forgot:{textAlign:'right',color:'#405DE0',fontWeight:'800',fontSize:12,paddingTop:0},error:{flexDirection:'row',gap:8,alignItems:'center',backgroundColor:'#FCEBE9',padding:12,borderRadius:13,marginTop:1},errorText:{flex:1,color:colors.red,fontSize:12},submit:{marginTop:2,backgroundColor:'#405DE0'},divider:{flexDirection:'row',alignItems:'center',gap:12,marginVertical:-3},dividerLine:{height:1,flex:1,backgroundColor:'#E1E6F0'},or:{color:'#8992A6',textAlign:'center',fontSize:10,fontWeight:'900'},google:{minHeight:50,borderRadius:14,borderWidth:1,borderColor:'#E0E5EF',backgroundColor:'#FFFFFF',flexDirection:'row',justifyContent:'center',alignItems:'center',gap:10},googleText:{color:'#17213D',fontWeight:'800',fontSize:13},note:{flexDirection:'row',gap:7,alignItems:'center',justifyContent:'center',marginTop:0},noteText:{color:'#768198',fontSize:10},foot:{textAlign:'center',color:'#69748D',fontSize:12,marginTop:'auto',paddingTop:20}});
