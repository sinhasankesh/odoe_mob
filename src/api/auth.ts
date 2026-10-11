import { api, saveToken, unwrap } from './client';
import { Session } from '@/types';

export async function signIn(email: string, password: string) {
  const body = await api<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, null);
  const data = unwrap<any>(body);
  if (!data.token) throw new Error('The server did not return a sign-in token.');
  await saveToken(data.token);
  return { token: data.token, user: data.user } as Session;
}

export async function registerStudent(input: { full_name: string; email: string; mobile: string; password: string; class_id: string }) {
  const body = unwrap<any>(await api<any>('/auth/register', { method: 'POST', body: JSON.stringify({ ...input, role: 'student' }) }, null));
  // Some APIs create and return a session; others require a normal sign-in after registration.
  if (body.token) {
    await saveToken(body.token);
    return { token: body.token, user: body.user || body.profile || {} } as Session;
  }
  return signIn(input.email, input.password);
}

export type ExamType = { id?: string | number; exam_type_id?: string | number; examTypeId?: string | number; name?: string; exam_name?: string; exam_type_name?: string; class_id?: string | number; classId?: string | number; class?: string };
export type RegisterAccountInput = {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  classId: string;
  examTypes: string[];
  registrationIntent: 'student' | 'teacher';
  teacherProfile?: { subjects: string[]; qualification: string; experienceYears: number; availability: string; bio: string };
};

export async function registerAccount(input: RegisterAccountInput) {
  return unwrap<{ userId: string | number; email: string; registrationIntent?: 'student' | 'teacher'; teacherApplicationStatus?: string }>(await api<any>('/auth/register-with-otp', {
    method: 'POST',
    body: JSON.stringify(input),
  }, null));
}

export async function verifyRegistrationEmail(input: { userId: string | number; email: string; otp: string }) {
  return unwrap<any>(await api<any>('/auth/verify-email-otp', {
    method: 'POST',
    body: JSON.stringify(input),
  }, null));
}

export async function resendRegistrationEmailOtp(input: { userId: string | number; email: string }) {
  return unwrap<any>(await api<any>('/auth/resend-email-otp', {
    method: 'POST',
    body: JSON.stringify(input),
  }, null));
}

export async function getExamTypesByClass(classId: string) {
  const body = unwrap<any>(await api<any>(`/auth/exam-types-by-class?classId=${encodeURIComponent(classId)}`, {}, null));
  return Array.isArray(body) ? body as ExamType[] : (body.data || body.items || body.examTypes || []) as ExamType[];
}

export async function signInWithGoogle(idToken: string) {
  const body = unwrap<any>(await api<any>('/auth/google-login', { method: 'POST', body: JSON.stringify({ token: idToken }) }, null));
  if (!body.token) throw new Error('The server did not return a sign-in token.');
  await saveToken(body.token);
  return { token: body.token, user: body.user || body.profile || {} } as Session;
}

export async function restoreGoogleSession(token: string) {
  await saveToken(token);
  try {
    const body = unwrap<any>(await api<any>('/auth/profile', {}, token));
    return { token, user: body.user || body } as Session;
  } catch {
    // The web Google flow returns the backend JWT as a deep link. Its claims include
    // the identity and role, so the mobile app can establish the session without
    // depending on an additional profile request.
    try {
      const segment = token.split('.')[1];
      if (!segment || typeof atob !== 'function') throw new Error('Invalid token');
      const payload = JSON.parse(decodeURIComponent(Array.from(atob(segment.replace(/-/g, '+').replace(/_/g, '/'))).map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')));
      return { token, user: { id: payload.userId, user_id: payload.userId, full_name: payload.fullName, name: payload.fullName, email: payload.email, role: payload.role, userRole: payload.userRole } } as Session;
    } catch {
      throw new Error('Google sign-in returned an invalid session. Please try again.');
    }
  }
}
