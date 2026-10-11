import React, { useEffect, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Field } from '@/components/ui';
import { colors } from '@/theme';
import { api, unwrap } from '@/api/client';
import { getExamTypesByClass, registerAccount, resendRegistrationEmailOtp, verifyRegistrationEmail, ExamType } from '@/api/auth';

const classes = [
  { id: 'class_ukg', label: 'UKG' },
  ...Array.from({ length: 12 }, (_, i) => ({ id: `class_${i + 1}`, label: `Class ${i + 1}` })),
  { id: 'graduation', label: 'Graduation' },
  { id: 'pg', label: 'Post Graduation' },
];
type AccountType = 'student' | 'teacher';
type TeacherProfile = { subjects: string; qualification: string; experienceYears: string; availability: string; bio: string };
const emptyTeacher: TeacherProfile = { subjects: '', qualification: '', experienceYears: '', availability: '', bio: '' };
const examId = (exam: ExamType) => String(exam.id ?? exam.exam_type_id ?? exam.examTypeId ?? '');
const examName = (exam: ExamType) => exam.name ?? exam.exam_name ?? exam.exam_type_name ?? 'Learning track';

export default function RegisterScreen() {
  const params = useLocalSearchParams<{ account?: string }>();
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<AccountType>(params.account === 'teacher' ? 'teacher' : 'student');
  const [fullName, setFullName] = useState(''), [email, setEmail] = useState(''), [mobile, setMobile] = useState('');
  const [password, setPassword] = useState(''), [confirm, setConfirm] = useState('');
  const [classId, setClassId] = useState('');
  const [teacher, setTeacher] = useState<TeacherProfile>(emptyTeacher);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [otp, setOtp] = useState(''), [pendingUserId, setPendingUserId] = useState<string | number | null>(null), [serverEmail, setServerEmail] = useState('');
  const [loadingExams, setLoadingExams] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');

  useEffect(() => { api<any>('/auth/exam-types', {}, null).then(body => {
    const result = unwrap<any>(body); const rows = Array.isArray(result) ? result : result.items || result.examTypes || [];
    setExamTypes(rows);
  }).catch(() => setExamTypes([])); }, []);

  const visibleExams = useMemo(() => {
    if (!classId) return examTypes;
    return examTypes.filter(item => {
      const id = String(item.class_id ?? item.classId ?? item.class ?? '');
      return !id || id === classId || id === classes.find(item => item.id === classId)?.label;
    });
  }, [classId, examTypes]);

  const updateClass = async (id: string) => {
    setClassId(id); setSelectedExams([]); setError(''); setLoadingExams(true);
    try {
      const rows = await getExamTypesByClass(id);
      setExamTypes(rows);
    } catch {
      // Keep the general exam list as a useful fallback if class filtering is unavailable.
    } finally { setLoadingExams(false); }
  };

  const validateAccount = () => {
    if (!fullName.trim()) return 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
    if (!/^\d{10}$/.test(mobile.replace(/\D/g, ''))) return 'Enter a valid 10-digit mobile number.';
    if (password.length < 8) return 'Choose a password with at least 8 characters.';
    if (password !== confirm) return 'The passwords do not match.';
    if (!classId) return accountType === 'teacher' ? 'Select a primary class you teach.' : 'Select your class or level.';
    return '';
  };
  const next = () => { const issue = validateAccount(); setError(issue); if (!issue) { setNotice(''); setStep(2); } };
  const toggleExam = (id: string) => setSelectedExams(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const submit = async () => {
    setError(''); setNotice('');
    if (!selectedExams.length) { setError(accountType === 'teacher' ? 'Choose at least one exam or learning track you teach.' : 'Choose at least one exam or learning track.'); return; }
    if (accountType === 'teacher') {
      if (!teacher.subjects.trim() || !teacher.qualification.trim() || teacher.experienceYears === '' || !teacher.availability.trim() || !teacher.bio.trim()) { setError('Complete every teaching profile field.'); return; }
      if (!/^\d+$/.test(teacher.experienceYears) || Number(teacher.experienceYears) > 50) { setError('Enter teaching experience from 0 to 50 years.'); return; }
    }
    setBusy(true);
    try {
      const account = await registerAccount({
        fullName: fullName.trim(), email: email.trim().toLowerCase(), mobile: mobile.replace(/\D/g, ''), password,
        classId, examTypes: selectedExams, registrationIntent: accountType,
        ...(accountType === 'teacher' ? { teacherProfile: {
          subjects: teacher.subjects.split(',').map(item => item.trim()).filter(Boolean), qualification: teacher.qualification.trim(),
          experienceYears: Number(teacher.experienceYears), availability: teacher.availability.trim(), bio: teacher.bio.trim(),
        } } : {}),
      });
      setPendingUserId(account.userId); setServerEmail(account.email || email.trim().toLowerCase()); setOtp(''); setStep(3);
      setNotice('A five-digit verification code has been sent to your email.');
    } catch (e: any) { setError(e.message || 'We couldn’t create your account.'); }
    finally { setBusy(false); }
  };

  const verifyOtp = async () => {
    setError(''); setNotice('');
    if (!pendingUserId || !/^\d{5}$/.test(otp)) { setError('Enter the five-digit code from your email.'); return; }
    setBusy(true);
    try {
      await verifyRegistrationEmail({ userId: pendingUserId, email: serverEmail, otp });
      setNotice(accountType === 'teacher' ? 'Email verified. Your teacher application is awaiting academic review.' : 'Email verified. Your account is ready.');
      setTimeout(() => router.replace('/login'), 900);
    } catch (e: any) { setError(e.message || 'We couldn’t verify that code.'); }
    finally { setBusy(false); }
  };

  const resendOtp = async () => {
    if (!pendingUserId) return;
    setBusy(true); setError(''); setNotice('');
    try { await resendRegistrationEmailOtp({ userId: pendingUserId, email: serverEmail }); setNotice('A new verification code has been sent.'); }
    catch (e: any) { setError(e.message || 'We couldn’t resend the verification code.'); }
    finally { setBusy(false); }
  };

  const setTeacherField = (key: keyof TeacherProfile, value: string) => setTeacher(current => ({ ...current, [key]: value }));
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.paper }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.back}><Ionicons name="arrow-back" size={20} color={colors.ink} /></Pressable>
      <View style={styles.brandCard}><Image source={require('../assets/odoe-logo.png')} resizeMode="contain" style={styles.brandImage}/></View>
      <View style={styles.stepper}><View style={styles.stepperTop}><Text style={styles.kicker}>GET STARTED</Text><Text style={styles.stepCount}>STEP {step} OF 3</Text></View><View style={styles.stepTrack}><View style={[styles.stepFill,{width:`${step/3*100}%`}]}/></View></View>
      <Text style={styles.title}>{step === 1 ? `Create your ${accountType} account` : step === 3 ? 'Verify your email' : accountType === 'teacher' ? 'Complete your teaching profile' : 'Choose your learning tracks'}</Text>
      <Text style={styles.sub}>{step === 1 ? 'Tell us a little about yourself to get started.' : step === 3 ? `Enter the five-digit code sent to ${serverEmail}.` : accountType === 'teacher' ? 'Share your teaching background for the academic review.' : 'Choose the exams you are preparing for.'}</Text>
      {step < 3 ? <View style={styles.role}>
        {(['student', 'teacher'] as AccountType[]).map(type => <Pressable accessibilityRole="button" accessibilityState={{ selected: accountType === type }} key={type} onPress={() => { setAccountType(type); setError(''); }} style={[styles.roleButton, accountType === type && styles.roleButtonActive]}><Text style={[styles.roleText, accountType === type && styles.roleTextActive]}>{type === 'student' ? 'Student / Parent' : 'Teacher / Trainer'}</Text></Pressable>)}
      </View> : null}
      {step === 1 ? <>
        <View style={{ gap: 14 }}>
          <Field label="Full name" placeholder="Your full name" value={fullName} onChangeText={setFullName} autoComplete="name" />
          <Field label="Email address" placeholder="you@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Field label="Mobile number" placeholder="10-digit mobile number" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" autoComplete="tel" />
          <Field label="Create password" placeholder="At least 8 characters" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
          <Field label="Confirm password" placeholder="Re-enter your password" value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" />
        </View>
        <Text style={styles.label}>{accountType === 'teacher' ? 'Primary class you teach' : 'Select class or level'}</Text>
        <View style={styles.classes}>{classes.map(item => <Pressable accessibilityRole="button" accessibilityState={{ selected: classId === item.id }} key={item.id} onPress={() => updateClass(item.id)} style={[styles.classChip, classId === item.id && styles.classSelected]}><Text style={[styles.classText, classId === item.id && styles.classTextSelected]}>{item.label}</Text></Pressable>)}</View>
        <Button title="Next" onPress={next} style={{ marginTop: 7 }} />
      </> : step === 2 ? <>
        {accountType === 'teacher' ? <View style={{ gap: 14 }}>
          <Field label="Subjects you teach" placeholder="Maths, Science, English" value={teacher.subjects} onChangeText={value => setTeacherField('subjects', value)} />
          <Field label="Highest qualification" placeholder="e.g. M.Sc., B.Ed." value={teacher.qualification} onChangeText={value => setTeacherField('qualification', value)} />
          <Field label="Teaching experience (years)" placeholder="0" value={teacher.experienceYears} onChangeText={value => setTeacherField('experienceYears', value)} keyboardType="number-pad" />
          <Field label="Weekly availability" placeholder="e.g. Weekdays, 5–8 PM" value={teacher.availability} onChangeText={value => setTeacherField('availability', value)} />
          <View style={styles.textAreaWrap}><Text style={styles.textAreaLabel}>Teaching profile</Text><TextInput value={teacher.bio} onChangeText={value => setTeacherField('bio', value)} placeholder="Briefly describe your experience and teaching approach." placeholderTextColor={colors.muted} multiline numberOfLines={4} style={styles.textArea} /></View>
          <View style={styles.reviewNote}><Ionicons name="information-circle-outline" size={18} color={colors.green} /><Text style={styles.reviewText}>Teacher access starts after academic review and admin approval.</Text></View>
        </View> : null}
        <Text style={styles.label}>{accountType === 'teacher' ? 'Exam and learning-track expertise' : 'Available exams and learning tracks'}</Text>
        {loadingExams ? <Text style={styles.hint}>Loading tracks…</Text> : null}
        {visibleExams.length ? <View style={styles.classes}>{visibleExams.map((item, index) => { const id = examId(item); if (!id) return null; const active = selectedExams.includes(id); return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} key={id || index} onPress={() => toggleExam(id)} style={[styles.classChip, active && styles.classSelected]}><Text style={[styles.classText, active && styles.classTextSelected]}>{examName(item)}</Text></Pressable>; })}</View> : <Text style={styles.hint}>No tracks are available. You can still finish registration.</Text>}
        <Button title={busy ? 'Creating account…' : 'Complete registration'} onPress={submit} loading={busy} style={{ marginTop: 8 }} />
      </> : <>
        <Field label="Five-digit verification code" placeholder="12345" value={otp} onChangeText={value => setOtp(value.replace(/\D/g, '').slice(0, 5))} keyboardType="number-pad" />
        <Button title={busy ? 'Verifying…' : 'Verify email'} onPress={verifyOtp} loading={busy} style={{ marginTop: 8 }} />
        <Pressable disabled={busy} onPress={resendOtp} style={styles.resend}><Text style={styles.resendText}>Didn’t get a code? Resend it</Text></Pressable>
      </>}
      {error ? <View style={styles.error}><Ionicons name="alert-circle" size={18} color={colors.red} /><Text accessibilityRole="alert" style={styles.errorText}>{error}</Text></View> : null}
      {notice ? <View style={styles.success}><Ionicons name="checkmark-circle" size={18} color={colors.green} /><Text style={styles.successText}>{notice}</Text></View> : null}
      <Text style={styles.foot}>Already registered? <Text onPress={() => router.replace('/login')} style={{ color: colors.green, fontWeight: '800' }}>Sign in</Text></Text>
    </ScrollView>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  page: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 34, gap: 16, maxWidth: 620, width: '100%', alignSelf: 'center' },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E1E6F0', alignItems: 'center', justifyContent: 'center' },
  brandCard:{backgroundColor:'#07112F',borderRadius:17,paddingHorizontal:14,paddingVertical:7,borderWidth:1,borderColor:'#293A78',alignItems:'center'},brandImage:{width:'100%',height:72},stepper:{gap:8},stepperTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},kicker: { color: '#405DE0', fontWeight: '900', fontSize: 10, letterSpacing: 1.5 },stepCount:{color:'#6F7A93',fontSize:9,fontWeight:'900',letterSpacing:.8},stepTrack:{height:5,backgroundColor:'#E2E7F2',borderRadius:5,overflow:'hidden'},stepFill:{height:'100%',backgroundColor:'#405DE0',borderRadius:5},
  title: { color: '#111A3A', fontSize: 29, lineHeight: 35, fontWeight: '900', letterSpacing: -.7 }, sub: { color: '#69748D', fontSize: 13, lineHeight: 20,marginTop:-8 },
  role: { flexDirection: 'row', borderWidth: 1, borderColor: '#E1E6F0', backgroundColor: '#FFFFFF', borderRadius: 15, padding: 5 },
  roleButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 6, borderRadius: 11, alignItems: 'center' }, roleButtonActive: { backgroundColor: '#405DE0' }, roleText: { color: '#69748D', fontWeight: '800', fontSize: 12 }, roleTextActive: { color: '#FFFFFF' },
  label: { color: colors.ink, fontWeight: '800', marginTop: 3 }, classes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  classChip: { borderWidth: 1, borderColor: '#E1E6F0', backgroundColor: '#FFFFFF', borderRadius: 24, paddingHorizontal: 14, paddingVertical: 10 }, classSelected: { backgroundColor: '#405DE0', borderColor: '#405DE0' }, classText: { color: '#69748D', fontWeight: '700', fontSize: 12 }, classTextSelected: { color: '#FFFFFF' },
  error: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: colors.redSoft, padding: 12, borderRadius: 13 }, errorText: { flex: 1, color: colors.red, fontSize: 13, lineHeight: 18 }, success: { flexDirection: 'row', gap: 8, backgroundColor: '#E7F7EF', padding: 12, borderRadius: 13 }, successText: { flex: 1, color: colors.green, fontSize: 13, lineHeight: 18 },
  textAreaWrap: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, borderRadius: 15, paddingHorizontal: 15, paddingTop: 11, paddingBottom: 8 }, textAreaLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' }, textArea: { color: colors.ink, minHeight: 92, textAlignVertical: 'top', paddingTop: 9, fontSize: 15 },
  reviewNote: { flexDirection: 'row', gap: 9, alignItems: 'center', backgroundColor: '#E8F5EF', padding: 12, borderRadius: 13 }, reviewText: { flex: 1, color: colors.green, fontSize: 12, lineHeight: 18, fontWeight: '700' }, hint: { color: colors.muted, fontSize: 13 },
  resend: { alignSelf: 'center', padding: 10 }, resendText: { color: '#405DE0', fontSize: 12, fontWeight: '800' },
  foot: { textAlign: 'center', color: '#69748D', paddingTop: 6,fontSize:12 },
});
