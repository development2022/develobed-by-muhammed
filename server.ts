import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import twilio from "twilio";
import dotenv from "dotenv";
import db from "./db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Client Initialization
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Global state for Supabase health
let isSupabaseHealthy = false;
const checkSupabaseHealth = async () => {
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_')) {
    console.log("Supabase credentials not configured. Using SQLite.");
    return false;
  }
  try {
    // Check if essential tables exist
    const tables = ['products', 'categories', 'promotions', 'settings', 'users'];
    for (const table of tables) {
      const { error } = await supabase.from(table).select("count", { count: "exact", head: true });
      if (error) {
        console.warn(`Supabase table '${table}' missing or inaccessible:`, error.message);
        return false;
      }
    }
    console.log("Supabase connection healthy. Using Supabase as primary database.");
    return true;
  } catch (err) {
    console.warn("Supabase health check failed:", err);
    return false;
  }
};

// Twilio Client Lazy Initialization
let twilioClient: any = null;
const getTwilioClient = () => {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  
  if (!sid || !token || sid === '' || token === '') return null;
  
  // Basic validation to prevent SDK from throwing immediate error
  if (!sid.startsWith('AC')) {
    // Only log if it's not a placeholder and not empty
    if (sid.length > 5 && !sid.includes('YOUR_')) {
      console.error("Twilio Error: TWILIO_ACCOUNT_SID must start with 'AC'. Please check your project settings.");
    }
    return null;
  }

  if (!twilioClient) {
    try {
      twilioClient = twilio(sid, token);
    } catch (err: any) {
      console.error("Twilio Initialization Error:", err.message);
      return null;
    }
  }
  return twilioClient;
};

export const app = express();
const PORT = 3000;

