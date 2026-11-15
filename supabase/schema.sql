-- ============================================================================
-- Verdant Bowl — Complete Supabase PostgreSQL Schema, RLS, RPCs & Seed Data
-- Run this entire script in: Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ----------------------------------------------------------------------------
-- 1. TABLES
-- ----------------------------------------------------------------------------

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name in ('Basic', 'Standard', 'Premium')),
  slug text not null unique,
  salads_per_day integer not null default 1,
  days_per_month integer not null default 20,
  price integer not null,
  discount_percent integer not null default 0,
  free_delivery boolean not null default false,
  target_audience text not null default '',
  description text not null default '',
  features text[] not null default '{}',
  is_popular boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text not null default '',
  address text not null default '',
  role text not null default 'member' check (role in ('admin', 'member')),
  active_plan_id uuid references public.plans(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.salads (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  price integer not null,
  calories integer not null,
  protein_grams integer not null default 0,
  carbs_grams integer not null default 0,
  fat_grams integer not null default 0,
  image_url text not null,
  category text not null check (category in ('Signature', 'High-Protein', 'Detox', 'Harvest')),
  dietary_tag text not null check (dietary_tag in ('Veg', 'Vegan', 'High-Protein')),
  is_veg boolean not null default true,
  is_vegan boolean not null default false,
  ingredients_list text[] not null default '{}',
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null check (category in ('base', 'protein', 'topping', 'dressing')),
  price integer not null default 0,
  calories integer not null default 0,
  protein_grams integer not null default 0,
  carbs_grams integer not null default 0,
  fat_grams integer not null default 0,
  is_veg boolean not null default true,
  is_vegan boolean not null default true,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.custom_salads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  base_id uuid not null references public.ingredients(id),
  protein_ids uuid[] not null default '{}',
  topping_ids uuid[] not null default '{}',
  dressing_id uuid not null references public.ingredients(id),
  special_instructions text not null default '',
  total_price integer not null,
  total_calories integer not null,
  total_protein integer not null default 0,
  total_carbs integer not null default 0,
  total_fat integer not null default 0,
  is_favorite boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled', 'expired')),
  start_date timestamptz not null,
  end_date timestamptz not null,
  paused_at timestamptz,
  total_paused_days integer not null default 0,
  recipient_name text not null default '',
  recipient_phone text not null default '',
  delivery_address text not null,
  postal_code text not null default '',
  time_slot text not null,
  preferred_salad_id uuid references public.salads(id) on delete set null,
  payment_method text not null default 'Cash on Delivery' check (payment_method = 'Cash on Delivery'),
  cod_status text not null default 'Due on First Delivery' check (cod_status in ('Due on First Delivery', 'Collected')),
  amount_paid integer not null,
  daily_orders_generated integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  order_type text not null default 'one-time' check (order_type in ('one-time', 'subscription')),
  scheduled_for timestamptz not null default now(),
  items jsonb not null default '[]'::jsonb,
  subtotal integer not null,
  discount_percent integer not null default 0,
  discount_amount integer not null default 0,
  delivery_fee integer not null default 0,
  total_amount integer not null,
  recipient_name text not null default '',
  recipient_phone text not null default '',
  delivery_address text not null,
  postal_code text not null default '',
  time_slot text not null,
  status text not null default 'Pending' check (status in ('Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled')),
  payment_method text not null default 'Cash on Delivery' check (payment_method = 'Cash on Delivery'),
  payment_status text not null default 'Cash on Delivery' check (payment_status in ('Cash on Delivery', 'Paid on Delivery', 'Included in Plan')),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  reference_code text not null unique,
  amount integer not null,
  currency text not null default 'INR',
  status text not null default 'pending_cod' check (status in ('pending_cod', 'collected', 'cancelled')),
  method text not null default 'Cash on Delivery' check (method = 'Cash on Delivery'),
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_user_created on public.orders (user_id, created_at desc);
create index if not exists idx_subscriptions_user_created on public.subscriptions (user_id, created_at desc);
create index if not exists idx_custom_salads_user on public.custom_salads (user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS & TRIGGERS
-- ----------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

-- Automatically create a profile row whenever a user signs up in Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, phone, address, role, is_active)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)),
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'address', ''),
    'member',
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent non-admin users from escalating their role or reactivating themselves
create or replace function public.guard_profile_sensitive_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.is_active := old.is_active;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_sensitive_columns on public.profiles;
create trigger trg_guard_profile_sensitive_columns
  before update on public.profiles
  for each row execute function public.guard_profile_sensitive_columns();

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

alter table public.plans enable row level security;
alter table public.profiles enable row level security;
alter table public.salads enable row level security;
alter table public.ingredients enable row level security;
alter table public.custom_salads enable row level security;
alter table public.subscriptions enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;

-- Plans
drop policy if exists "Plans readable by everyone" on public.plans;
create policy "Plans readable by everyone"
  on public.plans for select
  using (is_active = true or public.is_admin());

drop policy if exists "Plans manageable by admin" on public.plans;
create policy "Plans manageable by admin"
  on public.plans for all
  using (public.is_admin())
  with check (public.is_admin());

