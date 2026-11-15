import { supabase, supabaseIsolatedAuth } from '../lib/supabase';
import {
  CustomSalad,
  Ingredient,
  Order,
  OrderStatus,
  Plan,
  Salad,
  Subscription,
  User,
} from '../types';

/* -------------------------------------------------------------------------- */
/* Error Helper                                                               */
/* -------------------------------------------------------------------------- */

function wrapError(err: unknown, fallback: string): Error & {
  response: { status: number; data: { message: string } };
} {
  const raw =
    (err as { message?: string; code?: string }) || {};
  let msg = raw.message || fallback;

  if (
    raw.code === 'PGRST205' ||
    msg.includes('schema cache') ||
    msg.includes('does not exist')
  ) {
    msg =
      'Supabase tables are not set up yet. Please run the SQL query from supabase/schema.sql in your Supabase SQL Editor.';
  } else if (msg.includes('Invalid login credentials')) {
    msg = 'Invalid email or password.';
  } else if (msg.includes('Email not confirmed')) {
    msg =
      'Please verify your email address first, or disable "Confirm email" in Supabase Authentication -> Providers -> Email.';
  }

  const enriched = new Error(msg) as Error & {
    response: { status: number; data: { message: string } };
  };
  enriched.response = { status: 400, data: { message: msg } };
  return enriched;
}

/* -------------------------------------------------------------------------- */
/* Row Mappers (PostgreSQL snake_case -> Frontend TypeScript Interfaces)      */
/* -------------------------------------------------------------------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPlan(row: any): Plan {
  return {
    _id: row.id,
    name: row.name,
    slug: row.slug,
    saladsPerDay: row.salads_per_day,
    daysPerMonth: row.days_per_month,
    price: row.price,
    discountPercent: row.discount_percent,
    freeDelivery: Boolean(row.free_delivery),
    targetAudience: row.target_audience || '',
    description: row.description || '',
    features: Array.isArray(row.features) ? row.features : [],
    isPopular: Boolean(row.is_popular),
    isActive: Boolean(row.is_active),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapProfile(row: any): User {
  return {
    _id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    address: row.address || '',
    role: row.role || 'member',
    activePlan: row.active_plan ? mapPlan(row.active_plan) : null,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSalad(row: any): Salad {
  return {
    _id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    calories: row.calories,
    proteinGrams: row.protein_grams ?? 0,
    carbsGrams: row.carbs_grams ?? 0,
    fatGrams: row.fat_grams ?? 0,
    imageUrl: row.image_url,
    category: row.category,
    dietaryTag: row.dietary_tag,
    isVeg: Boolean(row.is_veg),
    isVegan: Boolean(row.is_vegan),
    ingredientsList: Array.isArray(row.ingredients_list)
      ? row.ingredients_list
      : [],
    isAvailable: Boolean(row.is_available),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapIngredient(row: any): Ingredient {
  return {
    _id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    calories: row.calories,
    proteinGrams: row.protein_grams ?? 0,
    carbsGrams: row.carbs_grams ?? 0,
    fatGrams: row.fat_grams ?? 0,
    isVeg: Boolean(row.is_veg),
    isVegan: Boolean(row.is_vegan),
    isAvailable: Boolean(row.is_available),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapOrder(row: any): Order {
  const mappedUser = row.user
    ? {
        _id: row.user.id,
        name: row.user.name,
        email: row.user.email,
        phone: row.user.phone || '',
        address: row.user.address || '',
        role: row.user.role || 'member',
        isActive: row.user.is_active ?? true,
      }
    : row.user_id;

  return {
    _id: row.id,
    orderNumber: row.order_number,
    user: mappedUser,
    subscription: row.subscription_id || null,
    orderType: row.order_type,
    scheduledFor: row.scheduled_for,
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: row.subtotal,
    discountPercent: row.discount_percent,
    discountAmount: row.discount_amount,
    deliveryFee: row.delivery_fee,
    totalAmount: row.total_amount,
    recipientName: row.recipient_name,
    recipientPhone: row.recipient_phone,
    deliveryAddress: row.delivery_address,
    postalCode: row.postal_code,
    timeSlot: row.time_slot,
    status: row.status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSubscription(row: any): Subscription {
  const mappedUser = row.user
    ? {
        _id: row.user.id,
        name: row.user.name,
        email: row.user.email,
        phone: row.user.phone || '',
        address: row.user.address || '',
        role: row.user.role || 'member',
        isActive: row.user.is_active ?? true,
      }
    : row.user_id;

  return {
    _id: row.id,
    user: mappedUser,
    plan: row.plan ? mapPlan(row.plan) : ({} as Plan),
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    pausedAt: row.paused_at,
    totalPausedDays: row.total_paused_days ?? 0,
    recipientName: row.recipient_name,
    recipientPhone: row.recipient_phone,
    deliveryAddress: row.delivery_address,
    postalCode: row.postal_code,
    timeSlot: row.time_slot,
    preferredSalad: row.preferred_salad ? mapSalad(row.preferred_salad) : null,
    paymentMethod: row.payment_method,
    codStatus: row.cod_status,
    amountPaid: row.amount_paid,
    dailyOrdersGenerated: row.daily_orders_generated ?? 0,
    createdAt: row.created_at,
  };
}

/* -------------------------------------------------------------------------- */
/* Auth Profile Helper                                                        */
/* -------------------------------------------------------------------------- */

