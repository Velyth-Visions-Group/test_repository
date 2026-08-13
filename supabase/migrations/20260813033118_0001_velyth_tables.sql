/*
# Portal Operativo Velyth — Tablas

Crea las seis tablas del portal en orden de dependencias.
Las politicas RLS se anaden en la migracion 0002.

## Tablas
1. clients — id, name, email, division, status, created_at
2. profiles — id (FK auth.users), full_name, roles text[], division, client_id (FK clients), created_at
3. projects — id, client_id (FK clients), name, division, status, lead_id (FK profiles), target_date, created_at
4. tasks — id, project_id (FK projects CASCADE), title, status, assignee_id (FK profiles), due_date, division, created_at
5. weeklies — id, author_id (FK profiles), division, kind, week_start, content, created_at
6. intake_requests — id, name, email, service, message, status, created_at

RLS se habilita en todas. Las politicas se aplican en 0002.
*/

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  division text,
  status text DEFAULT 'activo',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  roles text[] DEFAULT '{}',
  division text,
  client_id uuid REFERENCES clients(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  name text NOT NULL,
  division text,
  status text DEFAULT 'activo',
  lead_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  target_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text DEFAULT 'pendiente',
  assignee_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  due_date date,
  division text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- WEEKLIES
-- ============================================================
CREATE TABLE IF NOT EXISTS weeklies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  division text,
  kind text CHECK (kind IN ('kickoff','digest')),
  week_start date,
  content text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weeklies ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- INTAKE_REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS intake_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  service text,
  message text,
  status text DEFAULT 'nuevo',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE intake_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_lead_id ON projects(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_weeklies_division_kind ON weeklies(division, kind);
CREATE INDEX IF NOT EXISTS idx_intake_status ON intake_requests(status);
CREATE INDEX IF NOT EXISTS idx_profiles_division ON profiles(division);
