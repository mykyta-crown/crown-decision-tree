create or replace function public.get_total_baseline_v2(
    p_start_date timestamp with time zone,
    p_end_date timestamp with time zone,
    p_company_ids uuid[]
)
returns numeric
language plpgsql
security definer
as $$
declare
    v_total_baseline numeric := 0;
begin
    select coalesce(sum(baseline), 0) into v_total_baseline
    from auctions
    where start_at >= p_start_date
      and start_at <= p_end_date
      and company_id = any(p_company_ids)
      and baseline is not null
      and usage = 'real'
      and published = TRUE
      and deleted = FALSE;

    return coalesce(v_total_baseline, 0);
end;
$$;