export async function fetchCurrentProfile(): Promise<User | null> {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, active_plan:plans(*)')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) {
    throw wrapError(error, 'Failed to load profile.');
  }

  if (!profile) {
    const meta = authUser.user_metadata || {};
    const fallbackInsert = {
      id: authUser.id,
      name: meta.name || authUser.email?.split('@')[0] || 'Member',
      email: (authUser.email || '').toLowerCase(),
      phone: meta.phone || '',
      address: meta.address || '',
      role: 'member',
      is_active: true,
    };

    const { data: created, error: insertErr } = await supabase
      .from('profiles')
      .upsert(fallbackInsert)
      .select('*, active_plan:plans(*)')
      .single();

    if (insertErr) throw wrapError(insertErr, 'Failed to initialize profile.');
    return mapProfile(created);
  }

  return mapProfile(profile);
}

/* -------------------------------------------------------------------------- */
/* Plans, Salads & Ingredients                                                */
/* -------------------------------------------------------------------------- */

export async function fetchPlans(): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) throw wrapError(error, 'Unable to load plans.');
  return (data || []).map(mapPlan);
}

export async function fetchSalads(includeUnavailable = false): Promise<Salad[]> {
  let query = supabase
    .from('salads')
    .select('*')
    .order('created_at', { ascending: true });

  if (!includeUnavailable) {
    query = query.eq('is_available', true);
  }

  const { data, error } = await query;
  if (error) throw wrapError(error, 'Unable to load salads.');
  return (data || []).map(mapSalad);
}

export async function createSalad(payload: Partial<Salad>): Promise<Salad> {
  const { data, error } = await supabase
    .from('salads')
    .insert({
      name: payload.name,
      description: payload.description,
      price: payload.price,
      calories: payload.calories,
      protein_grams: payload.proteinGrams ?? 0,
      carbs_grams: payload.carbsGrams ?? 0,
      fat_grams: payload.fatGrams ?? 0,
      image_url: payload.imageUrl,
      category: payload.category,
      dietary_tag: payload.dietaryTag,
      is_veg: payload.isVeg ?? true,
      is_vegan: payload.isVegan ?? false,
      ingredients_list: payload.ingredientsList ?? [],
      is_available: payload.isAvailable ?? true,
    })
    .select('*')
    .single();

  if (error) throw wrapError(error, 'Unable to create salad.');
  return mapSalad(data);
}

