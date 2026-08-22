-- Fail closed unless the isolated simulator schema has exactly ten RLS tables.
do $$
declare
  sim_table_count integer;
  sim_rls_count integer;
begin
  select count(*) into sim_table_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'sim' and c.relkind = 'r';

  select count(*) into sim_rls_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'sim' and c.relkind = 'r' and c.relrowsecurity;

  if sim_table_count <> 10 or sim_rls_count <> 10 then
    raise exception 'Simulator schema verification failed: tables=%, rls_enabled=%',
      sim_table_count, sim_rls_count;
  end if;
end $$;
