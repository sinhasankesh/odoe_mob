import { api, query, unwrap } from './client';
import { CuetProgram } from '@/types';

type Page<T> = { items: T[]; total: number; page: number; limit: number };
export async function resolveCuetExamId(configuredId?: string) {
  if (configuredId) return configuredId;
  const body = await api<any>('/auth/exam-types', {}, null);
  const rows = unwrap<any>(body);
  const items = Array.isArray(rows) ? rows : rows.items || rows.examTypes || [];
  const matches = items.filter((item: any) => /\bcuet\b/i.test(item.name || item.exam_type_name || item.exam_name || ''));
  return matches.length === 1 ? String(matches[0].id ?? matches[0].exam_type_id) : '';
}
async function allPages<T>(path: string, params: Record<string, string | number | undefined | null>, signal?: AbortSignal) {
  let page = 1; const items: T[] = [];
  while (true) {
    const result = unwrap<Page<T>>(await api<any>(`${path}?${query({ ...params, page, limit: 100 })}`, { signal }));
    items.push(...(result.items || []));
    if (items.length >= result.total || !result.items?.length) return items;
    page += 1;
  }
}
export async function getCuetYears(examId: string, signal?: AbortSignal) {
  const response = unwrap<{ items: { academic_year: string }[] }>(await api<any>(`/student/cuet/academic-years?${query({ exam_type_id: examId })}`, { signal }));
  return response.items || [];
}
export async function getCuetDegrees(examId: string, year: string, signal?: AbortSignal) {
  const rows = await allPages<any>('/student/cuet/degrees', { exam_type_id: examId, academic_year: year }, signal);
  return rows.map((item) => ({ degree_id: String(item.degree_id), degree_name: item.degree_name || item.degree || item.name || '' }));
}
export async function getCuetPrograms(examId: string, year: string, signal?: AbortSignal) {
  const rows = await allPages<any>('/student/cuet/programs', { exam_type_id: examId, academic_year: year }, signal);
  return rows.map((item) => ({ ...item, id: String(item.id), exam_type_id: String(item.exam_type_id), degree_id: String(item.degree_id), university_id: String(item.university_id), program_id: String(item.program_id), global_program_id: item.global_program_id == null ? undefined : String(item.global_program_id), required_subjects: item.required_subjects == null ? null : Array.isArray(item.required_subjects) ? item.required_subjects : [String(item.required_subjects)] })) as CuetProgram[];
}
export async function getCuetUniversities(examId: string, year: string, degreeId: string, globalProgramId?: string, signal?: AbortSignal) {
  const rows = await allPages<any>('/student/cuet/universities', { exam_type_id: examId, academic_year: year, degree_id: degreeId, global_program_id: globalProgramId }, signal);
  return rows.map((item) => ({ university_id: String(item.university_id), university_name: item.university_name || item.university || item.name || '' }));
}
