import express from "express";
import { createServer as createViteServer } from "vite";
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

// Helper for local file upload
async function handleFileUpload(file: Express.Multer.File) {
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
    throw new Error("Failed to upload file to local storage");
  }
}

async function startServer() {
  console.log("Starting server...");
  
  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

  // API Routes
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt for: ${username}`);
    
    try {
      console.log(`Attempting SQLite login for: ${username}`);
      const sqliteUser = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
      
      if (sqliteUser) {
        console.log(`SQLite login successful: ${username}`);
        const { password: _, ...userWithoutPassword } = sqliteUser;
        return res.json({ success: true, user: userWithoutPassword, token: "mock-token-" + sqliteUser.id });
      }

      console.log(`Login failed for: ${username}`);
      res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    } catch (error: any) {
      console.error(`Login exception for ${username}:`, error.message);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  app.post("/api/register", async (req, res) => {
    const { username, password, full_name, phone, address } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO users (username, password, full_name, phone, address, is_verified) VALUES (?, ?, ?, ?, ?, ?)");
      const result = stmt.run(username, password, full_name, phone || null, address || null, 1);
      
      const newUser = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid) as any;
      const { password: _, ...userWithoutPassword } = newUser;
      return res.json({ success: true, user: userWithoutPassword, token: "mock-token-" + newUser.id });
    } catch (sqliteErr: any) {
      if (sqliteErr.message?.includes("UNIQUE")) {
        return res.status(400).json({ success: false, message: "Username or phone already exists" });
      }
      console.error("Register error:", sqliteErr.message);
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
      const existingUser = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone) as any;

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
        db.prepare("UPDATE users SET verification_code = ? WHERE phone = ?").run(code, phone);
      } else {
        const dummyUsername = `pending_${Date.now()}_${phone}`;
        db.prepare("INSERT INTO users (username, password, phone, verification_code, is_verified) VALUES (?, ?, ?, ?, ?)")
          .run(dummyUsername, 'pending', phone, code, 0);
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
      const user = db.prepare("SELECT * FROM users WHERE phone = ? AND verification_code = ?").get(phone, code) as any;

      if (user) {
        db.prepare("UPDATE users SET is_verified = 1 WHERE phone = ?").run(phone);
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
      const user = db.prepare("SELECT * FROM users WHERE phone = ? AND is_verified = 1").get(phone) as any;

      if (!user) return res.status(400).json({ error: "Phone not verified" });
      
      db.prepare("UPDATE users SET username = ?, password = ?, full_name = ?, address = ? WHERE phone = ?")
        .run(username, password, full_name, address, phone);
        
      const updatedUser = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone) as any;

      const { password: _, verification_code: __, ...userWithoutSecrets } = updatedUser;
      res.json({ success: true, user: userWithoutSecrets, token: "mock-token-" + updatedUser.id });
    } catch (error: any) {
      if (error.message?.includes("UNIQUE")) {
        res.status(400).json({ error: "Username already exists" });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.put("/api/users/profile", async (req, res) => {
    const { userId, full_name, phone, address } = req.body;
    try {
      db.prepare("UPDATE users SET full_name = ?, phone = ?, address = ? WHERE id = ?")
        .run(full_name, phone, address, userId);
      
      const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
      if (updatedUser) {
        const { password: _, ...userWithoutPassword } = updatedUser;
        return res.json({ success: true, user: userWithoutPassword });
      }
      
      res.status(404).json({ success: false, message: "User not found" });
    } catch (error: any) {
      console.error("Profile update error:", error.message);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  app.get("/api/categories", async (req, res) => {
    try {
      const categories = db.prepare("SELECT * FROM categories").all();
      res.json(categories || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/categories", async (req, res) => {
    const { id, name, name_ar, name_en, name_tr, icon } = req.body;
    try {
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
      db.prepare("DELETE FROM products WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete product error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
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
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
        .run(key, value);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/promotions", async (req, res) => {
    try {
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
      db.prepare("UPDATE promotions SET title = ?, title_ar = ?, title_en = ?, title_tr = ?, image = ? WHERE id = ?")
        .run(title, title_ar, title_en, title_tr, image, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reviews", async (req, res) => {
    try {
      const reviews = db.prepare("SELECT * FROM reviews ORDER BY id DESC").all();
      res.json(reviews || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    const { rating, comment } = req.body;
    const date = new Date().toISOString();
    try {
      db.prepare("INSERT INTO reviews (rating, comment, date) VALUES (?, ?, ?)")
        .run(rating, comment, date);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const orders = db.prepare(`
        SELECT o.*, u.username, u.full_name, u.phone, u.address 
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        ORDER BY o.id DESC
      `).all() as any[];
      
      res.json(orders.map((o: any) => ({
        ...o,
        items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    const { user_id, items, total_price, delivery_fee, discount_applied, promo_code, location_url } = req.body;
    const date = new Date().toISOString();
    try {
      const result = db.prepare(`
        INSERT INTO orders (user_id, items, total_price, delivery_fee, discount_applied, promo_code, status, date, location_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(user_id, JSON.stringify(items), total_price, delivery_fee, discount_applied || 0, promo_code || null, 'pending', date, location_url);
      
      res.json({ success: true, orderId: result.lastInsertRowid });
    } catch (error: any) {
      console.error("Order save error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Polls API
  app.get("/api/polls", async (req, res) => {
    try {
      const polls = db.prepare("SELECT * FROM polls ORDER BY created_at DESC").all();
      res.json(polls || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/polls", async (req, res) => {
    const { question, options } = req.body;
    try {
      const result = db.prepare("INSERT INTO polls (question, options) VALUES (?, ?)")
        .run(question, JSON.stringify(options));
      const poll = db.prepare("SELECT * FROM polls WHERE id = ?").get(result.lastInsertRowid);
      res.json({ success: true, poll });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/polls/:id/vote", async (req, res) => {
    const { id } = req.params;
    const { optionIndex } = req.body;
    try {
      const poll = db.prepare("SELECT * FROM polls WHERE id = ?").get(id) as any;
      if (poll) {
        const options = JSON.parse(poll.options);
        if (options[optionIndex]) {
          options[optionIndex].votes = (options[optionIndex].votes || 0) + 1;
        }
        db.prepare("UPDATE polls SET options = ? WHERE id = ?").run(JSON.stringify(options), id);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Poll not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/polls/:id", async (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM polls WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User Management API
  app.get("/api/users", async (req, res) => {
    try {
      const users = db.prepare("SELECT id, username, full_name, phone, address, is_admin, is_verified FROM users ORDER BY id ASC").all();
      res.json(users || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/users/:id/role", async (req, res) => {
    const { id } = req.params;
    const { is_admin } = req.body;
    try {
      db.prepare("UPDATE users SET is_admin = ? WHERE id = ?").run(is_admin ? 1 : 0, id);
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
