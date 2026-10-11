import { api, unwrap } from './client';

type Destination = { pathname: '/(tabs)' | '/schools' | '/workspace'; params?: { path: string; title: string } };

function rowsFrom(body: any): any[] {
  const data = unwrap<any>(body);
  return Array.isArray(data) ? data : data?.items || data?.schools || [];
}

/** Resolve the post-login destination using role and active school teaching context. */
export async function schoolLoginDestination(role: unknown, token: string): Promise<Destination> {
  const normalized = String(role ?? '').trim().toLowerCase();
  if (['admin', '2'].includes(normalized)) {
    return { pathname: '/workspace', params: { path: '/admin', title: 'Admin' } };
  }

  const teacher = ['teacher', 'trainer', '3'].includes(normalized);
  const fallback: Destination = teacher
    ? { pathname: '/workspace', params: { path: '/teacher/tuition', title: 'Teacher workspace' } }
    : { pathname: '/(tabs)' };

  try {
    const schools = rowsFrom(await api<any>('/schools/mine', {}, token));
    const active = schools.filter((school) => ['active', 'setup'].includes(String(school.status).toLowerCase()));
    const matches = await Promise.all(active.map(async (school) => {
      try {
        const context = unwrap<any>(await api<any>(`/schools/${encodeURIComponent(String(school.school_id))}/my/context`, {}, token));
        return context?.teachers?.length ? school : null;
      } catch {
        return null;
      }
    }));
    const teaching = matches.filter(Boolean);
    if (teaching.length === 1) {
      const school = teaching[0];
      return { pathname: '/workspace', params: { path: `/schools/${encodeURIComponent(String(school.school_id))}`, title: school.profile?.name || school.name || 'School workspace' } };
    }
    if (teaching.length > 1) return { pathname: '/schools' };
  } catch {
    // School discovery is optional; preserve the normal role destination.
  }
  return fallback;
}
