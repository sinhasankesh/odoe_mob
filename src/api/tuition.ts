import { api, query, unwrap } from './client';

export type TuitionRole = 'student' | 'teacher' | 'admin';
export const tuitionPath = (role: TuitionRole) => `/tuition/${role}`;

export async function tuitionRequest<T = any>(role: TuitionRole, endpoint: string, options: RequestInit = {}, params?: Record<string, string | number | undefined | null>): Promise<T> {
  const suffix = params ? query(params) : '';
  return unwrap<T>(await api(`${tuitionPath(role)}${endpoint}${suffix ? `?${suffix}` : ''}`, options));
}

export const jsonBody = (value: Record<string, any>) => ({ method: 'POST', body: JSON.stringify(value) });
export const patchBody = (value: Record<string, any>) => ({ method: 'PATCH', body: JSON.stringify(value) });