// Multer config
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper to upload to Supabase Storage with local fallback
async function handleFileUpload(file: Express.Multer.File, bucket: string = 'uploads') {
  try {
    // Try Supabase first
    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR_')) {
      const fileExt = path.extname(file.originalname);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExt}`;
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return publicUrl;
      }
      console.warn("Supabase upload failed, falling back to local:", error.message);
    }
  } catch (err) {
    console.warn("Supabase upload exception, falling back to local:", err);
  }

  // Local Fallback
  try {
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);
    
    fs.writeFileSync(filePath, file.buffer);
    console.log(`File saved locally: /uploads/${fileName}`);
    return `/uploads/${fileName}`;
  } catch (err: any) {
    console.error("Local upload failed:", err.message);
    throw new Error("Failed to upload file to both Supabase and local storage");
  }
}

async function startServer() {
  console.log("Starting server...");
  
  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  isSupabaseHealthy = await checkSupabaseHealth();
  
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

  // API Routes
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt for: ${username}`);
    
    try {
      // 1. Try Supabase if healthy
      if (isSupabaseHealthy) {
        const { data: user, error } = await supabase
          .from("users")
          .select("*")
          .eq("username", username)
          .eq("password", password)
          .single();

        if (!error && user) {
          console.log(`Supabase login successful: ${username}`);
          const { password: _, ...userWithoutPassword } = user;
          return res.json({ success: true, user: userWithoutPassword, token: "mock-token-" + user.id });
        }
        
        if (error && !error.message.includes("cache") && !error.message.includes("not find")) {
          console.warn(`Supabase login error for ${username}:`, error.message);
        }
      }

      // 2. Fallback to SQLite
      console.log(`Attempting SQLite login for: ${username}`);
      const sqliteUser = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
      
      if (sqliteUser) {
        console.log(`SQLite login successful: ${username}`);
        const { password: _, ...userWithoutPassword } = sqliteUser;
        return res.json({ success: true, user: userWithoutPassword, token: "mock-token-" + sqliteUser.id });
      }

      // 3. If both failed
      console.log(`Login failed for: ${username}`);
      res.status(401).json({ 
        success: false, 
        message: isSupabaseHealthy ? "Invalid credentials" : "Login failed. Database is in local mode and user was not found." 
      });
    } catch (error: any) {
      console.error(`Login exception for ${username}:`, error.message);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  app.post("/api/register/request-code", async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number is required" });
    
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    console.log(`Verification code for ${phone}: ${code}`); 
    
    try {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("phone", phone)
        .maybeSingle();

      if (existingUser && existingUser.is_verified) {
        return res.status(400).json({ error: "Phone number already registered" });
      }
      
      // Try to send real SMS if Twilio is configured
      const client = getTwilioClient();
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
      
      if (client && twilioPhone) {
        try {
          await client.messages.create({
            body: `کۆدی دڵنیاییەکەت لە کۆگای ئێمە بریتییە لە: ${code}`,
            from: twilioPhone,
            to: phone.startsWith('+') ? phone : `+964${phone.replace(/^0/, '')}`
          });
          console.log("Real SMS sent via Twilio");
        } catch (smsError: any) {
          console.error("Twilio SMS Error:", smsError.message);
        }
      }
      
      if (existingUser) {
        await supabase.from("users").update({ verification_code: code }).eq("phone", phone);
      } else {
        const dummyUsername = `pending_${Date.now()}_${phone}`;
        await supabase.from("users").insert({
          username: dummyUsername,
          password: 'pending',
          phone,
          verification_code: code,
          is_verified: 0
        });
      }
      
      res.json({ 
        success: true, 
        message: client ? "Verification code sent via SMS" : "Verification code generated (Demo Mode)", 
        debug_code: client ? null : code
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/register/verify-code", async (req, res) => {
    const { phone, code } = req.body;
    try {
      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("phone", phone)
        .eq("verification_code", code)
        .maybeSingle();

      if (user) {
        await supabase.from("users").update({ is_verified: 1 }).eq("phone", phone);
        res.json({ success: true });
      } else {
        res.status(400).json({ error: "Invalid verification code" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/register/complete", async (req, res) => {
    const { phone, username, password, full_name, address } = req.body;
    try {
      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("phone", phone)
        .eq("is_verified", 1)
        .maybeSingle();

      if (!user) return res.status(400).json({ error: "Phone not verified" });
      
      const { data: updatedUser, error } = await supabase
        .from("users")
        .update({ username, password, full_name, address })
        .eq("phone", phone)
        .select()
        .single();
        
      if (error) throw error;

      const { password: _, verification_code: __, ...userWithoutSecrets } = updatedUser;
      res.json({ success: true, user: userWithoutSecrets, token: "mock-token-" + updatedUser.id });
    } catch (error: any) {
      if (error.message?.includes("unique")) {
        res.status(400).json({ error: "Username already exists" });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.get("/api/categories", async (req, res) => {
    try {
      if (isSupabaseHealthy) {
        const { data: categories, error } = await supabase.from("categories").select("*");
        if (!error) return res.json(categories || []);
      }
      
      const categories = db.prepare("SELECT * FROM categories").all();
      res.json(categories || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/categories", async (req, res) => {
    const { id, name, name_ar, name_en, name_tr, icon } = req.body;
    try {
      if (isSupabaseHealthy) {
        const { error } = await supabase.from("categories").insert({ id, name, name_ar, name_en, name_tr, icon });
        if (!error) return res.json({ success: true });
      }
      
      db.prepare("INSERT OR REPLACE INTO categories (id, name, name_ar, name_en, name_tr, icon) VALUES (?, ?, ?, ?, ?, ?)")
        .run(id, name, name_ar, name_en, name_tr, icon);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    const { id } = req.params;
    const { name, name_ar, name_en, name_tr, icon } = req.body;
    try {
      if (isSupabaseHealthy) {
        const { error } = await supabase.from("categories").update({ name, name_ar, name_en, name_tr, icon }).eq("id", id);
        if (!error) return res.json({ success: true });
      }
      
      db.prepare("UPDATE categories SET name = ?, name_ar = ?, name_en = ?, name_tr = ?, icon = ? WHERE id = ?")
        .run(name, name_ar, name_en, name_tr, icon, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    const { id } = req.params;
    try {
      if (isSupabaseHealthy) {
        await supabase.from("products").delete().eq("category_id", id);
        await supabase.from("categories").delete().eq("id", id);
        return res.json({ success: true });
      }
      
      db.prepare("DELETE FROM products WHERE category_id = ?").run(id);
      db.prepare("DELETE FROM categories WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete category error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/products", async (req, res) => {
    const { category } = req.query;
    try {
      if (isSupabaseHealthy) {
        let query = supabase.from("products").select("*");
        if (category) {
          query = query.eq("category_id", category);
        }
        const { data: products, error } = await query;
        if (!error) {
          const parsedProducts = (products || []).map((p: any) => ({
            ...p,
            weights: typeof p.weights === 'string' ? JSON.parse(p.weights) : p.weights
          }));
          return res.json(parsedProducts);
        }
      }

      let sqliteQuery = "SELECT * FROM products";
      const params: any[] = [];
      if (category) {
        sqliteQuery += " WHERE category_id = ?";
        params.push(category);
      }
      const products = db.prepare(sqliteQuery).all(...params) as any[];
      const parsedProducts = products.map((p: any) => ({
        ...p,
        weights: typeof p.weights === 'string' ? JSON.parse(p.weights) : p.weights
      }));
      res.json(parsedProducts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/upload", upload.single("image"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    try {
      const url = await handleFileUpload(req.file);
      res.json({ url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/products", async (req, res) => {
    const { category_id, name, name_ar, name_en, name_tr, price, old_price, discount, image, weights, is_limited } = req.body;
    
    try {
      if (isSupabaseHealthy) {
        const { data, error } = await supabase
          .from("products")
          .insert({
            category_id,
            name,
            name_ar,
            name_en,
            name_tr,
            price,
            old_price: old_price || null,
            discount: discount || null,
            image,
            weights: JSON.stringify(weights),
            is_limited: is_limited ? 1 : 0
          })
          .select()
          .single();
        
        if (!error) return res.json({ id: data.id, success: true });
      }
      
      const result = db.prepare(`
        INSERT INTO products (category_id, name, name_ar, name_en, name_tr, price, old_price, discount, image, weights, is_limited)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(category_id, name, name_ar, name_en, name_tr, price, old_price || null, discount || null, image, JSON.stringify(weights), is_limited ? 1 : 0);
      
      res.json({ id: result.lastInsertRowid, success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    const { category_id, name, name_ar, name_en, name_tr, price, old_price, discount, image, weights, is_limited } = req.body;
    
    try {
      if (isSupabaseHealthy) {
        const { error } = await supabase
          .from("products")
          .update({
            category_id,
            name,
            name_ar,
            name_en,
            name_tr,
            price,
            old_price: old_price || null,
            discount: discount || null,
            image,
            weights: JSON.stringify(weights),
            is_limited: is_limited ? 1 : 0
          })
          .eq("id", id);
        
        if (!error) return res.json({ success: true });
      }
      
      db.prepare(`
        UPDATE products SET 
          category_id = ?, name = ?, name_ar = ?, name_en = ?, name_tr = ?, 
          price = ?, old_price = ?, discount = ?, image = ?, weights = ?, is_limited = ?
        WHERE id = ?
      `).run(category_id, name, name_ar, name_en, name_tr, price, old_price || null, discount || null, image, JSON.stringify(weights), is_limited ? 1 : 0, id);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Update product error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    try {
      if (isSupabaseHealthy) {
        const { error } = await supabase.from("products").delete().eq("id", id);
        if (!error) return res.json({ success: true });
      }
      
      db.prepare("DELETE FROM products WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete product error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      if (isSupabaseHealthy) {
        const { data: settings, error } = await supabase.from("settings").select("*");
        if (!error) {
          const settingsMap = (settings || []).reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
          }, {});
          return res.json(settingsMap);
        }
      }

      const settings = db.prepare("SELECT * FROM settings").all() as any[];
      const settingsMap = settings.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      res.json(settingsMap);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/settings", async (req, res) => {
    const { key, value } = req.body;
    try {
      if (isSupabaseHealthy) {
        const { error } = await supabase.from("settings").upsert({ key, value });
        if (!error) return res.json({ success: true });
      }
      
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
        .run(key, value);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/promotions", async (req, res) => {
    try {
      if (isSupabaseHealthy) {
        const { data: promos, error } = await supabase.from("promotions").select("*");
        if (!error) return res.json(promos || []);
      }

      const promos = db.prepare("SELECT * FROM promotions").all();
      res.json(promos || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/promotions/:id", async (req, res) => {
    const { id } = req.params;
    const { title, title_ar, title_en, title_tr, image } = req.body;
    try {
      if (isSupabaseHealthy) {
        const { error } = await supabase.from("promotions").update({ title, title_ar, title_en, title_tr, image }).eq("id", id);
        if (!error) return res.json({ success: true });
      }
      
      db.prepare("UPDATE promotions SET title = ?, title_ar = ?, title_en = ?, title_tr = ?, image = ? WHERE id = ?")
        .run(title, title_ar, title_en, title_tr, image, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reviews", async (req, res) => {
    const { data: reviews } = await supabase.from("reviews").select("*").order("id", { ascending: false });
    res.json(reviews || []);
  });

  app.post("/api/reviews", async (req, res) => {
    const { rating, comment } = req.body;
    const date = new Date().toISOString();
    try {
      await supabase.from("reviews").insert({ rating, comment, date });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          *,
          users (
            username,
            full_name,
            phone,
            address
          )
        `)
        .order("id", { ascending: false });

      if (error) throw error;
      
      res.json((orders || []).map((o: any) => ({ 
        ...o, 
        items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
        username: o.users?.username,
        full_name: o.users?.full_name,
        phone: o.users?.phone,
        address: o.users?.address
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    const { user_id, items, total_price, delivery_fee, discount_applied, promo_code, location_url } = req.body;
    const date = new Date().toISOString();
    try {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          user_id,
          items: JSON.stringify(items),
          total_price,
          delivery_fee,
          discount_applied: discount_applied || 0,
          promo_code: promo_code || null,
          status: 'pending',
          date,
          location_url
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, orderId: data.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      await supabase.from("orders").update({ status }).eq("id", id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Polls API
  app.get("/api/polls", async (req, res) => {
    try {
      const { data: polls, error } = await supabase
        .from("polls")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      res.json(polls || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/polls", async (req, res) => {
    const { question, options } = req.body;
    try {
      const { data, error } = await supabase
        .from("polls")
        .insert({ question, options })
        .select()
        .single();
      if (error) throw error;
      res.json({ success: true, poll: data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/polls/:id/vote", async (req, res) => {
    const { id } = req.params;
    const { optionIndex } = req.body;
    try {
      const { data: poll, error: fetchError } = await supabase
        .from("polls")
        .select("*")
        .eq("id", id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const options = [...poll.options];
      if (options[optionIndex]) {
        options[optionIndex].votes = (options[optionIndex].votes || 0) + 1;
      }
      
      const { error: updateError } = await supabase
        .from("polls")
        .update({ options })
        .eq("id", id);
        
      if (updateError) throw updateError;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/polls/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from("polls").delete().eq("id", id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Debug Route (Remove after use)
  app.get("/api/debug/users", async (req, res) => {
    try {
      const { data: users, error } = await supabase.from("users").select("*");
      if (error) throw error;
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Diagnostic Route
  app.get("/api/debug/status", async (req, res) => {
    try {
      const results: any = {
        env: {
          supabaseUrl: !!process.env.SUPABASE_URL || !!process.env.VITE_SUPABASE_URL,
          supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY || !!process.env.SUPABASE_ANON_KEY || !!process.env.VITE_SUPABASE_ANON_KEY,
        },
        tables: {}
      };

      const tables = ['users', 'categories', 'products', 'orders', 'polls'];
      for (const table of tables) {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        results.tables[table] = error ? { exists: false, error: error.message } : { exists: true };
      }

      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Temporary Setup Route (Remove after use)
  app.post("/api/setup/admin", async (req, res) => {
    const { username, password } = req.body;
    try {
      console.log(`Setup attempt for admin: ${username}`);
      
      // 1. Try Supabase first
      const { error: tableError } = await supabase.from("users").select("count", { count: "exact", head: true });
      if (!tableError) {
        const { data: user, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("username", username)
          .maybeSingle();

        if (!fetchError) {
          if (user) {
            await supabase.from("users").update({ is_admin: 1, password }).eq("username", username);
          } else {
            await supabase.from("users").insert({
              username,
              password,
              full_name: "Admin User",
              phone: "0000000000",
              address: "Admin Office",
              is_admin: 1,
              is_verified: 1
            });
          }
        }
      }

      // 2. Always update SQLite as well
      try {
        const stmt = db.prepare("INSERT OR REPLACE INTO users (username, password, full_name, is_admin, is_verified) VALUES (?, ?, ?, ?, ?)");
        stmt.run(username, password, "Super Admin", 1, 1);
        console.log(`SQLite setup successful for ${username}`);
      } catch (sqliteErr: any) {
        console.error("SQLite setup error:", sqliteErr.message);
      }

      res.json({ success: true, message: `User ${username} setup as admin.` });
    } catch (error: any) {
      console.error("Setup error:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // User Management API
  app.get("/api/users", async (req, res) => {
    try {
      const { data: users, error } = await supabase
        .from("users")
        .select("id, username, full_name, phone, address, is_admin, is_verified")
        .order("id", { ascending: true });
      if (error) throw error;
      res.json(users || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/users/:id/role", async (req, res) => {
    const { id } = req.params;
    const { is_admin } = req.body;
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_admin: is_admin ? 1 : 0 })
        .eq("id", id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();