-- Salads
drop policy if exists "Salads readable by everyone" on public.salads;
create policy "Salads readable by everyone"
  on public.salads for select
  using (is_available = true or public.is_admin());

drop policy if exists "Salads manageable by admin" on public.salads;
create policy "Salads manageable by admin"
  on public.salads for all
  using (public.is_admin())
  with check (public.is_admin());

-- Ingredients
drop policy if exists "Ingredients readable by everyone" on public.ingredients;
create policy "Ingredients readable by everyone"
  on public.ingredients for select
  using (is_available = true or public.is_admin());

drop policy if exists "Ingredients manageable by admin" on public.ingredients;
create policy "Ingredients manageable by admin"
  on public.ingredients for all
  using (public.is_admin())
  with check (public.is_admin());

-- Profiles
drop policy if exists "Profiles readable by owner or admin" on public.profiles;
create policy "Profiles readable by owner or admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Profiles insertable by owner or admin" on public.profiles;
create policy "Profiles insertable by owner or admin"
  on public.profiles for insert
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "Profiles updatable by owner or admin" on public.profiles;
create policy "Profiles updatable by owner or admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- Custom Salads
drop policy if exists "Custom salads readable by owner or admin" on public.custom_salads;
create policy "Custom salads readable by owner or admin"
  on public.custom_salads for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Custom salads insertable by owner" on public.custom_salads;
create policy "Custom salads insertable by owner"
  on public.custom_salads for insert
  with check (auth.uid() = user_id);

drop policy if exists "Custom salads updatable by owner" on public.custom_salads;
create policy "Custom salads updatable by owner"
  on public.custom_salads for update
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Custom salads deletable by owner" on public.custom_salads;
create policy "Custom salads deletable by owner"
  on public.custom_salads for delete
  using (auth.uid() = user_id or public.is_admin());

-- Subscriptions
drop policy if exists "Subscriptions readable by owner or admin" on public.subscriptions;
create policy "Subscriptions readable by owner or admin"
  on public.subscriptions for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Subscriptions insertable by owner or admin" on public.subscriptions;
create policy "Subscriptions insertable by owner or admin"
  on public.subscriptions for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Subscriptions updatable by owner or admin" on public.subscriptions;
create policy "Subscriptions updatable by owner or admin"
  on public.subscriptions for update
  using (auth.uid() = user_id or public.is_admin());

-- Orders
drop policy if exists "Orders readable by owner or admin" on public.orders;
create policy "Orders readable by owner or admin"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Orders insertable by owner or admin" on public.orders;
create policy "Orders insertable by owner or admin"
  on public.orders for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Orders updatable by admin" on public.orders;
create policy "Orders updatable by admin"
  on public.orders for update
  using (public.is_admin());

-- Payments
drop policy if exists "Payments readable by owner or admin" on public.payments;
create policy "Payments readable by owner or admin"
  on public.payments for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Payments insertable by owner or admin" on public.payments;
create policy "Payments insertable by owner or admin"
  on public.payments for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Payments updatable by admin" on public.payments;
create policy "Payments updatable by admin"
  on public.payments for update
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. ATOMIC RPC FUNCTIONS (CASH ON DELIVERY ORDERS & SUBSCRIPTIONS)
-- ----------------------------------------------------------------------------

-- Helper: Generate delivery dates (skips Sundays; for <= 20 days also skips Saturdays)
create or replace function public.compute_delivery_dates(p_start_date timestamptz, p_days_count integer)
returns timestamptz[]
language plpgsql
stable
as $$
declare
  v_dates timestamptz[] := '{}';
  v_cursor timestamptz := date_trunc('day', p_start_date) + interval '12 hours';
  v_dow integer;
  v_skip_sat boolean := p_days_count <= 20;
begin
  while coalesce(array_length(v_dates, 1), 0) < p_days_count loop
    v_dow := extract(dow from v_cursor)::integer; -- 0 = Sunday, 6 = Saturday
    if v_dow <> 0 and not (v_skip_sat and v_dow = 6) then
      v_dates := array_append(v_dates, v_cursor);
    end if;
    v_cursor := v_cursor + interval '1 day';
  end loop;
  return v_dates;
end;
$$;

