require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB      = require("./config/database");
const authRoutes     = require("./routes/authroutes");
const productRoutes  = require("./routes/productRoutes");
const orderRoutes    = require("./routes/orderRoutes");
const paymentRoutes  = require("./routes/paymentroutes");

const app = express();

// ── Connect to MongoDB ────────────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve uploaded files ──────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Serve frontend from /public ───────────────────────────────
app.use(express.static(path.join(__dirname, "../public")));

// ── API Routes ────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

// ── Homepage ──────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/ecommerce_homepage.html"));
});

// Backwards-compatible page routes used by older links/bookmarks.
app.get("/pages/auth_pages.html", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/auth.html"));
});

app.get("/pages/seller_dashboard.html", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/seller_dashboard.html"));
});

app.get("/seller_orders.html", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/seller_orders.html"));
});

app.get("/shop", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/search.html"));
});

app.get("/search", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/search.html"));
});

// ── Start server ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 ReelMart running on port ${PORT}`);
});