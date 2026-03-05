create or replace function public.auctions_changes()
returns trigger
security definer
language plpgsql
as $$
begin
  perform realtime.broadcast_changes(
    'broadcast_auctions_id=eq.' || coalesce(NEW.id, OLD.id) ::text, -- topic - the topic to which we're broadcasting
    TG_OP,                                             -- event - the event that triggered the function
    TG_OP,                                             -- operation - the operation that triggered the function
    TG_TABLE_NAME,                                     -- table - the table that caused the trigger
    TG_TABLE_SCHEMA,                                   -- schema - the schema of the table that caused the trigger
    NEW,                                               -- new record - the record after the change
    OLD                                                -- old record - the record before the change
  );
  return null;
end;
$$;