-- Place a one-time Cash on Delivery (COD) order with authoritative price & member discount
create or replace function public.place_cod_order(
  p_items jsonb,
  p_recipient_name text,
  p_recipient_phone text,
  p_delivery_address text,
  p_postal_code text,
  p_time_slot text
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles;
  v_plan public.plans;
  v_item jsonb;
  v_salad public.salads;
  v_custom public.custom_salads;
  v_qty integer;
  v_verified_items jsonb := '[]'::jsonb;
  v_subtotal integer := 0;
  v_discount_percent integer := 0;
  v_discount_amount integer := 0;
  v_after_discount integer := 0;
  v_free_delivery boolean := false;
  v_delivery_fee integer := 40;
  v_total_amount integer := 0;
  v_order_number text;
  v_order public.orders;
begin
  if v_uid is null then
    raise exception 'Authentication required.';
  end if;

  select * into v_profile from public.profiles where id = v_uid and is_active = true;
  if not found then
    raise exception 'Active member profile not found.';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, coalesce((v_item ->> 'quantity')::integer, 1));

    if (v_item ->> 'itemType') = 'custom' and nullif(v_item ->> 'customSaladId', '') is not null then
      select * into v_custom
      from public.custom_salads
      where id = (v_item ->> 'customSaladId')::uuid;

      if not found then
        raise exception 'Custom salad not found.';
      end if;

      v_verified_items := v_verified_items || jsonb_build_array(jsonb_build_object(
        'itemType', 'custom',
        'customSalad', v_custom.id,
        'name', v_custom.name,
        'imageUrl', '/src/assets/images/hero_salad_bowl_1794716475266.jpg',
        'quantity', v_qty,
        'unitPrice', v_custom.total_price,
        'calories', v_custom.total_calories,
        'customizationsSummary', coalesce(v_item ->> 'customizationsSummary', ''),
        'specialInstructions', coalesce(nullif(v_item ->> 'specialInstructions', ''), v_custom.special_instructions, '')
      ));
      v_subtotal := v_subtotal + (v_custom.total_price * v_qty);

    elsif (v_item ->> 'itemType') = 'custom' and (v_item -> 'inlineCustom') is not null then
      v_verified_items := v_verified_items || jsonb_build_array(jsonb_build_object(
        'itemType', 'custom',
        'name', coalesce(nullif(v_item -> 'inlineCustom' ->> 'name', ''), 'Custom Built Salad'),
        'imageUrl', '/src/assets/images/hero_salad_bowl_1794716475266.jpg',
        'quantity', v_qty,
        'unitPrice', coalesce((v_item -> 'inlineCustom' ->> 'totalPrice')::integer, 0),
        'calories', coalesce((v_item -> 'inlineCustom' ->> 'totalCalories')::integer, 0),
        'customizationsSummary', coalesce(v_item -> 'inlineCustom' ->> 'summary', ''),
        'specialInstructions', coalesce(v_item -> 'inlineCustom' ->> 'specialInstructions', '')
      ));
      v_subtotal := v_subtotal + (coalesce((v_item -> 'inlineCustom' ->> 'totalPrice')::integer, 0) * v_qty);

    else
      select * into v_salad
      from public.salads
      where id = (v_item ->> 'saladId')::uuid;

      if not found then
        raise exception 'One of the salads in your cart is unavailable.';
      end if;

      v_verified_items := v_verified_items || jsonb_build_array(jsonb_build_object(
        'itemType', 'salad',
        'salad', v_salad.id,
        'name', v_salad.name,
        'imageUrl', v_salad.image_url,
        'quantity', v_qty,
        'unitPrice', v_salad.price,
        'calories', v_salad.calories,
        'specialInstructions', coalesce(v_item ->> 'specialInstructions', '')
      ));
      v_subtotal := v_subtotal + (v_salad.price * v_qty);
    end if;
  end loop;

  -- Check active subscription first, then profile active_plan_id
  select p.* into v_plan
  from public.subscriptions s
  join public.plans p on p.id = s.plan_id
  where s.user_id = v_uid and s.status = 'active'
  order by s.created_at desc
  limit 1;

  if not found and v_profile.active_plan_id is not null then
    select * into v_plan from public.plans where id = v_profile.active_plan_id;
  end if;

  if found then
    v_discount_percent := v_plan.discount_percent;
    v_free_delivery := v_plan.free_delivery;
  end if;

  v_discount_amount := round((v_subtotal * v_discount_percent) / 100.0)::integer;
  v_after_discount := greatest(0, v_subtotal - v_discount_amount);
  if v_free_delivery or v_after_discount >= 499 then
    v_delivery_fee := 0;
  end if;
  v_total_amount := v_after_discount + v_delivery_fee;

  v_order_number := 'VB-' || lpad(((floor(random() * 900000) + 100000)::integer)::text, 6, '0');

  insert into public.orders (
    order_number, user_id, order_type, scheduled_for, items,
    subtotal, discount_percent, discount_amount, delivery_fee, total_amount,
    recipient_name, recipient_phone, delivery_address, postal_code, time_slot,
    status, payment_method, payment_status
  ) values (
    v_order_number, v_uid, 'one-time', now(), v_verified_items,
    v_subtotal, v_discount_percent, v_discount_amount, v_delivery_fee, v_total_amount,
    trim(p_recipient_name), trim(p_recipient_phone), trim(p_delivery_address), trim(p_postal_code), p_time_slot,
    'Pending', 'Cash on Delivery', 'Cash on Delivery'
  ) returning * into v_order;

  insert into public.payments (
    user_id, order_id, reference_code, amount, currency, status, method
  ) values (
    v_uid, v_order.id, 'COD-' || v_order.order_number, v_total_amount, 'INR', 'pending_cod', 'Cash on Delivery'
  );

  return v_order;
end;
$$;

-- Subscribe to a Monthly Plan via Cash on Delivery & auto-generate daily orders
create or replace function public.subscribe_cod(
  p_plan_id uuid,
  p_recipient_name text,
  p_recipient_phone text,
  p_delivery_address text,
  p_postal_code text,
  p_time_slot text,
  p_preferred_salad_id uuid default null
)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_plan public.plans;
  v_salads public.salads[];
  v_preferred public.salads;
  v_chosen public.salads;
  v_start timestamptz := date_trunc('day', now() + interval '1 day') + interval '12 hours';
  v_dates timestamptz[];
  v_end timestamptz;
  v_sub public.subscriptions;
  v_idx integer;
  v_salad_count integer;
