-- 0003 · Funciones administrativas y alta automática de perfil
-- Ejecutar en TEST_DATABASE (SQL Editor). Desbloquea la vista Administración.

-- Asignar roles y división a un perfil (solo owner)
create or replace function assign_profile_roles(p_profile_id uuid, p_roles app_role[], p_division division)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not (my_roles() && array['owner']::app_role[]) then
    raise exception 'Sin autorización';
  end if;

  update profiles
  set roles = p_roles, division = p_division
  where id = p_profile_id;
end;
$$;

revoke execute on function assign_profile_roles(uuid, app_role[], division) from anon;
grant execute on function assign_profile_roles(uuid, app_role[], division) to authenticated;

-- Vincular client_id a un perfil (solo owner)
create or replace function link_profile_client(p_profile_id uuid, p_client_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not (my_roles() && array['owner']::app_role[]) then
    raise exception 'Sin autorización';
  end if;

  update profiles
  set client_id = p_client_id
  where id = p_profile_id;
end;
$$;

revoke execute on function link_profile_client(uuid, uuid) from anon;
grant execute on function link_profile_client(uuid, uuid) to authenticated;

-- Alta automática: todo usuario nuevo de Auth recibe perfil con rol cliente
-- (no ve nada hasta que el owner le asigne rol desde Administración)
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, roles)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    '{cliente}'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