export async function updateSalad(
  id: string,
  payload: Partial<Salad>
): Promise<Salad> {
  const { data, error } = await supabase
    .from('salads')
    .update({
      name: payload.name,
      description: payload.description,
      price: payload.price,
      calories: payload.calories,
      protein_grams: payload.proteinGrams,
      carbs_grams: payload.carbsGrams ?? 0,
      fat_grams: payload.fatGrams ?? 0,
      image_url: payload.imageUrl,
      category: payload.category,
      dietary_tag: payload.dietaryTag,
      is_veg: payload.isVeg,
      is_vegan: payload.isVegan,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw wrapError(error, 'Unable to update salad.');
  return mapSalad(data);
}

export async function deleteSalad(id: string): Promise<void> {
  const { error } = await supabase.from('salads').delete().eq('id', id);
  if (error) throw wrapError(error, 'Unable to delete salad.');
}

export async function fetchIngredients(
  includeUnavailable = false
): Promise<Ingredient[]> {
  let query = supabase
    .from('ingredients')
    .select('*')
    .order('created_at', { ascending: true });

  if (!includeUnavailable) {
    query = query.eq('is_available', true);
  }

  const { data, error } = await query;
  if (error) throw wrapError(error, 'Unable to load ingredients.');
  return (data || []).map(mapIngredient);
}

export async function createIngredient(
  payload: Partial<Ingredient>
): Promise<Ingredient> {
  const { data, error } = await supabase
    .from('ingredients')
    .insert({
      name: payload.name,
      category: payload.category,
      price: payload.price,
      calories: payload.calories,
      protein_grams: payload.proteinGrams ?? 0,
      carbs_grams: payload.carbsGrams ?? 0,
      fat_grams: payload.fatGrams ?? 0,
      is_veg: payload.isVeg ?? true,
      is_vegan: payload.isVegan ?? true,
      is_available: payload.isAvailable ?? true,
    })
    .select('*')
    .single();

  if (error) throw wrapError(error, 'Unable to add ingredient.');
  return mapIngredient(data);
}

export async function updateIngredient(
  id: string,
  payload: Partial<Ingredient>
): Promise<Ingredient> {
  const { data, error } = await supabase
    .from('ingredients')
    .update({
      name: payload.name,
      category: payload.category,
      price: payload.price,
      calories: payload.calories,
      protein_grams: payload.proteinGrams,
      carbs_grams: payload.carbsGrams,
      fat_grams: payload.fatGrams,
      is_veg: payload.isVeg,
      is_vegan: payload.isVegan,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw wrapError(error, 'Unable to update ingredient.');
  return mapIngredient(data);
}

export async function deleteIngredient(id: string): Promise<void> {
  const { error } = await supabase.from('ingredients').delete().eq('id', id);
  if (error) throw wrapError(error, 'Unable to delete ingredient.');
}

/* -------------------------------------------------------------------------- */
/* Custom Salads                                                              */
/* -------------------------------------------------------------------------- */

function hydrateCustomSalad(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any,
  ingMap: Map<string, Ingredient>
): CustomSalad {
  const emptyIng: Ingredient = {
    _id: '',
    name: 'Ingredient',
    category: 'base',
    price: 0,
    calories: 0,
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 0,
    isVeg: true,
    isVegan: true,
    isAvailable: true,
  };

  return {
    _id: row.id,
    name: row.name,
    base: ingMap.get(row.base_id) || emptyIng,
    proteins: (row.protein_ids || [])
      .map((id: string) => ingMap.get(id))
      .filter(Boolean) as Ingredient[],
    toppings: (row.topping_ids || [])
      .map((id: string) => ingMap.get(id))
      .filter(Boolean) as Ingredient[],
    dressing: ingMap.get(row.dressing_id) || emptyIng,
    specialInstructions: row.special_instructions || '',
    totalPrice: row.total_price,
    totalCalories: row.total_calories,
    totalProtein: row.total_protein ?? 0,
    totalCarbs: row.total_carbs ?? 0,
    totalFat: row.total_fat ?? 0,
    isFavorite: Boolean(row.is_favorite),
    createdAt: row.created_at,
  };
}

export async function fetchMyCustomSalads(): Promise<CustomSalad[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [customRes, ingList] = await Promise.all([
    supabase
      .from('custom_salads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    fetchIngredients(true),
  ]);

  if (customRes.error) {
    throw wrapError(customRes.error, 'Unable to load saved bowls.');
  }

  const ingMap = new Map(ingList.map((i) => [i._id, i]));
  return (customRes.data || []).map((row) => hydrateCustomSalad(row, ingMap));
}

export async function createCustomSalad(payload: {
  name: string;
  baseId: string;
  proteinIds?: string[];
  toppingIds?: string[];
  dressingId: string;
  specialInstructions?: string;
  isFavorite?: boolean;
}): Promise<CustomSalad> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw wrapError(null, 'Please sign in to save custom salads.');

  const allIngredients = await fetchIngredients(true);
  const ingMap = new Map(allIngredients.map((i) => [i._id, i]));

  const base = ingMap.get(payload.baseId);
  const dressing = ingMap.get(payload.dressingId);
  if (!base || !dressing) {
    throw wrapError(null, 'Selected base or dressing is unavailable.');
  }

  const proteins = (payload.proteinIds || [])
    .map((id) => ingMap.get(id))
    .filter(Boolean) as Ingredient[];
  const toppings = (payload.toppingIds || [])
    .map((id) => ingMap.get(id))
    .filter(Boolean) as Ingredient[];

  const chosen = [base, dressing, ...proteins, ...toppings];
  const totalPrice = chosen.reduce((sum, i) => sum + i.price, 0);
  const totalCalories = chosen.reduce((sum, i) => sum + i.calories, 0);
  const totalProtein = chosen.reduce((sum, i) => sum + (i.proteinGrams || 0), 0);
  const totalCarbs = chosen.reduce((sum, i) => sum + (i.carbsGrams || 0), 0);
  const totalFat = chosen.reduce((sum, i) => sum + (i.fatGrams || 0), 0);

  const { data, error } = await supabase
    .from('custom_salads')
    .insert({
      user_id: user.id,
      name: payload.name?.trim() || `Custom ${base.name.split(' ')[0]} Bowl`,
      base_id: base._id,
      protein_ids: proteins.map((p) => p._id),
      topping_ids: toppings.map((t) => t._id),
      dressing_id: dressing._id,
      special_instructions: (payload.specialInstructions || '').trim(),
      total_price: totalPrice,
      total_calories: totalCalories,
      total_protein: totalProtein,
      total_carbs: totalCarbs,
      total_fat: totalFat,
      is_favorite: payload.isFavorite ?? true,
    })
    .select('*')
    .single();

  if (error) throw wrapError(error, 'Could not save custom salad.');
  return hydrateCustomSalad(data, ingMap);
}

export async function deleteCustomSalad(id: string): Promise<void> {
  const { error } = await supabase.from('custom_salads').delete().eq('id', id);
  if (error) throw wrapError(error, 'Could not delete custom salad.');
}

/* -------------------------------------------------------------------------- */
/* Orders (COD Only)                                                          */
/* -------------------------------------------------------------------------- */

export async function placeCodOrder(payload: {
  items: unknown[];
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  postalCode: string;
  timeSlot: string;
}): Promise<Order> {
  const { data, error } = await supabase.rpc('place_cod_order', {
    p_items: payload.items,
    p_recipient_name: payload.recipientName,
    p_recipient_phone: payload.recipientPhone,
    p_delivery_address: payload.deliveryAddress,
    p_postal_code: payload.postalCode,
    p_time_slot: payload.timeSlot,
  });

  if (error) throw wrapError(error, 'Unable to place COD order.');
  return mapOrder(data);
}

export async function fetchMyOrders(): Promise<Order[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .order('scheduled_for', { ascending: true })
    .limit(100);

  if (error) throw wrapError(error, 'Unable to load your orders.');
  return (data || []).map(mapOrder);
}

export async function fetchAllOrders(filters?: {
  status?: string;
  orderType?: string;
  search?: string;
}): Promise<Order[]> {
  let query = supabase
    .from('orders')
    .select('*, user:profiles(id, name, email, phone)')
    .order('created_at', { ascending: false })
    .limit(150);

  if (filters?.status && filters.status !== 'All') {
    query = query.eq('status', filters.status);
  }
  if (filters?.orderType && filters.orderType !== 'All') {
    query = query.eq('order_type', filters.orderType);
  }
  if (filters?.search && filters.search.trim()) {
    query = query.ilike('order_number', `%${filters.search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw wrapError(error, 'Unable to load orders.');
  return (data || []).map(mapOrder);
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  const { data: existing, error: findErr } = await supabase
    .from('orders')
    .select('id, order_type')
    .eq('id', orderId)
    .single();

  if (findErr || !existing) {
    throw wrapError(findErr, 'Order not found.');
  }

  const updates: Record<string, unknown> = { status };
  if (existing.order_type === 'one-time' && status === 'Delivered') {
    updates.payment_status = 'Paid on Delivery';
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select('*, user:profiles(id, name, email, phone)')
    .single();

  if (error) throw wrapError(error, 'Failed to update order status.');

  if (existing.order_type === 'one-time') {
    if (status === 'Delivered') {
      await supabase
        .from('payments')
        .update({ status: 'collected' })
        .eq('order_id', orderId);
    } else if (status === 'Cancelled') {
      await supabase
        .from('payments')
        .update({ status: 'cancelled' })
        .eq('order_id', orderId);
    }
  }

  return mapOrder(data);
}

/* -------------------------------------------------------------------------- */
/* Subscriptions (COD Only)                                                   */
/* -------------------------------------------------------------------------- */

export async function subscribeCod(payload: {
  planId: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  postalCode: string;
  timeSlot: string;
  preferredSaladId?: string | null;
}): Promise<Subscription> {
  const { data, error } = await supabase.rpc('subscribe_cod', {
    p_plan_id: payload.planId,
    p_recipient_name: payload.recipientName,
    p_recipient_phone: payload.recipientPhone,
    p_delivery_address: payload.deliveryAddress,
    p_postal_code: payload.postalCode,
    p_time_slot: payload.timeSlot,
    p_preferred_salad_id: payload.preferredSaladId || null,
  });

  if (error) throw wrapError(error, 'Unable to activate Cash on Delivery plan.');
  return mapSubscription(data);
}

export async function fetchMySubscriptions(): Promise<Subscription[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*), preferred_salad:salads(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw wrapError(error, 'Unable to load subscriptions.');
  return (data || []).map(mapSubscription);
}

export async function fetchAllSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*), user:profiles(id, name, email)')
    .order('created_at', { ascending: false });

  if (error) throw wrapError(error, 'Unable to load subscriptions.');
  return (data || []).map(mapSubscription);
}

export async function pauseSubscription(id: string): Promise<Subscription> {
  const { data, error } = await supabase.rpc('pause_subscription', {
    p_sub_id: id,
  });
  if (error) throw wrapError(error, 'Unable to pause subscription.');
  return mapSubscription(data);
}

export async function resumeSubscription(id: string): Promise<Subscription> {
  const { data, error } = await supabase.rpc('resume_subscription', {
    p_sub_id: id,
  });
  if (error) throw wrapError(error, 'Unable to resume subscription.');
  return mapSubscription(data);
}

export async function cancelSubscription(id: string): Promise<Subscription> {
  const { data, error } = await supabase.rpc('cancel_subscription', {
    p_sub_id: id,
  });
  if (error) throw wrapError(error, 'Unable to cancel subscription.');
  return mapSubscription(data);
}

/* -------------------------------------------------------------------------- */
/* Admin Members & Overview                                                   */
/* -------------------------------------------------------------------------- */

export async function fetchAdminOverview() {
  const [membersRes, ordersRes, subsRes, saladsRes] = await Promise.all([
    supabase.from('profiles').select('id, is_active').eq('role', 'member'),
    supabase
      .from('orders')
      .select('*, user:profiles(id, name, email)')
      .order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('id, status, amount_paid'),
    supabase.from('salads').select('id').eq('is_available', true),
  ]);

  if (membersRes.error) throw wrapError(membersRes.error, 'Failed to load overview.');

  const members = membersRes.data || [];
  const orders = ordersRes.data || [];
  const subs = subsRes.data || [];
  const salads = saladsRes.data || [];

  const orderRevenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const subRevenue = subs
    .filter((s) => s.status !== 'cancelled')
    .reduce((sum, s) => sum + (s.amount_paid || 0), 0);

  return {
    metrics: {
      totalMembers: members.length,
      activeMembers: members.filter((m) => m.is_active).length,
      totalOrders: orders.length,
      pendingOrders: orders.filter(
        (o) => o.status === 'Pending' || o.status === 'Preparing'
      ).length,
      activeSubscriptions: subs.filter((s) => s.status === 'active').length,
      totalSalads: salads.length,
      totalRevenue: orderRevenue + subRevenue,
    },
    recentOrders: orders.slice(0, 6).map(mapOrder),
  };
}

export async function fetchMembers(filters?: {
  search?: string;
  status?: string;
  plan?: string;
}): Promise<User[]> {
  let query = supabase
    .from('profiles')
    .select('*, active_plan:plans(*)')
    .eq('role', 'member')
    .order('created_at', { ascending: false });

  if (filters?.status === 'active') query = query.eq('is_active', true);
  if (filters?.status === 'inactive') query = query.eq('is_active', false);

  if (filters?.plan && filters.plan !== 'all') {
    if (filters.plan === 'none') {
      query = query.is('active_plan_id', null);
    } else {
      query = query.eq('active_plan_id', filters.plan);
    }
  }

  if (filters?.search && filters.search.trim()) {
    const q = filters.search.trim();
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw wrapError(error, 'Unable to load members.');
  return (data || []).map(mapProfile);
}

export async function createMemberByAdmin(payload: {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  planId?: string;
}): Promise<User> {
  const cleanEmail = payload.email.toLowerCase().trim();

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (existing) {
    throw wrapError(null, 'A member with this email already exists.');
  }

  const { data, error } = await supabaseIsolatedAuth.auth.signUp({
    email: cleanEmail,
    password: payload.password,
    options: {
      data: {
        name: payload.name.trim(),
        phone: payload.phone.trim(),
        address: payload.address.trim(),
        role: 'member',
      },
    },
  });

  if (error) throw wrapError(error, 'Unable to create member account.');
  if (!data.user || (data.user.identities && data.user.identities.length === 0)) {
    throw wrapError(null, 'A member with this email already exists.');
  }

  // Ensure profile row exists with full details
  await supabase.from('profiles').upsert({
    id: data.user.id,
    name: payload.name.trim(),
    email: cleanEmail,
    phone: payload.phone.trim(),
    address: payload.address.trim(),
    role: 'member',
    is_active: true,
  });

  if (payload.planId) {
    const { error: planErr } = await supabase.rpc('admin_assign_member_plan', {
      p_user_id: data.user.id,
      p_plan_id: payload.planId,
    });
    if (planErr) throw wrapError(planErr, 'Member created, but plan assignment failed.');
  }

  const { data: profile, error: fetchErr } = await supabase
    .from('profiles')
    .select('*, active_plan:plans(*)')
    .eq('id', data.user.id)
    .single();

  if (fetchErr) throw wrapError(fetchErr, 'Member created.');
  return mapProfile(profile);
}

export async function deactivateMember(id: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', id)
    .eq('role', 'member');

  if (error) throw wrapError(error, 'Unable to deactivate member.');

  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', id)
    .in('status', ['active', 'paused']);

  await supabase
    .from('orders')
    .update({ status: 'Cancelled' })
    .eq('user_id', id)
    .eq('status', 'Pending');
}

export async function reactivateMember(id: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: true })
    .eq('id', id)
    .eq('role', 'member');

  if (error) throw wrapError(error, 'Unable to reactivate member.');
}