begin
  if v_uid is null then
    raise exception 'Authentication required.';
  end if;

  select * into v_plan from public.plans where id = p_plan_id and is_active = true;
  if not found then
    raise exception 'Selected membership plan was not found.';
  end if;

  -- Cancel existing active/paused subscriptions & pending daily orders
  update public.subscriptions
  set status = 'cancelled'
  where user_id = v_uid and status in ('active', 'paused');

  update public.orders
  set status = 'Cancelled'
  where user_id = v_uid and order_type = 'subscription' and status = 'Pending';

  select array_agg(s) into v_salads from public.salads s where s.is_available = true;
  v_salad_count := coalesce(array_length(v_salads, 1), 0);

  if p_preferred_salad_id is not null then
    select * into v_preferred from public.salads where id = p_preferred_salad_id;
  end if;

  v_dates := public.compute_delivery_dates(v_start, v_plan.days_per_month);
  v_end := v_dates[array_length(v_dates, 1)];

  insert into public.subscriptions (
    user_id, plan_id, status, start_date, end_date,
    recipient_name, recipient_phone, delivery_address, postal_code, time_slot,
    preferred_salad_id, payment_method, cod_status, amount_paid, daily_orders_generated
  ) values (
    v_uid, v_plan.id, 'active', v_start, v_end,
    trim(p_recipient_name), trim(p_recipient_phone), trim(p_delivery_address), trim(p_postal_code), p_time_slot,
    p_preferred_salad_id, 'Cash on Delivery', 'Due on First Delivery', v_plan.price,
    case when v_salad_count > 0 or v_preferred.id is not null then array_length(v_dates, 1) else 0 end
  ) returning * into v_sub;

  if v_salad_count > 0 or v_preferred.id is not null then
    for v_idx in 1..array_length(v_dates, 1) loop
      if v_preferred.id is not null then
        v_chosen := v_preferred;
      else
        v_chosen := v_salads[((v_idx - 1) % v_salad_count) + 1];
      end if;

      insert into public.orders (
        order_number, user_id, subscription_id, order_type, scheduled_for, items,
        subtotal, discount_percent, discount_amount, delivery_fee, total_amount,
        recipient_name, recipient_phone, delivery_address, postal_code, time_slot,
        status, payment_method, payment_status
      ) values (
        'VB-SUB-' || substr(replace(v_sub.id::text, '-', ''), 1, 6) || '-' || v_idx,
        v_uid, v_sub.id, 'subscription', v_dates[v_idx],
        jsonb_build_array(jsonb_build_object(
          'itemType', 'salad',
          'salad', v_chosen.id,
          'name', v_chosen.name,
          'imageUrl', v_chosen.image_url,
          'quantity', v_plan.salads_per_day,
          'unitPrice', v_chosen.price,
          'calories', v_chosen.calories,
          'customizationsSummary', v_plan.name || ' Daily Plan · ' || v_plan.salads_per_day || case when v_plan.salads_per_day > 1 then ' bowls/day' else ' bowl/day' end
        )),
        v_chosen.price * v_plan.salads_per_day,
        v_plan.discount_percent,
        v_chosen.price * v_plan.salads_per_day,
        0,
        0,
        trim(p_recipient_name), trim(p_recipient_phone), trim(p_delivery_address), trim(p_postal_code), p_time_slot,
        case when v_idx = 1 then 'Preparing' else 'Pending' end,
        'Cash on Delivery',
        'Included in Plan'
      );
    end loop;
  end if;

  insert into public.payments (
    user_id, subscription_id, reference_code, amount, currency, status, method
  ) values (
    v_uid, v_sub.id, 'COD-SUB-' || substr(replace(v_sub.id::text, '-', ''), 1, 8), v_plan.price, 'INR', 'pending_cod', 'Cash on Delivery'
  );

  update public.profiles
  set active_plan_id = v_plan.id,
      phone = coalesce(nullif(trim(p_recipient_phone), ''), phone),
      address = coalesce(nullif(trim(p_delivery_address), ''), address)
  where id = v_uid;

  return v_sub;
end;
$$;

-- Pause Subscription
create or replace function public.pause_subscription(p_sub_id uuid)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.subscriptions;
begin
  select * into v_sub
  from public.subscriptions
  where id = p_sub_id and (user_id = auth.uid() or public.is_admin());

  if not found then
    raise exception 'Subscription not found.';
  end if;

  if v_sub.status <> 'active' then
    raise exception 'Only active subscriptions can be paused.';
  end if;

  update public.subscriptions
  set status = 'paused', paused_at = now()
  where id = p_sub_id
  returning * into v_sub;

  update public.orders
  set status = 'Cancelled'
  where subscription_id = p_sub_id and status = 'Pending' and scheduled_for > now();

  return v_sub;
end;
$$;

-- Resume Subscription
create or replace function public.resume_subscription(p_sub_id uuid)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.subscriptions;
  v_plan public.plans;
  v_paused_days integer;
  v_new_end timestamptz;
