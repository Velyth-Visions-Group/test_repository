/*
# Portal Operativo Velyth — Politicas RLS y funciones administrativas

## Seguridad

- `intake_requests`: INSERT publico (anon + authenticated); SELECT/UPDATE solo owner y lead.
- `profiles`: SELECT para authenticated; UPDATE restringido a full_name. Roles/division/client_id solo via funciones SECURITY DEFINER.
- `clients`, `projects`: SELECT para authenticated; INSERT/UPDATE/DELETE para owner y lead.
- `tasks`: SELECT para authenticated; INSERT/UPDATE para owner, lead, executor; DELETE para owner y lead.
- `weeklies`: SELECT para authenticated; INSERT/UPDATE/DELETE para el autor.

## Funciones SECURITY DEFINER

- `assign_profile_roles(p_profile_id, p_roles, p_division)`: solo owner asigna roles y division.
- `link_profile_client(p_profile_id, p_client_id)`: solo owner vincula client_id a un perfil.

## Notas

1. Las columnas sensibles de profiles (roles, division, client_id) se protegen revocando UPDATE y exponiendo solo full_name.
2. Los cambios administrativos van por funciones SECURITY DEFINER que verifican que el caller es owner.
*/

-- ============================================================
-- CLIENTS — politicas
-- ============================================================
DROP POLICY IF EXISTS "clients_select_authenticated" ON clients;
CREATE POLICY "clients_select_authenticated"
  ON clients FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "clients_insert_owner_lead" ON clients;
CREATE POLICY "clients_insert_owner_lead"
  ON clients FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles && ARRAY['owner','lead']::text[]
    )
  );

DROP POLICY IF EXISTS "clients_update_owner_lead" ON clients;
CREATE POLICY "clients_update_owner_lead"
  ON clients FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles && ARRAY['owner','lead']::text[]
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles && ARRAY['owner','lead']::text[]
    )
  );

DROP POLICY IF EXISTS "clients_delete_owner_lead" ON clients;
CREATE POLICY "clients_delete_owner_lead"
  ON clients FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles && ARRAY['owner','lead']::text[]
    )
  );

-- ============================================================
-- PROFILES — politicas
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
CREATE POLICY "profiles_select_authenticated"
  ON profiles FOR SELECT TO authenticated
  USING (true);

-- Los usuarios solo pueden actualizar su propio full_name.
-- Las columnas sensibles (roles, division, client_id) se protegen
-- revocando UPDATE sobre toda la tabla y concediendo solo full_name.
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (full_name) ON profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- PROJECTS — politicas
-- ============================================================
DROP POLICY IF EXISTS "projects_select_authenticated" ON projects;
CREATE POLICY "projects_select_authenticated"
  ON projects FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "projects_insert_owner_lead" ON projects;
CREATE POLICY "projects_insert_owner_lead"
  ON projects FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles && ARRAY['owner','lead']::text[]
    )
  );

DROP POLICY IF EXISTS "projects_update_owner_lead" ON projects;
CREATE POLICY "projects_update_owner_lead"
  ON projects FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles && ARRAY['owner','lead']::text[]
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles && ARRAY['owner','lead']::text[]
    )
  );

DROP POLICY IF EXISTS "projects_delete_owner_lead" ON projects;
CREATE POLICY "projects_delete_owner_lead"
  ON projects FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles && ARRAY['owner','lead']::text[]
    )
  );

-- ============================================================
-- TASKS — politicas
-- ============================================================
DROP POLICY IF EXISTS "tasks_select_authenticated" ON tasks;
CREATE POLICY "tasks_select_authenticated"
  ON tasks FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "tasks_insert_owner_lead_executor" ON tasks;
CREATE POLICY "tasks_insert_owner_lead_executor"
  ON tasks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles && ARRAY['owner','lead','executor']::text[]
    )
  );

DROP POLICY IF EXISTS "tasks_update_owner_lead_executor" ON tasks;
CREATE POLICY "tasks_update_owner_lead_executor"
  ON tasks FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles && ARRAY['owner','lead','executor']::text[]
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles && ARRAY['owner','lead','executor']::text[]
    )
  );

DROP POLICY IF EXISTS "tasks_delete_owner_lead" ON tasks;
CREATE POLICY "tasks_delete_owner_lead"
  ON tasks FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles && ARRAY['owner','lead']::text[]
    )
  );

-- ============================================================
-- WEEKLIES — politicas
-- ============================================================
DROP POLICY IF EXISTS "weeklies_select_authenticated" ON weeklies;
CREATE POLICY "weeklies_select_authenticated"
  ON weeklies FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "weeklies_insert_authenticated" ON weeklies;
CREATE POLICY "weeklies_insert_authenticated"
  ON weeklies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "weeklies_update_own" ON weeklies;
CREATE POLICY "weeklies_update_own"
  ON weeklies FOR UPDATE TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "weeklies_delete_own" ON weeklies;
CREATE POLICY "weeklies_delete_own"
  ON weeklies FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

-- ============================================================
-- INTAKE_REQUESTS — politicas
-- ============================================================
-- INSERT publico: cualquiera puede solicitar servicio sin login
DROP POLICY IF EXISTS "intake_insert_public" ON intake_requests;
CREATE POLICY "intake_insert_public"
  ON intake_requests FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- SELECT solo para owner y lead
DROP POLICY IF EXISTS "intake_select_owner_lead" ON intake_requests;
CREATE POLICY "intake_select_owner_lead"
  ON intake_requests FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles && ARRAY['owner','lead']::text[]
    )
  );

-- UPDATE solo para owner y lead
DROP POLICY IF EXISTS "intake_update_owner_lead" ON intake_requests;
CREATE POLICY "intake_update_owner_lead"
  ON intake_requests FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles && ARRAY['owner','lead']::text[]
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles && ARRAY['owner','lead']::text[]
    )
  );

-- ============================================================
-- FUNCIONES SECURITY DEFINER
-- ============================================================

-- Asignar roles y división a un perfil (solo owner)
CREATE OR REPLACE FUNCTION assign_profile_roles(p_profile_id uuid, p_roles text[], p_division text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND roles && ARRAY['owner']::text[]
  ) THEN
    RAISE EXCEPTION 'Sin autorizacion';
  END IF;

  UPDATE profiles
  SET roles = p_roles, division = p_division
  WHERE id = p_profile_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION assign_profile_roles FROM anon;
GRANT EXECUTE ON FUNCTION assign_profile_roles TO authenticated;

-- Vincular client_id a un perfil (solo owner)
CREATE OR REPLACE FUNCTION link_profile_client(p_profile_id uuid, p_client_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND roles && ARRAY['owner']::text[]
  ) THEN
    RAISE EXCEPTION 'Sin autorizacion';
  END IF;

  UPDATE profiles
  SET client_id = p_client_id
  WHERE id = p_profile_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION link_profile_client FROM anon;
GRANT EXECUTE ON FUNCTION link_profile_client TO authenticated;
