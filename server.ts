import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.sqlite");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT,
    name_en TEXT,
    name_tr TEXT,
    icon TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    name_ar TEXT,
    name_en TEXT,
    name_tr TEXT,
    price INTEGER NOT NULL,
    old_price INTEGER,
    discount INTEGER,
    image TEXT NOT NULL,
    weights TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    title_ar TEXT,
    title_en TEXT,
    title_tr TEXT,
    image TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    date TEXT NOT NULL
  );
`);

// Migration for existing tables
try { db.exec("ALTER TABLE categories ADD COLUMN name_ar TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE categories ADD COLUMN name_en TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE categories ADD COLUMN name_tr TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE products ADD COLUMN name_ar TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE products ADD COLUMN name_en TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE products ADD COLUMN name_tr TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE promotions ADD COLUMN title_ar TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE promotions ADD COLUMN title_en TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE promotions ADD COLUMN title_tr TEXT"); } catch(e) {}

// Seed settings if empty
const settingsCount = db.prepare("SELECT COUNT(*) as count FROM settings").get() as { count: number };
if (settingsCount.count === 0) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("logo", "");
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("delivery_fee", "5000");
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("free_delivery_threshold", "58000");
}

// Seed promotions if empty
const promoCount = db.prepare("SELECT COUNT(*) as count FROM promotions").get() as { count: number };
if (promoCount.count === 0) {
  const insertPromo = db.prepare("INSERT INTO promotions (title, title_ar, title_en, title_tr, image) VALUES (?, ?, ?, ?, ?)");
  insertPromo.run('باشترین کاڵا', 'أفضل المنتجات', 'Best Products', 'En İyi Ürünler', 'https://images.unsplash.com/photo-1596386461350-326256694e69?w=800&h=400&fit=crop');
  insertPromo.run('نرخی گەیاندن', 'سعر التوصيل', 'Delivery Price', 'Teslimat Ücreti', 'https://images.unsplash.com/photo-1536591375315-196000ea3676?w=800&h=400&fit=crop');
  insertPromo.run('شیرینی تازە', 'حلويات طازجة', 'Fresh Sweets', 'Taze Tatlılar', 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=800&h=400&fit=crop');
}

// Seed categories if empty, but NO products
const categoryCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
if (categoryCount.count === 0) {
  const insertCategory = db.prepare("INSERT INTO categories (id, name, name_ar, name_en, name_tr, icon) VALUES (?, ?, ?, ?, ?, ?)");
  const categories = [
    { id: 'discount', name: 'داشکاندن', name_ar: 'خصومات', name_en: 'Discounts', name_tr: 'İndirimler', icon: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=200&h=200&fit=crop' },
    { id: 'nuts', name: 'چەرەزات', name_ar: 'مكسرات', name_en: 'Nuts', name_tr: 'Kuruyemiş', icon: 'https://images.unsplash.com/photo-1536591375315-196000ea3676?w=200&h=200&fit=crop' },
    { id: 'dried', name: 'سەوزە و میوەی وشککراوە', name_ar: 'خضروات وفواكه مجففة', name_en: 'Dried Fruits & Veg', name_tr: 'Kurutulmuş Meyve ve Sebze', icon: 'https://images.unsplash.com/photo-1596386461350-326256694e69?w=200&h=200&fit=crop' },
    { id: 'sweets', name: 'شیرینیەکان', name_ar: 'حلويات', name_en: 'Sweets', name_tr: 'Tatlılar', icon: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=200&h=200&fit=crop' },
    { id: 'baklava', name: 'پاقلاوە', name_ar: 'بقلاوة', name_en: 'Baklava', name_tr: 'Baklava', icon: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=200&h=200&fit=crop' },
    { id: 'coffee', name: 'قاوە', name_ar: 'قهوة', name_en: 'Coffee', name_tr: 'Kahve', icon: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200&h=200&fit=crop' },
    { id: 'protein', name: 'پرۆتینەکان', name_ar: 'بروتينات', name_en: 'Proteins', name_tr: 'Proteinler', icon: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=200&h=200&fit=crop' },
    { id: 'spices', name: 'بەهارات', name_ar: 'بهارات', name_en: 'Spices', name_tr: 'Baharatlar', icon: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=200&h=200&fit=crop' },
    { id: 'chocolate', name: 'چۆکلێت', name_ar: 'شوكولاتة', name_en: 'Chocolate', name_tr: 'Çikolata', icon: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=200&h=200&fit=crop' },
  ];
  categories.forEach(cat => insertCategory.run(cat.id, cat.name, cat.name_ar, cat.name_en, cat.name_tr, cat.icon));
}

// Clear products as requested (Disabled to persist data)
// db.prepare("DELETE FROM products").run();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use("/uploads", express.static(uploadDir));

  // API Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    if (username?.toLowerCase() === "muhammed" && password === "K9K8") {
      res.json({ success: true, token: "mock-token-123" });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(categories);
  });

  app.post("/api/categories", (req, res) => {
    const { id, name, name_ar, name_en, name_tr, icon } = req.body;
    try {
      db.prepare("INSERT INTO categories (id, name, name_ar, name_en, name_tr, icon) VALUES (?, ?, ?, ?, ?, ?)").run(id, name, name_ar, name_en, name_tr, icon);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/categories/:id", (req, res) => {
    const { id } = req.params;
    const { name, name_ar, name_en, name_tr, icon } = req.body;
    try {
      db.prepare("UPDATE categories SET name = ?, name_ar = ?, name_en = ?, name_tr = ?, icon = ? WHERE id = ?").run(name, name_ar, name_en, name_tr, icon, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/categories/:id", (req, res) => {
    const { id } = req.params;
    try {
      const deleteCategoryTx = db.transaction((catId) => {
        db.prepare("DELETE FROM products WHERE category_id = ?").run(catId);
        db.prepare("DELETE FROM categories WHERE id = ?").run(catId);
      });
      deleteCategoryTx(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete category error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/products", (req, res) => {
    const { category } = req.query;
    let products;
    if (category) {
      products = db.prepare("SELECT * FROM products WHERE category_id = ?").all(category);
    } else {
      products = db.prepare("SELECT * FROM products").all();
    }
    
    const parsedProducts = products.map((p: any) => ({
      ...p,
      weights: JSON.parse(p.weights)
    }));
    
    res.json(parsedProducts);
  });

  app.post("/api/upload", upload.single("image"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  app.post("/api/products", (req, res) => {
    const { category_id, name, name_ar, name_en, name_tr, price, old_price, discount, image, weights } = req.body;
    
    try {
      const info = db.prepare(`
        INSERT INTO products (category_id, name, name_ar, name_en, name_tr, price, old_price, discount, image, weights)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(category_id, name, name_ar, name_en, name_tr, price, old_price || null, discount || null, image, JSON.stringify(weights));
      
      res.json({ id: info.lastInsertRowid, success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/products/:id", (req, res) => {
    const { id } = req.params;
    const { category_id, name, name_ar, name_en, name_tr, price, old_price, discount, image, weights } = req.body;
    
    try {
      const productId = parseInt(id);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      db.prepare(`
        UPDATE products 
        SET category_id = ?, name = ?, name_ar = ?, name_en = ?, name_tr = ?, price = ?, old_price = ?, discount = ?, image = ?, weights = ?
        WHERE id = ?
      `).run(category_id, name, name_ar, name_en, name_tr, price, old_price || null, discount || null, image, JSON.stringify(weights), productId);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Update product error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/products/:id", (req, res) => {
    const { id } = req.params;
    try {
      const productId = parseInt(id);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      db.prepare("DELETE FROM products WHERE id = ?").run(productId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete product error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const settingsMap = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsMap);
  });

  app.post("/api/settings", (req, res) => {
    const { key, value } = req.body;
    try {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/promotions", (req, res) => {
    const promos = db.prepare("SELECT * FROM promotions").all();
    res.json(promos);
  });

  app.put("/api/promotions/:id", (req, res) => {
    const { id } = req.params;
    const { title, title_ar, title_en, title_tr, image } = req.body;
    try {
      db.prepare("UPDATE promotions SET title = ?, title_ar = ?, title_en = ?, title_tr = ?, image = ? WHERE id = ?").run(title, title_ar, title_en, title_tr, image, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reviews", (req, res) => {
    const reviews = db.prepare("SELECT * FROM reviews ORDER BY id DESC").all();
    res.json(reviews);
  });

  app.post("/api/reviews", (req, res) => {
    const { rating, comment } = req.body;
    const date = new Date().toISOString();
    try {
      db.prepare("INSERT INTO reviews (rating, comment, date) VALUES (?, ?, ?)").run(rating, comment, date);
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