begin
  select * into v_sub
  from public.subscriptions
  where id = p_sub_id and (user_id = auth.uid() or public.is_admin());

  if not found then
    raise exception 'Subscription not found.';
  end if;

  if v_sub.status <> 'paused' then
    raise exception 'Only paused subscriptions can be resumed.';
  end if;

  select * into v_plan from public.plans where id = v_sub.plan_id;

  v_paused_days := greatest(1, ceil(extract(epoch from (now() - coalesce(v_sub.paused_at, now()))) / 86400.0)::integer);
  v_new_end := v_sub.end_date + (v_paused_days || ' days')::interval;

  update public.subscriptions
  set status = 'active',
      paused_at = null,
      total_paused_days = total_paused_days + v_paused_days,
      end_date = v_new_end
  where id = p_sub_id
  returning * into v_sub;

  return v_sub;
end;
$$;

-- Cancel Subscription
create or replace function public.cancel_subscription(p_sub_id uuid)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.subscriptions;
begin
  select * into v_sub
  from public.subscriptions
  where id = p_sub_id and (user_id = auth.uid() or public.is_admin());

  if not found then
    raise exception 'Subscription not found.';
  end if;

  update public.subscriptions
  set status = 'cancelled'
  where id = p_sub_id
  returning * into v_sub;

  update public.orders
  set status = 'Cancelled'
  where subscription_id = p_sub_id and status = 'Pending';

  update public.profiles
  set active_plan_id = null
  where id = v_sub.user_id and active_plan_id = v_sub.plan_id;

  return v_sub;
end;
$$;

