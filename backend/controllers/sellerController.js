const mongoose = require("mongoose");
const Order = require("../models/Order");
const Crop  = require("../models/Crop");

// ==========================================
// GET /api/seller/dashboard-stats
// ==========================================
const getSellerDashboardStats = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Products (crops) listed by this seller
    const products = await Crop.find({ farmer: sellerId });
    const activeProducts = products.filter(p => p.status === "listed" || p.status === "ready").length;

    // Orders that contain this seller's crops
    const orders = await Order.find({ "items.farmer": sellerId })
      .sort({ createdAt: -1 })
      .populate("buyer", "name email")
      .lean();

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === "pending").length;
    const totalRevenue = orders
      .filter(o => ["accepted", "delivered", "shipped"].includes(o.status))
      .reduce((sum, o) => {
        const myItems = o.items.filter(it => String(it.farmer) === String(sellerId));
        return sum + myItems.reduce((s, it) => s + (it.subtotal || 0), 0);
      }, 0);

    const recentOrders = orders.slice(0, 5).map(o => ({
      _id: o._id,
      cropName: o.items.find(it => String(it.farmer) === String(sellerId))?.cropName || "Product",
      quantity: o.items.find(it => String(it.farmer) === String(sellerId))?.quantity || 0,
      unit: o.items.find(it => String(it.farmer) === String(sellerId))?.unit || "kg",
      totalPrice: o.items
        .filter(it => String(it.farmer) === String(sellerId))
        .reduce((s, it) => s + (it.subtotal || 0), 0),
      buyerName: o.buyer?.name || "Buyer",
      status: o.status,
      createdAt: o.createdAt,
    }));

    return res.status(200).json({
      success: true,
      stats: { totalOrders, pendingOrders, totalRevenue, activeProducts },
      recentOrders,
    });
  } catch (error) {
    console.error("Seller dashboard error:", error);
    return res.status(500).json({ success: false, message: "Unable to load dashboard stats" });
  }
};

// ==========================================
// GET /api/seller/products
// ==========================================
const getSellerProducts = async (req, res) => {
  try {
    const products = await Crop.find({ farmer: req.user._id }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({
      success: true,
      count: products.length,
      products: products.map(p => ({
        _id: p._id,
        name: p.name,
        category: p.category,
        price: p.price,
        unit: p.unit,
        stock: p.quantity,
        imageUrl: p.image?.url || "",
        status: p.status,
        description: p.description,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("Seller products error:", error);
    return res.status(500).json({ success: false, message: "Unable to load products" });
  }
};

// ==========================================
// POST /api/seller/products
// ==========================================
const createSellerProduct = async (req, res) => {
  try {
    const cloudinary = require("../config/cloudinary");
    const { name, category, price, unit, stock, description, status } = req.body;

    if (!name || !price || !stock) {
      return res.status(400).json({ success: false, message: "Name, price and stock are required" });
    }

    let imageUrl = "";
    let imagePublicId = "";
    if (req.file) {
      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "agroconnect360/products", resource_type: "image" },
          (err, result) => err ? reject(err) : resolve(result)
        );
        stream.end(req.file.buffer);
      });
      imageUrl = uploaded.secure_url;
      imagePublicId = uploaded.public_id;
    }

    // Use location from user profile
    const User = require("../models/User");
    const user = await User.findById(req.user._id).lean();

    const product = await Crop.create({
      farmer: req.user._id,
      name,
      category: category || "other",
      price: Number(price),
      unit: ["kg", "quintal", "ton"].includes(unit) ? unit : "kg",
      quantity: Number(stock),
      location: user?.location || "India",
      description: description || "",
      status: "listed",
      image: { url: imageUrl, publicId: imagePublicId },
    });

    return res.status(201).json({ success: true, message: "Product added", product });
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({ success: false, message: error.message || "Unable to add product" });
  }
};

// ==========================================
// PUT /api/seller/products/:id
// ==========================================
const updateSellerProduct = async (req, res) => {
  try {
    const product = await Crop.findOne({ _id: req.params.id, farmer: req.user._id });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const { name, category, price, unit, stock, description, status } = req.body;

    if (name)        product.name        = name;
    if (category)    product.category    = category;
    if (price)       product.price       = Number(price);
    if (unit && ["kg","quintal","ton"].includes(unit)) product.unit = unit;
    if (stock)       product.quantity    = Number(stock);
    if (description !== undefined) product.description = description;
    if (status && ["growing","ready","listed","sold"].includes(status)) product.status = status;

    // Replace image if new file uploaded
    if (req.file) {
      const cloudinary = require("../config/cloudinary");
      // Delete old image
      if (product.image?.publicId) {
        try { await cloudinary.uploader.destroy(product.image.publicId); } catch (e) { /* ignore */ }
      }
      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "agroconnect360/products", resource_type: "image" },
          (err, result) => err ? reject(err) : resolve(result)
        );
        stream.end(req.file.buffer);
      });
      product.image = { url: uploaded.secure_url, publicId: uploaded.public_id };
    }

    await product.save();
    return res.status(200).json({ success: true, message: "Product updated", product });
  } catch (error) {
    console.error("Update product error:", error);
    return res.status(500).json({ success: false, message: error.message || "Unable to update product" });
  }
};

// ==========================================
// DELETE /api/seller/products/:id
// ==========================================
const deleteSellerProduct = async (req, res) => {
  try {
    const product = await Crop.findOne({ _id: req.params.id, farmer: req.user._id });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    await product.deleteOne();
    return res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to delete product" });
  }
};

