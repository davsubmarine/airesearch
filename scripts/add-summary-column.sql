-- Function to add summary column
create or replace function add_summary_column()
returns void
language plpgsql
security definer
as $$
begin
  -- Add summary column if it doesn't exist
  if not exists (
    select 1
    from information_schema.columns
    where table_name = 'papers'
    and column_name = 'summary'
  ) then
    alter table papers add column summary text;
  end if;
end;
$$; 