-- Admin helper: Assign a starter COD plan when creating a new member
create or replace function public.admin_assign_member_plan(p_user_id uuid, p_plan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.profiles;
  v_plan public.plans;
  v_start timestamptz := date_trunc('day', now() + interval '1 day') + interval '12 hours';
  v_dates timestamptz[];
  v_end timestamptz;
  v_sub public.subscriptions;
  v_salads public.salads[];
  v_salad_count integer;
  v_chosen public.salads;
  v_idx integer;
begin
  if not public.is_admin() then
    raise exception 'Admin access required.';
  end if;

  select * into v_member from public.profiles where id = p_user_id;
  select * into v_plan from public.plans where id = p_plan_id;
  if not found or v_member.id is null then
    return;
  end if;

  update public.profiles set active_plan_id = v_plan.id where id = v_member.id;

  select array_agg(s) into v_salads from public.salads s where s.is_available = true;
  v_salad_count := coalesce(array_length(v_salads, 1), 0);
  v_dates := public.compute_delivery_dates(v_start, v_plan.days_per_month);
  v_end := v_dates[array_length(v_dates, 1)];

  insert into public.subscriptions (
    user_id, plan_id, status, start_date, end_date,
    recipient_name, recipient_phone, delivery_address, postal_code, time_slot,
    payment_method, cod_status, amount_paid, daily_orders_generated
  ) values (
    v_member.id, v_plan.id, 'active', v_start, v_end,
    v_member.name, v_member.phone, v_member.address, '560034', '12:00 PM - 1:30 PM',
    'Cash on Delivery', 'Due on First Delivery', v_plan.price,
    case when v_salad_count > 0 then array_length(v_dates, 1) else 0 end
  ) returning * into v_sub;

  if v_salad_count > 0 then
    for v_idx in 1..array_length(v_dates, 1) loop
      v_chosen := v_salads[((v_idx - 1) % v_salad_count) + 1];
      insert into public.orders (
        order_number, user_id, subscription_id, order_type, scheduled_for, items,
        subtotal, discount_percent, discount_amount, delivery_fee, total_amount,
        recipient_name, recipient_phone, delivery_address, postal_code, time_slot,
        status, payment_method, payment_status
      ) values (
        'VB-SUB-' || substr(replace(v_sub.id::text, '-', ''), 1, 6) || '-' || v_idx,
        v_member.id, v_sub.id, 'subscription', v_dates[v_idx],
        jsonb_build_array(jsonb_build_object(
          'itemType', 'salad',
          'salad', v_chosen.id,
          'name', v_chosen.name,
          'imageUrl', v_chosen.image_url,
          'quantity', v_plan.salads_per_day,
          'unitPrice', v_chosen.price,
          'calories', v_chosen.calories,
          'customizationsSummary', v_plan.name || ' Daily Plan'
        )),
        v_chosen.price * v_plan.salads_per_day,
        v_plan.discount_percent,
        v_chosen.price * v_plan.salads_per_day,
        0, 0,
        v_member.name, v_member.phone, v_member.address, '560034', '12:00 PM - 1:30 PM',
        case when v_idx = 1 then 'Preparing' else 'Pending' end,
        'Cash on Delivery', 'Included in Plan'
      );
    end loop;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. SEED SAMPLE PLANS, INGREDIENTS, SALADS & DEMO ACCOUNTS
-- ----------------------------------------------------------------------------

insert into public.plans (
  name, slug, salads_per_day, days_per_month, price, discount_percent,
  free_delivery, target_audience, description, features, is_popular, is_active
) values
(
  'Basic', 'basic', 1, 20, 2499, 10, false,
  'For weekday lunch routines',
  'Consistent weekday nutrition with one fresh chef-crafted salad delivered Monday through Friday.',
  array[
    '1 fresh salad bowl per day',
    '20 delivery days per month (Mon–Fri)',
    '10% member discount on extra orders',
    'Pause or reschedule anytime'
  ],
  false, true
),
(
  'Standard', 'standard', 1, 26, 3299, 15, false,
  'For steady daily wellness',
  'Six days a week of macro-balanced bowls tailored to sustain energy, recovery, and clean eating.',
  array[
    '1 fresh salad bowl per day',
    '26 delivery days per month (Mon–Sat)',
    '15% member discount on extra orders',
    'Swap daily bowls & customize macros'
  ],
  true, true
),
(
  'Premium', 'premium', 2, 26, 5499, 25, true,
  'For full-day fitness & families',
  'Lunch and dinner bowls delivered six days a week with complimentary express delivery on every order.',
  array[
    '2 fresh salad bowls per day',
    '26 delivery days per month (Mon–Sat)',
    '25% member discount on extra orders',
    'Free priority delivery on all orders'
  ],
  false, true
)
on conflict (name) do nothing;

insert into public.ingredients (
  name, category, price, calories, protein_grams, carbs_grams, fat_grams, is_veg, is_vegan
) values
  ('Crisp Romaine Lettuce', 'base', 79, 35, 2, 6, 0, true, true),
  ('Baby Spinach Leaves', 'base', 89, 40, 4, 5, 1, true, true),
  ('Massaged Tuscan Kale', 'base', 99, 50, 4, 7, 1, true, true),
  ('Tri-Color Organic Quinoa', 'base', 119, 165, 6, 29, 3, true, true),
  ('Herb Grilled Paneer', 'protein', 75, 185, 14, 3, 13, true, false),
  ('Crispy Sesame Tofu', 'protein', 70, 145, 15, 5, 8, true, true),
  ('Charred Herb Chicken', 'protein', 95, 190, 28, 1, 7, false, false),
  ('Spiced Roasted Chickpeas', 'protein', 55, 135, 8, 21, 3, true, true),
  ('Soft-Boiled Farm Egg (2x)', 'protein', 60, 155, 13, 1, 11, false, false),
  ('English Cucumber Ribbons', 'topping', 25, 15, 1, 3, 0, true, true),
  ('Heirloom Cherry Tomatoes', 'topping', 30, 22, 1, 4, 0, true, true),
  ('Kalamata Olives', 'topping', 40, 45, 0, 2, 4, true, true),
  ('Toasted Almonds & Walnuts', 'topping', 45, 95, 3, 3, 8, true, true),
  ('Roasted Pumpkin & Chia Seeds', 'topping', 35, 75, 4, 4, 5, true, true),
  ('Cold-Pressed Olive Oil & Herb', 'dressing', 25, 90, 0, 1, 10, true, true),
  ('Zesty Lemon Vinaigrette', 'dressing', 25, 65, 0, 3, 6, true, true),
  ('Greek Yogurt & Mint', 'dressing', 30, 55, 3, 4, 3, true, false),
  ('Aged Balsamic Reduction', 'dressing', 30, 50, 0, 8, 2, true, true)
on conflict (name) do nothing;

insert into public.salads (
  name, description, price, calories, protein_grams, carbs_grams, fat_grams,
  image_url, category, dietary_tag, is_veg, is_vegan, ingredients_list, is_available
) values
(
  'Mediterranean Quinoa Power Bowl',
  'Tri-color organic quinoa tossed with English cucumber, heirloom cherry tomatoes, Kalamata olives, crumbled cheese, roasted chickpeas, and lemon-oregano vinaigrette.',
  289, 420, 18, 46, 16,
  '/src/assets/images/salad_mediterranean_quinoa_1794716475366.jpg',
  'Signature', 'Veg', true, false,
  array['Tri-Color Quinoa', 'Cucumber', 'Cherry Tomatoes', 'Kalamata Olives', 'Chickpeas', 'Lemon Dressing'],
  true
),
(
  'Grilled Herb Chicken Protein Bowl',
  'Charred rosemary-garlic chicken breast layered over baby spinach, ripe avocado slices, heirloom tomatoes, and toasted almonds with cold-pressed olive oil.',
  349, 485, 38, 19, 26,
  '/src/assets/images/salad_grilled_herb_chicken_1794716476184.jpg',
  'High-Protein', 'High-Protein', false, false,
  array['Grilled Chicken', 'Baby Spinach', 'Avocado', 'Cherry Tomatoes', 'Toasted Almonds', 'Olive Oil'],
  true
),
(
  'Crispy Sesame Tofu & Massaged Kale',
  'Golden sesame-crusted organic tofu served atop hand-massaged Tuscan kale, purple cabbage crunch, pumpkin seeds, and bright tahini-lemon drizzle.',
  299, 390, 22, 31, 19,
  '/src/assets/images/salad_crispy_tofu_kale_1794716476425.jpg',
  'Harvest', 'Vegan', true, true,
  array['Tuscan Kale', 'Crispy Tofu', 'Purple Cabbage', 'Pumpkin Seeds', 'Cucumber', 'Lemon Tahini'],
  true
),
(
  'Spiced Paneer & Chickpea Harvest',
  'Warm charred paneer cubes and crunchy roasted chickpeas over crisp seasonal greens, cucumber ribbons, and cooling Greek yogurt-mint dressing.',
  319, 460, 24, 34, 23,
  '/src/assets/images/salad_paneer_tikka_harvest_1794716477208.jpg',
  'High-Protein', 'Veg', true, false,
  array['Charred Paneer', 'Roasted Chickpeas', 'Baby Greens', 'Cucumber', 'Pumpkin Seeds', 'Yogurt Mint'],
  true
),
(
  'Emerald Garden Green Detox',
  'Crisp romaine hearts and baby kale paired with green apple slices, creamy avocado, cucumber, and toasted walnuts finished with aged balsamic and olive oil.',
  259, 310, 10, 24, 19,
  '/src/assets/images/salad_garden_green_detox_1794716477502.jpg',
  'Detox', 'Vegan', true, true,
  array['Romaine Lettuce', 'Baby Kale', 'Green Apple', 'Avocado', 'Walnuts', 'Olive Oil & Lemon'],
  true
)
on conflict (name) do nothing;

-- Seed Demo Admin & Member Accounts (admin@verdantbowl.in / Admin@123, member@verdantbowl.in / Member@123)
do $$
declare
  v_admin_id uuid := '11111111-1111-4111-8111-111111111101';
  v_member_id uuid := '11111111-1111-4111-8111-111111111102';
  v_rohan_id uuid := '11111111-1111-4111-8111-111111111103';
  v_standard_plan_id uuid;
  v_basic_plan_id uuid;
  v_salad1 public.salads;
  v_salad2 public.salads;
  v_sub_id uuid := '22222222-2222-4222-8222-222222222201';
begin
  select id into v_standard_plan_id from public.plans where name = 'Standard' limit 1;
  select id into v_basic_plan_id from public.plans where name = 'Basic' limit 1;
  select * into v_salad1 from public.salads where name = 'Mediterranean Quinoa Power Bowl' limit 1;
  select * into v_salad2 from public.salads where name = 'Grilled Herb Chicken Protein Bowl' limit 1;

  -- Admin demo user
  if not exists (select 1 from auth.users where email = 'admin@verdantbowl.in') then
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change, is_super_admin
    ) values (
      v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'admin@verdantbowl.in', extensions.crypt('Admin@123', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Aarav Mehta","phone":"+91 98201 11223","address":"Verdant Kitchen HQ, Indiranagar 100ft Rd, Bengaluru"}'::jsonb,
      now(), now(), '', '', '', '', false
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_admin_id, v_admin_id::text,
      jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@verdantbowl.in', 'email_verified', true, 'phone_verified', false),
      'email', now(), now(), now()
    );
  end if;

  update public.profiles
  set role = 'admin',
      name = 'Aarav Mehta',
      phone = '+91 98201 11223',
      address = 'Verdant Kitchen HQ, Indiranagar 100ft Rd, Bengaluru',
      is_active = true
  where email = 'admin@verdantbowl.in';

  -- Member demo user (Priya Nair)
  if not exists (select 1 from auth.users where email = 'member@verdantbowl.in') then
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change, is_super_admin
    ) values (
      v_member_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'member@verdantbowl.in', extensions.crypt('Member@123', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Priya Nair","phone":"+91 98450 44556","address":"42 Palm Grove Residency, Koramangala 4th Block, Bengaluru"}'::jsonb,
      now(), now(), '', '', '', '', false
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_member_id, v_member_id::text,
      jsonb_build_object('sub', v_member_id::text, 'email', 'member@verdantbowl.in', 'email_verified', true, 'phone_verified', false),
      'email', now(), now(), now()
    );
  else
    select id into v_member_id from auth.users where email = 'member@verdantbowl.in' limit 1;
  end if;

  update public.profiles
  set active_plan_id = v_standard_plan_id
  where id = v_member_id;

  -- Second demo member (Rohan Kulkarni)
  if not exists (select 1 from auth.users where email = 'rohan@verdantbowl.in') then
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change, is_super_admin
    ) values (
      v_rohan_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'rohan@verdantbowl.in', extensions.crypt('Member@123', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Rohan Kulkarni","phone":"+91 99001 77889","address":"18 Maple Court, HSR Layout Sector 2, Bengaluru"}'::jsonb,
      now(), now(), '', '', '', '', false
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_rohan_id, v_rohan_id::text,
      jsonb_build_object('sub', v_rohan_id::text, 'email', 'rohan@verdantbowl.in', 'email_verified', true, 'phone_verified', false),
      'email', now(), now(), now()
    );
  else
    select id into v_rohan_id from auth.users where email = 'rohan@verdantbowl.in' limit 1;
  end if;

  update public.profiles
  set active_plan_id = v_basic_plan_id
  where id = v_rohan_id;

  -- Seed sample active subscription & orders for Priya if none exist
  if not exists (select 1 from public.subscriptions where id = v_sub_id) and v_standard_plan_id is not null then
    insert into public.subscriptions (
      id, user_id, plan_id, status, start_date, end_date,
      recipient_name, recipient_phone, delivery_address, postal_code, time_slot,
      preferred_salad_id, payment_method, cod_status, amount_paid, daily_orders_generated
    ) values (
      v_sub_id, v_member_id, v_standard_plan_id, 'active',
      now() + interval '1 day', now() + interval '30 days',
      'Priya Nair', '+91 98450 44556', '42 Palm Grove Residency, Koramangala 4th Block, Bengaluru', '560034', '12:00 PM - 1:30 PM',
      v_salad1.id, 'Cash on Delivery', 'Collected', 3299, 26
    );

    if v_salad1.id is not null then
      insert into public.orders (
        order_number, user_id, subscription_id, order_type, scheduled_for, items,
        subtotal, discount_percent, discount_amount, delivery_fee, total_amount,
        recipient_name, recipient_phone, delivery_address, postal_code, time_slot,
        status, payment_method, payment_status
      ) values
      (
        'VB-SUB-SEED-1', v_member_id, v_sub_id, 'subscription', now() + interval '1 day',
        jsonb_build_array(jsonb_build_object(
          'itemType', 'salad', 'salad', v_salad1.id, 'name', v_salad1.name,
          'imageUrl', v_salad1.image_url, 'quantity', 1, 'unitPrice', v_salad1.price,
          'calories', v_salad1.calories, 'customizationsSummary', 'Standard Daily Plan · 1 bowl/day'
        )),
        v_salad1.price, 15, v_salad1.price, 0, 0,
        'Priya Nair', '+91 98450 44556', '42 Palm Grove Residency, Koramangala 4th Block, Bengaluru', '560034', '12:00 PM - 1:30 PM',
        'Preparing', 'Cash on Delivery', 'Included in Plan'
      ),
      (
        'VB-SUB-SEED-2', v_member_id, v_sub_id, 'subscription', now() + interval '2 days',
        jsonb_build_array(jsonb_build_object(
          'itemType', 'salad', 'salad', v_salad1.id, 'name', v_salad1.name,
          'imageUrl', v_salad1.image_url, 'quantity', 1, 'unitPrice', v_salad1.price,
          'calories', v_salad1.calories, 'customizationsSummary', 'Standard Daily Plan · 1 bowl/day'
        )),
        v_salad1.price, 15, v_salad1.price, 0, 0,
        'Priya Nair', '+91 98450 44556', '42 Palm Grove Residency, Koramangala 4th Block, Bengaluru', '560034', '12:00 PM - 1:30 PM',
        'Pending', 'Cash on Delivery', 'Included in Plan'
      );
    end if;
  end if;

  if not exists (select 1 from public.orders where order_number = 'VB-1041') and v_salad2.id is not null then
    insert into public.orders (
      order_number, user_id, order_type, scheduled_for, items,
      subtotal, discount_percent, discount_amount, delivery_fee, total_amount,
      recipient_name, recipient_phone, delivery_address, postal_code, time_slot,
      status, payment_method, payment_status
    ) values (
      'VB-1041', v_member_id, 'one-time', now(),
      jsonb_build_array(jsonb_build_object(
        'itemType', 'salad',
        'salad', v_salad2.id,
        'name', v_salad2.name,
        'imageUrl', v_salad2.image_url,
        'quantity', 1,
        'unitPrice', v_salad2.price,
        'calories', v_salad2.calories
      )),
      v_salad2.price, 15, round(v_salad2.price * 0.15)::integer, 40,
      v_salad2.price - round(v_salad2.price * 0.15)::integer + 40,
      'Priya Nair', '+91 98450 44556', '42 Palm Grove Residency, Koramangala 4th Block, Bengaluru', '560034', '12:00 PM - 1:30 PM',
      'Out for Delivery', 'Cash on Delivery', 'Cash on Delivery'
    );
  end if;

  if not exists (select 1 from public.orders where order_number = 'VB-1039') and v_salad1.id is not null then
    insert into public.orders (
      order_number, user_id, order_type, scheduled_for, items,
      subtotal, discount_percent, discount_amount, delivery_fee, total_amount,
      recipient_name, recipient_phone, delivery_address, postal_code, time_slot,
      status, payment_method, payment_status
    ) values (
      'VB-1039', v_rohan_id, 'one-time', now() - interval '1 day',
      jsonb_build_array(jsonb_build_object(
        'itemType', 'salad',
        'salad', v_salad1.id,
        'name', v_salad1.name,
        'imageUrl', v_salad1.image_url,
        'quantity', 2,
        'unitPrice', v_salad1.price,
        'calories', v_salad1.calories
      )),
      v_salad1.price * 2, 10, round(v_salad1.price * 2 * 0.10)::integer, 0,
      (v_salad1.price * 2) - round(v_salad1.price * 2 * 0.10)::integer,
      'Rohan Kulkarni', '+91 99001 77889', '18 Maple Court, HSR Layout Sector 2, Bengaluru', '560102', '7:00 PM - 8:30 PM',
      'Delivered', 'Cash on Delivery', 'Paid on Delivery'
    );
  end if;
end $$;
