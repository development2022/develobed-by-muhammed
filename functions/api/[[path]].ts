import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { createClient } from '@supabase/supabase-js';

const app = new Hono().basePath('/api');

// Helper to get Supabase client
const getSupabase = (env: any) => {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  return createClient(url, key);
};

// Health Check
app.get('/health', (c) => c.json({ status: 'ok', environment: 'cloudflare' }));

// Categories
app.get('/categories', async (c) => {
  const supabase = getSupabase(c.env);
  const { data, error } = await supabase.from('categories').select('*');
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data || []);
});

app.post('/categories', async (c) => {
  const supabase = getSupabase(c.env);
  const body = await c.req.json();
  const { error } = await supabase.from('categories').insert(body);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

// Products
app.get('/products', async (c) => {
  const supabase = getSupabase(c.env);
  const category = c.req.query('category');
  let query = supabase.from('products').select('*');
  if (category) {
    query = query.eq('category_id', category);
  }
  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);
  
  const parsedProducts = (data || []).map((p: any) => ({
    ...p,
    weights: typeof p.weights === 'string' ? JSON.parse(p.weights) : p.weights
  }));
  return c.json(parsedProducts);
});

app.post('/products', async (c) => {
  const supabase = getSupabase(c.env);
  const body = await c.req.json();
  const { data, error } = await supabase.from('products').insert({
    ...body,
    weights: JSON.stringify(body.weights),
    is_limited: body.is_limited ? 1 : 0
  }).select().single();
  
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ id: data.id, success: true });
});

// Settings
app.get('/settings', async (c) => {
  const supabase = getSupabase(c.env);
  const { data, error } = await supabase.from('settings').select('*');
  if (error) return c.json({ error: error.message }, 500);
  
  const settingsMap = (data || []).reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});
  return c.json(settingsMap);
});

app.post('/settings', async (c) => {
  const supabase = getSupabase(c.env);
  const body = await c.req.json();
  const { error } = await supabase.from('settings').upsert(body);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

// Promotions
app.get('/promotions', async (c) => {
  const supabase = getSupabase(c.env);
  const { data, error } = await supabase.from('promotions').select('*');
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data || []);
});

// Orders
app.get('/orders', async (c) => {
  const supabase = getSupabase(c.env);
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  
  const parsedOrders = (data || []).map((o: any) => ({
    ...o,
    items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items
  }));
  return c.json(parsedOrders);
});

app.post('/orders', async (c) => {
  const supabase = getSupabase(c.env);
  const body = await c.req.json();
  const { data, error } = await supabase.from('orders').insert({
    ...body,
    items: JSON.stringify(body.items)
  }).select().single();
  
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ id: data.id, success: true });
});

// Auth
app.post('/login', async (c) => {
  const supabase = getSupabase(c.env);
  const { username, password } = await c.req.json();
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .maybeSingle();
    
  if (error) return c.json({ error: error.message }, 500);
  if (!user) return c.json({ error: 'Invalid credentials' }, 401);
  
  const { password: _, ...userWithoutPassword } = user;
  return c.json({ success: true, user: userWithoutPassword, token: 'mock-token-' + user.id });
});

// Users
app.get('/users', async (c) => {
  const supabase = getSupabase(c.env);
  const { data, error } = await supabase
    .from('users')
    .select('id, username, full_name, phone, address, is_admin, is_super_admin, is_verified')
    .order('id', { ascending: true });
    
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data || []);
});

export const onRequest = handle(app);
