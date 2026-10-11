import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { api, unwrap } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';

type Course = Record<string, any>;
const tools = [
  ['Solve a doubt', 'ask'], ['Practice questions', 'practice'], ['Personalized quiz', 'quiz'],
  ['Study plan', 'plan'], ['Revision plan', 'revision'], ['Chapter summary', 'summary'],
] as const;

export default function AiLearningScreen() {
  const { session } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [tool, setTool] = useState<string>('ask');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    api<any>('/student/courses', { signal: controller.signal }).then((body) => {
      const data = unwrap<any>(body);
      const rows = Array.isArray(data) ? data : data?.items || data?.courses || [];
      setCourses(rows);
      setCourseId((current) => current || String(rows[0]?.course_id ?? rows[0]?.id ?? ''));
    }).catch((e) => { if (!controller.signal.aborted) setError(e.message || 'Could not load your courses.'); });
    return () => controller.abort();
  }, [session]);

  async function generate() {
    if (!session) { setError('Sign in to use AI learning.'); return; }
    if (!courseId) { setError('Enroll in a course to use AI learning.'); return; }
    if (!question.trim()) { setError('Enter a question or topic first.'); return; }
    setLoading(true); setError(''); setAnswer('');
    const payload: Record<string, any> = { course_id: Number(courseId), question: question.trim() };
    let endpoint = '/ai-learning/ask';
    if (tool === 'plan' || tool === 'revision') {
      endpoint = tool === 'plan' ? '/ai-learning/study-plans' : '/ai-learning/revision-plans';
      payload.goal = question.trim();
    } else if (tool === 'summary') {
      endpoint = '/ai-learning/chapter-summaries';
      payload.chapter_name = question.trim();
      payload.content = question.trim();
    } else if (tool === 'practice' || tool === 'quiz') {
      endpoint = tool === 'practice' ? '/ai-learning/practice-questions' : '/ai-learning/personalized-quizzes';
      payload.count = 5;
      payload.difficulty = 'adaptive';
      payload.category = question.trim();
    }
    try {
      const result = unwrap<any>(await api<any>(endpoint, { method: 'POST', body: JSON.stringify(payload) }));
      setAnswer(typeof result === 'string' ? result : result?.answer || result?.content || result?.text || JSON.stringify(result, null, 2));
    } catch (e: any) { setError(e.message || 'AI learning could not complete this request.'); }
    finally { setLoading(false); }
  }

  return <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => router.back()}><Text style={s.back}>← Dashboard</Text></Pressable>
    <Text style={s.eyebrow}>ODOE · AI LEARNING</Text>
    <Text style={s.title}>Your study companion</Text>
    <Text style={s.copy}>Choose a course, pick a tool, and get help without leaving the app.</Text>
    <Text style={s.label}>COURSE</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {courses.map((course) => { const id = String(course.course_id ?? course.id); return <Pressable key={id} onPress={() => setCourseId(id)} style={[s.pill, courseId === id && s.selected]}><Text style={[s.pillText, courseId === id && { color: '#FFFFFF' }]}>{course.course_name || course.name || 'Course'}</Text></Pressable>; })}
    </ScrollView>
    <Text style={s.label}>WHAT DO YOU NEED?</Text>
    <View style={s.tools}>{tools.map(([label, value]) => <Pressable key={value} onPress={() => setTool(value)} style={[s.tool, tool === value && s.selected]}><Text style={[s.pillText, tool === value && { color: '#FFFFFF' }]}>{label}</Text></Pressable>)}</View>
    <TextInput multiline value={question} onChangeText={setQuestion} placeholder={tool === 'ask' ? 'Type your question…' : 'Enter a topic, goal or chapter…'} placeholderTextColor="#8593A1" style={s.input} />
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
    <Pressable disabled={loading} onPress={generate} style={[s.submit, loading && { opacity: 0.65 }]}>{loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.submitText}>Generate with AI</Text>}</Pressable>
    {answer ? <View style={s.answer}><Text style={s.label}>YOUR AI RESPONSE</Text><Text selectable style={s.answerText}>{answer}</Text></View> : null}
    {!session ? <Text style={s.copy}>Sign in to use AI learning.</Text> : null}
  </ScrollView>;
}

const s = StyleSheet.create({ page: { flex: 1, backgroundColor: '#F4F6F8' }, content: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 20, paddingTop: 56, paddingBottom: 40, gap: 16 }, back: { color: '#245C73', fontWeight: '800', paddingVertical: 8 }, eyebrow: { color: '#245C73', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 }, title: { color: '#182534', fontSize: 27, fontWeight: '800' }, copy: { color: '#718096', fontSize: 13, lineHeight: 20 }, label: { color: '#667789', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 }, pill: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3E8EF' }, pillText: { color: '#526477', fontWeight: '700', fontSize: 11 }, selected: { backgroundColor: '#245C73', borderColor: '#245C73' }, tools: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, tool: { paddingHorizontal: 12, paddingVertical: 11, borderRadius: 11, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3E8EF' }, input: { minHeight: 120, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE3EA', borderRadius: 15, padding: 15, color: '#182534', textAlignVertical: 'top' }, error: { color: '#AC3C3C', fontSize: 12 }, submit: { minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#245C73', borderRadius: 13 }, submitText: { color: '#FFFFFF', fontWeight: '800' }, answer: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3E8EF', borderRadius: 16, padding: 16, gap: 10 }, answerText: { color: '#263747', fontSize: 14, lineHeight: 22 } });
