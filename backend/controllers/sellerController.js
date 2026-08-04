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

module.exports = {
  getSellerDashboardStats,
  getSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  getSellerRevenue,
};

