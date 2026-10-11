export type User = { id?: string | number; user_id?: string | number; full_name?: string; name?: string; email?: string; role?: number | string; userRole?: string; class_id?: string | number };
export type Session = { token: string; user: User };
export type Course = { id: string | number; name: string; category?: string; description?: string; image?: string; topics?: unknown[] };
export type CuetProgram = {
  id: string; exam_type_id: number | string; academic_year: string; degree_id: string; degree: string;
  university_id: string; university: string; program_id: string; global_program_id?: string;
  program: string; required_subjects?: string[] | null; eligibility?: string | null; source_url?: string | null; last_verified_at?: string | null;
};
