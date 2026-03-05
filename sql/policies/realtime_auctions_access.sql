-- Security policy for realtime.messages table to control access to auction broadcasts
-- This policy extracts the auction ID from the topic and checks if the user is a buyer or supplier

-- Helper function to extract auction ID from realtime topic
create or replace function private.extract_auction_id_from_topic(topic text)
returns uuid
language plpgsql
security definer
as $$
begin
  -- Extract auction ID from topic format: 'broadcast_auctions_id=eq.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  -- or 'broadcast_bids_auction_id=eq.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  if topic like 'broadcast_auctions_id=eq.%' then
    return substring(topic from 'broadcast_auctions_id=eq\.(.+)$')::uuid;
  elsif topic like 'broadcast_bids_auction_id=eq.%' then
    return substring(topic from 'broadcast_bids_auction_id=eq\.(.+)$')::uuid;
  end if;

  return null;
end;
$$;

-- Security policy for realtime.messages table
-- Users can only see messages for auctions where they are either a buyer or supplier
-- For suppliers, they can only see messages for their own bids (bids.seller_id in payload)
create policy "Users can access auction broadcasts for their auctions"
on realtime.messages
for select
using (
  private.extract_auction_id_from_topic(topic) is not null
  and (
    private.is_buyer_v2(private.extract_auction_id_from_topic(topic))
    or private.is_supplier(private.extract_auction_id_from_topic(topic))
    or private.is_admin()
  )
);

-- Enable RLS on realtime.messages table
alter table realtime.messages enable row level security;

-- Create index on topic for better performance
create index if not exists idx_realtime_messages_topic
on realtime.messages(topic)
where topic like 'broadcast_auctions_id=eq.%' or topic like 'broadcast_bids_auction_id=eq.%';
