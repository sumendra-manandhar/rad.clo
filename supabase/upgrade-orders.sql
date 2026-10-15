-- Upgrades the `orders` table left over from the August version of the site
-- (customer_name / phone / address / email / total_price + an order_items
-- table) to the format the current site uses (customer + items JSON,
-- total, note, order number).
--
-- Run once in the Supabase SQL editor. Safe to re-run; it does nothing on a
-- database that never had the old columns. Old columns and order_items are
-- kept, not deleted.

-- 1. New columns (existing rows are numbered from #1001 in creation order).
alter table orders add column if not exists customer jsonb;
alter table orders add column if not exists items jsonb;
alter table orders add column if not exists total int;
alter table orders add column if not exists note text;
do $$
begin
  if not exists (
    select 1 from information_schema.columns where table_name = 'orders' and column_name = 'number'
  ) then
    create temporary sequence tmp_order_number start 1001;
    alter table orders add column number int;
    update orders o set number = n.num
      from (select id, nextval('tmp_order_number') as num from orders order by created_at) n
      where o.id = n.id;
    alter table orders alter column number set not null;
    execute format(
      'alter table orders alter column number add generated always as identity (start with %s)',
      coalesce((select max(number) from orders), 1000) + 1
    );
    drop sequence tmp_order_number;
  end if;
end $$;

-- 2. Copy old data into the new columns and relax the old NOT NULLs.
do $$
begin
  if exists (
    select 1 from information_schema.columns where table_name = 'orders' and column_name = 'customer_name'
  ) then
    update orders set customer = jsonb_strip_nulls(jsonb_build_object(
        'name', coalesce(customer_name, ''),
        'phone', coalesce(phone, ''),
        'email', email,
        'address', coalesce(address, '')
      ))
      where customer is null;
    update orders set total = round(coalesce(total_price, 0))::int where total is null;

    alter table orders alter column customer_name drop not null;
    alter table orders alter column phone drop not null;
    alter table orders alter column address drop not null;
    alter table orders alter column total_price drop not null;
  end if;

  if exists (select 1 from information_schema.tables where table_name = 'order_items') then
    -- Old placement (side + offsets) is approximated on the new position guide.
    update orders o set items = coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', oi.id::text,
        'garment', 'classic-tee',
        'garmentLabel', coalesce(oi.product_name, 'T-shirt'),
        'color', coalesce(oi.color, '#ffffff'),
        'colorLabel', coalesce(oi.color_label, 'Custom'),
        'size', coalesce(oi.size, 'M'),
        'qty', coalesce(oi.qty, 1),
        'unitPrice', round(coalesce(oi.price, 0))::int,
        'prints', case when oi.design_image_url is null then '[]'::jsonb else jsonb_build_array(jsonb_build_object(
          'location', case when oi.design_side = 'back' then 'back' else 'front' end,
          'placement', jsonb_build_object(
            'x', least(1, greatest(0, 0.5 + coalesce(oi.design_offset_x, 0) * 0.25)),
            'y', least(1, greatest(0, 0.35 - coalesce(oi.design_offset_y, 0) * 0.25)),
            'w', 0.5,
            'rotation', coalesce(oi.design_rotation, 0)
          ),
          'aspect', 1,
          'designType', case when oi.is_custom then 'upload' else 'gallery' end,
          'designName', coalesce(oi.design_name, 'Design'),
          'artworkUrl', oi.design_image_url
        )) end
      ) order by oi.created_at)
      from order_items oi where oi.order_id = o.id
    ), '[]'::jsonb)
    where o.items is null;
  end if;
end $$;

update orders set items = '[]'::jsonb where items is null;
update orders set customer = '{}'::jsonb where customer is null;
update orders set total = 0 where total is null;
-- Old status "received" → new "pending".
update orders set status = 'pending' where status not in ('pending', 'confirmed', 'printing', 'shipped', 'delivered', 'cancelled');

alter table orders alter column status set default 'pending';
