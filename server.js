import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 10000;

// Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend build
app.use(express.static(path.join(__dirname, "dist")));

// DB file
const DB_FILE = path.join(__dirname, "beehive_db.json");

// Initial DB
const initialDb = {
  orders: [],
  menu: [],
  categories: ["Burgers", "Chicken", "Rice", "Drinks", "Desserts", "Snacks"],
  paymentConfig: {
    eWalletNumber: "09123456789",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BeeHiveRestobar"
  },
  tables: Array.from({ length: 20 }, (_, i) => ({
    id: (i + 1).toString(),
    isOccupied: false
  }))
};

// Helpers
const readDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
    return initialDb;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
};

const writeDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Orders
app.get("/api/orders", (req, res) => {
  const db = readDb();
  res.json(db.orders);
});

app.post("/api/orders", (req, res) => {
  const db = readDb();

  const newOrder = {
    ...req.body,
    id: Math.random().toString(36).substring(2, 10),
    status: "Pending",
    timestamp: Date.now()
  };

  db.orders.unshift(newOrder);
  writeDb(db);

  res.json(newOrder);
});

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
