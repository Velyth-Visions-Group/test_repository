export type Role = 'owner' | 'lead' | 'executor' | 'cliente' | 'socio';

export type Division = 'VVG' | 'VNS' | 'VTS' | 'DSS';

export type TaskStatus = 'pendiente' | 'en curso' | 'hecha';

export type WeeklyKind = 'kickoff' | 'digest';

export type IntakeStatus = 'nuevo' | 'en revisión' | 'convertido' | 'descartado';

export interface Profile {
  id: string;
  full_name: string | null;
  roles: Role[] | null;
  division: Division | null;
  client_id: string | null;
  created_at?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  division: Division | null;
  status: string | null;
  created_at?: string;
}

export interface Project {
  id: string;
  client_id: string | null;
  name: string;
  division: Division | null;
  status: string | null;
  lead_id: string | null;
  target_date: string | null;
  created_at?: string;
  client?: Pick<Client, 'id' | 'name'> | null;
  lead?: Pick<Profile, 'id' | 'full_name'> | null;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  status: TaskStatus | null;
  assignee_id: string | null;
  due_date: string | null;
  division: Division | null;
  created_at?: string;
  assignee?: Pick<Profile, 'id' | 'full_name'> | null;
  project?: Pick<Project, 'id' | 'name' | 'division'> | null;
}

export interface Weekly {
  id: string;
  author_id: string;
  division: Division | null;
  kind: WeeklyKind | null;
  week_start: string | null;
  content: string | null;
  created_at?: string;
  author?: Pick<Profile, 'id' | 'full_name'> | null;
}

export interface IntakeRequest {
  id: string;
  name: string;
  email: string;
  service: string | null;
  message: string | null;
  status: IntakeStatus | null;
  created_at?: string;
}
