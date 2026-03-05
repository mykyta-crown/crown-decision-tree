create or replace function public.count_commercials_docs_files(
    p_company_id uuid default null
)
returns numeric
language plpgsql
security definer
as $$
declare
    v_count numeric := 0;
begin
    if p_company_id is null then
        -- Count all files in the bucket, but only for valid auctions
        select count(*) into v_count
        from storage.objects o
        join auctions a
          on o.name like a.auctions_group_settings_id::text || '/' || a.id::text || '/%'
        where o.bucket_id = 'commercials_docs'
          and a.usage not in ('test', 'training')
          and a.deleted = false
          and a.published = true;
    else
        -- Count files for all auctions of the company, with filters
        select count(*) into v_count
        from storage.objects o
        join auctions a
          on o.name like a.auctions_group_settings_id::text || '/' || a.id::text || '/%'
        where o.bucket_id = 'commercials_docs'
          and a.company_id = p_company_id
          and a.usage not in ('test', 'training')
          and a.deleted = false
          and a.published = true;
    end if;

    return coalesce(v_count, 0);
end;
$$;