// ==========================================
// GET /api/seller/revenue
// ==========================================
const getSellerRevenue = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const orders = await Order.find({
      "items.farmer": sellerId,
      status: { $in: ["accepted", "delivered", "shipped"] },
    }).populate("buyer", "name").lean();

    let totalRevenue = 0;
    const transactions = [];

    orders.forEach(o => {
      const myItems = o.items.filter(it => String(it.farmer) === String(sellerId));
      myItems.forEach(it => {
        totalRevenue += it.subtotal || 0;
        transactions.push({
          product: it.cropName,
          buyer: o.buyer?.name || "Buyer",
          qty: it.quantity,
          unit: it.unit,
          amount: it.subtotal,
          date: o.createdAt,
          status: o.status,
        });
      });
    });

    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Monthly grouping
    const monthMap = {};
    transactions.forEach(t => {
      const key = new Date(t.date).toLocaleString("en-IN", { month: "short", year: "numeric" });
      monthMap[key] = (monthMap[key] || 0) + (t.amount || 0);
    });
    const monthly = Object.entries(monthMap).map(([month, revenue]) => ({ month, revenue })).slice(-6);

    return res.status(200).json({
      success: true,
      totalRevenue,
      totalOrders,
      avgOrderValue,
      monthly,
      transactions: transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20),
    });
  } catch (error) {
    console.error("Revenue error:", error);
    return res.status(500).json({ success: false, message: "Unable to load revenue data" });
  }
};

// ==========================================
// GET /api/seller/analytics?days=30
// ==========================================
const getSellerAnalytics = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const orders = await Order.find({
      "items.farmer": sellerId,
      createdAt: { $gte: since },
    }).populate("buyer", "name").lean();

    // Daily revenue
    const dayMap = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      dayMap[key] = { date: key, revenue: 0, orders: 0 };
    }

    // Category breakdown & top products
    const catMap = {};
    const prodMap = {};

    orders.forEach(o => {
      const myItems = o.items.filter(it => String(it.farmer) === String(sellerId));
      if (!myItems.length) return;

      const dateKey = new Date(o.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      const amount = myItems.reduce((s, it) => s + (it.subtotal || 0), 0);

      if (dayMap[dateKey]) {
        dayMap[dateKey].revenue += amount;
        dayMap[dateKey].orders += 1;
      }

      myItems.forEach(it => {
        const name = it.cropName || "Unknown";
        prodMap[name] = (prodMap[name] || 0) + (it.subtotal || 0);
        // Category not stored on item, use product name as proxy
        const cat = name.toLowerCase().includes("rice") ? "Grains"
          : name.toLowerCase().includes("wheat") ? "Grains"
          : name.toLowerCase().includes("tomato") || name.toLowerCase().includes("onion") || name.toLowerCase().includes("potato") ? "Vegetables"
          : name.toLowerCase().includes("mango") || name.toLowerCase().includes("banana") ? "Fruits"
          : "Other";
        catMap[cat] = (catMap[cat] || 0) + (it.subtotal || 0);
      });
    });

    const daily = Object.values(dayMap);
    const totalRevenue = daily.reduce((s, d) => s + d.revenue, 0);
    const totalOrders = daily.reduce((s, d) => s + d.orders, 0);
    const byCategory = Object.entries(catMap).map(([name, revenue]) => ({ name, revenue }));
    const topProducts = Object.entries(prodMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, revenue]) => ({ name, revenue }));

    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    return res.status(200).json({
      success: true,
      totalRevenue,
      totalOrders,
      avgOrderValue,
      daily,
      byCategory,
      topProducts,
    });
  } catch (error) {
    console.error("Seller analytics error:", error);
    return res.status(500).json({ success: false, message: "Unable to load analytics" });
  }
};

// ==========================================
// GET /api/seller/shipments
// Derives shipment-like records from orders
// ==========================================
const getSellerShipments = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const orders = await Order.find({
      "items.farmer": sellerId,
      status: { $in: ["accepted", "processing", "shipped", "delivered"] },
    }).populate("buyer", "name email phone").sort({ updatedAt: -1 }).lean();

    const shipments = [];
    orders.forEach(o => {
      const myItems = o.items.filter(it => String(it.farmer) === String(sellerId));
      if (!myItems.length) return;
      const statusMap = { accepted: "pending", processing: "dispatched", shipped: "in_transit", delivered: "delivered" };
      shipments.push({
        id: `SHP-${String(o._id).slice(-6).toUpperCase()}`,
        orderId: `ORD-${String(o._id).slice(-6).toUpperCase()}`,
        product: myItems.map(it => it.cropName).join(", "),
        buyer: o.buyer?.name || o.deliveryAddress?.name || "Buyer",
        qty: myItems.map(it => `${it.quantity} ${it.unit}`).join(", "),
        status: statusMap[o.status] || "pending",
        carrier: "Delhivery",
        trackingNo: `DL${String(o._id).slice(-9).toUpperCase()}`,
        eta: o.updatedAt,
        from: myItems[0]?.location || "—",
        to: o.deliveryAddress ? `${o.deliveryAddress.city}, ${o.deliveryAddress.state}` : "—",
        createdAt: o.createdAt,
      });
    });

    return res.status(200).json({ success: true, shipments });
  } catch (error) {
    console.error("Seller shipments error:", error);
    return res.status(500).json({ success: false, message: "Unable to load shipments" });
  }
};

module.exports = {
  getSellerDashboardStats,
  getSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  getSellerRevenue,
  getSellerAnalytics,
  getSellerShipments,
};
