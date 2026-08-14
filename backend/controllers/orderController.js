const Order = require("../models/Order");
const Crop  = require("../models/Crop");

// ==========================================
// GET FARMER ORDERS
// GET /api/orders/farmer
// ==========================================
const getFarmerOrders = async (req, res) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        success: false,
        message: "Farmer access required",
      });
    }

    const orders = await Order.find({
      "items.farmer": req.user._id,
    })
      .populate("buyer", "name email phone")
      .sort({ createdAt: -1 });

    // Flatten each order so the frontend can read it directly
    const farmerOrders = [];

    orders.forEach((order) => {
      const orderObj = order.toObject();
      const farmerItems = orderObj.items.filter(
        (item) => item.farmer.toString() === req.user._id.toString()
      );

      // One flat entry per item so the UI card is simple
      farmerItems.forEach((item) => {
        farmerOrders.push({
          _id: order._id,
          status: order.status,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          // flat fields the frontend reads directly
          cropName: item.cropName || item.crop?.name || "Crop",
          quantity: item.quantity,
          unit: item.unit,
          pricePerUnit: item.price,
          totalAmount: item.subtotal || item.quantity * item.price,
          // buyer info
          buyerName: orderObj.buyer?.name || orderObj.deliveryAddress?.name || "Buyer",
          buyerPhone: orderObj.buyer?.phone || orderObj.deliveryAddress?.phone || "",
          deliveryAddress:
            orderObj.deliveryAddress
              ? `${orderObj.deliveryAddress.address || ""}, ${orderObj.deliveryAddress.city || ""}`
              : "",
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          // keep nested too for backward compat
          buyer: orderObj.buyer,
          items: farmerItems,
        });
      });
    });

    return res.status(200).json({
      success: true,
      count: farmerOrders.length,
      orders: farmerOrders,
    });
  } catch (error) {
    console.error("Get farmer orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load orders",
    });
  }
};

// ==========================================
// GET SINGLE FARMER ORDER
// GET /api/orders/farmer/:id
// ==========================================
const getFarmerOrderById = async (
  req,
  res
) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      "items.farmer": req.user._id,
    }).populate(
      "buyer",
      "name email phone"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const orderObject = order.toObject();

    orderObject.items =
      orderObject.items.filter(
        (item) =>
          item.farmer.toString() ===
          req.user._id.toString()
      );

    return res.status(200).json({
      success: true,
      order: orderObject,
    });
  } catch (error) {
    console.error(
      "Get order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load order",
    });
  }
};

// ==========================================
// UPDATE ORDER STATUS
// PATCH /api/orders/farmer/:id/status
// ==========================================
const updateFarmerOrderStatus = async (
  req,
  res
) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "accepted",
      "rejected",
      "processing",
      "shipped",
      "delivered",
      "confirmed",
      "cancelled",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const orderId = req.params.id;
    const isFarmer = req.user.role === "farmer";
    const isBuyer  = ["user", "seller", "exporter"].includes(req.user.role);

    let order;

    if (isFarmer) {
      // Farmers can update any status on orders that contain their items
      order = await Order.findOne({
        _id: orderId,
        "items.farmer": req.user._id,
      });
    } else if (isBuyer) {
      // Buyers may only cancel their own pending orders
      if (status !== "cancelled") {
        return res.status(403).json({
          success: false,
          message: "Buyers can only cancel their own pending orders",
        });
      }
      order = await Order.findOne({
        _id: orderId,
        buyer: req.user._id,
        status: "pending",
      });
    } else {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to update this order",
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or you do not have permission to update it",
      });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order ${status} successfully`,
      order,
    });
  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update order status",
    });
  }
};

// ==========================================
// CREATE TEST ORDER
// POST /api/orders/test
// DEVELOPMENT ONLY
// ==========================================
const createTestOrder = async (req, res) => {
  try {
    const Crop = require("../models/Crop");

    const {
      cropId,
      quantity,
    } = req.body;

    if (!cropId || !quantity) {
      return res.status(400).json({
        success: false,
        message:
          "Crop ID and quantity are required",
      });
    }

    const crop = await Crop.findById(cropId);

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: "Crop not found",
      });
    }

    const orderQuantity = Number(quantity);

    if (
      !Number.isFinite(orderQuantity) ||
      orderQuantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity",
      });
    }

    if (orderQuantity > crop.quantity) {
      return res.status(400).json({
        success: false,
        message:
          "Requested quantity exceeds available stock",
      });
    }

    const subtotal =
      orderQuantity * crop.price;

    const order = await Order.create({
      // Temporary:
      // logged-in farmer acts as test buyer.
      // Real marketplace will replace this.
      buyer: req.user._id,

      items: [
        {
          crop: crop._id,
          farmer: crop.farmer,
          cropName: crop.name,
          quantity: orderQuantity,
          unit: crop.unit,
          price: crop.price,
          subtotal,
        },
      ],

      totalAmount: subtotal,

      deliveryAddress: {
        name: "Test Buyer",
        phone: "9999999999",
        address: "Test Address",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
      },

      paymentMethod: "cod",
      paymentStatus: "pending",
      status: "pending",

      notes:
        "Development test order",
    });

    return res.status(201).json({
      success: true,
      message:
        "Test order created successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Create test order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create test order",
    });
  }
};
// ==========================================
// GET FARMER INCOME
// GET /api/orders/farmer/income
// ==========================================
const getFarmerIncome = async (req, res) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        success: false,
        message: "Farmer access required",
      });
    }

    // Get delivered orders containing
    // products belonging to this farmer
    const orders = await Order.find({
      "items.farmer": req.user._id,
      status: "delivered",
    })
      .populate(
        "buyer",
        "name email phone"
      )
      .sort({
        updatedAt: -1,
      });

    let totalIncome = 0;
    let totalQuantitySold = 0;

    const transactions = [];

    orders.forEach((order) => {
      // Only items belonging to logged-in farmer
      const farmerItems = order.items.filter(
        (item) =>
          item.farmer.toString() ===
          req.user._id.toString()
      );

      const farmerAmount = farmerItems.reduce(
        (total, item) =>
          total + Number(item.subtotal || 0),
        0
      );

      const quantitySold = farmerItems.reduce(
        (total, item) =>
          total + Number(item.quantity || 0),
        0
      );

      totalIncome += farmerAmount;
      totalQuantitySold += quantitySold;

      transactions.push({
        orderId: order._id,

        buyer: {
          name:
            order.buyer?.name ||
            order.deliveryAddress?.name ||
            "Buyer",

          email:
            order.buyer?.email || "",

          phone:
            order.buyer?.phone ||
            order.deliveryAddress?.phone ||
            "",
        },

        items: farmerItems,

        amount: farmerAmount,

        paymentStatus:
          order.paymentStatus,

        paymentMethod:
          order.paymentMethod,

        deliveredAt:
          order.updatedAt,

        // ── Flat fields for frontend Income table ──
        date: order.updatedAt,
        cropName: farmerItems[0]?.cropName || farmerItems[0]?.crop?.name || "Crop",
        buyerName:
          order.buyer?.name ||
          order.deliveryAddress?.name ||
          "Buyer",
        quantity: farmerItems.reduce((s, i) => s + (i.quantity || 0), 0),
        unit: farmerItems[0]?.unit || "kg",
        totalAmount: farmerAmount,
      });
    });

    // ======================================
    // CURRENT MONTH INCOME
    // ======================================

    const now = new Date();

    const currentMonthIncome =
      transactions.reduce(
        (total, transaction) => {
          const date = new Date(
            transaction.deliveredAt
          );

          const isCurrentMonth =
            date.getMonth() ===
              now.getMonth() &&
            date.getFullYear() ===
              now.getFullYear();

          return isCurrentMonth
            ? total +
                Number(
                  transaction.amount || 0
                )
            : total;
        },
        0
      );

    return res.status(200).json({
      success: true,

      summary: {
        totalIncome,
        currentMonthIncome,
        completedOrders:
          transactions.length,
        totalQuantitySold,
      },

      transactions,
    });
  } catch (error) {
    console.error(
      "Get farmer income error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load income information",
    });
  }
};
// ==========================================
// GET FARMER DASHBOARD STATS
// GET /api/orders/farmer/dashboard-stats
// ==========================================
const getFarmerDashboardStats = async (req, res) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        success: false,
        message: "Farmer access required",
      });
    }

    const Crop = require("../models/Crop");

    // --------------------------------------
    // CROP STATISTICS
    // --------------------------------------

    const totalCrops = await Crop.countDocuments({
      farmer: req.user._id,
    });

    const activeCrops = await Crop.countDocuments({
      farmer: req.user._id,
      status: {
        $in: ["growing", "ready"],
      },
    });

    // --------------------------------------
    // ORDER STATISTICS
    // --------------------------------------

    const totalOrders = await Order.countDocuments({
      "items.farmer": req.user._id,
    });

    const pendingOrders = await Order.countDocuments({
      "items.farmer": req.user._id,
      status: "pending",
    });

    const acceptedOrders = await Order.countDocuments({
      "items.farmer": req.user._id,
      status: "accepted",
    });

    const deliveredOrderDocs = await Order.find({
      "items.farmer": req.user._id,
      status: "delivered",
    });

    const deliveredOrders = deliveredOrderDocs.length;

    // --------------------------------------
    // INCOME (from delivered orders only)
    // --------------------------------------

    let totalIncome = 0;

    deliveredOrderDocs.forEach((order) => {
      order.items.forEach((item) => {
        if (
          item.farmer.toString() ===
          req.user._id.toString()
        ) {
          totalIncome += Number(
            item.subtotal || 0
          );
        }
      });
    });

    // --------------------------------------
    // RECENT ORDERS (flattened for dashboard)
    // --------------------------------------

    const rawRecentOrders = await Order.find({
      "items.farmer": req.user._id,
    })
      .populate("buyer", "name email phone")
      .sort({ createdAt: -1 })
      .limit(10);

    // Flatten: one entry per farmer-item so dashboard can read cropName/buyerName directly
    const recentOrders = [];
    rawRecentOrders.forEach((order) => {
      const orderObj = order.toObject();
      const farmerItems = orderObj.items.filter(
        (item) => item.farmer.toString() === req.user._id.toString()
      );
      farmerItems.forEach((item) => {
        recentOrders.push({
          _id:        order._id,
          status:     order.status,
          createdAt:  order.createdAt,
          updatedAt:  order.updatedAt,
          cropName:   item.cropName || "Crop",
          quantity:   item.quantity,
          unit:       item.unit,
          buyerName:  orderObj.buyer?.name || orderObj.deliveryAddress?.name || "Buyer",
        });
      });
    });

    return res.status(200).json({
      success: true,

      stats: {
        totalCrops,
        activeCrops,
        totalOrders,
        pendingOrders,
        acceptedOrders,
        deliveredOrders,
        totalIncome,
      },

      recentOrders,
    });
  } catch (error) {
    console.error(
      "Farmer dashboard stats error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load dashboard statistics",
    });
  }
};

// ==========================================
// GET SELLER ORDERS
// GET /api/orders/seller
// A seller places procurement orders as the BUYER.
// Order.buyer = seller._id   (the seller who purchased)
// Order.items[].farmer = farmer._id (the crop owner)
// So we query by buyer, not items.farmer.
// ==========================================
const getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate("items.farmer", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Flatten each order into a row the Seller UI can render directly.
    // If an order has multiple items (rare for procurement) we emit one row per item.
    const sellerOrders = [];
    orders.forEach((o) => {
      if (!o.items || o.items.length === 0) {
        // Edge case: order with no items — still surface it so seller can see it
        sellerOrders.push({
          _id:            o._id,
          cropName:       "—",
          quantity:       0,
          unit:           "kg",
          price:          0,
          subtotal:       0,
          totalPrice:     o.totalAmount || 0,
          totalAmount:    o.totalAmount || 0,
          status:         o.status,
          farmerName:     "Farmer",
          farmerEmail:    "",
          deliveryAddress: o.deliveryAddress,
          paymentMethod:  o.paymentMethod,
          createdAt:      o.createdAt,
        });
        return;
      }

      o.items.forEach((item) => {
        sellerOrders.push({
          _id:            o._id,
          cropName:       item.cropName || "Product",
          quantity:       item.quantity,
          unit:           item.unit || "kg",
          price:          item.price,
          subtotal:       item.subtotal,
          totalPrice:     item.subtotal,
          totalAmount:    o.totalAmount,
          status:         o.status,        // <-- live from Order document
          // Farmer who owns the crop
          farmerName:     item.farmer?.name  || "Farmer",
          farmerEmail:    item.farmer?.email || "",
          // Full delivery address object (let frontend format it)
          deliveryAddress: o.deliveryAddress,
          paymentMethod:  o.paymentMethod,
          createdAt:      o.createdAt,
        });
      });
    });

    return res.status(200).json({ success: true, orders: sellerOrders });
  } catch (error) {
    console.error("Seller orders error:", error);
    return res.status(500).json({ success: false, message: "Unable to load seller orders" });
  }
};

// ==========================================
// GET BUYER ORDERS
// GET /api/orders/buyer
// ==========================================
const getBuyerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate("items.farmer", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Buyer orders error:", error);
    return res.status(500).json({ success: false, message: "Unable to load orders" });
  }
};

// ==========================================
// CREATE ORDER (Buyer checkout)
// POST /api/orders
// ==========================================
const createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod, notes } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Your cart is empty" });
    }

    if (!deliveryAddress || !deliveryAddress.name || !deliveryAddress.phone ||
        !deliveryAddress.address || !deliveryAddress.city ||
        !deliveryAddress.state || !deliveryAddress.pincode) {
      return res.status(400).json({ success: false, message: "Complete delivery address required" });
    }

    const { Types } = require("mongoose");
    const Crop = require("../models/Crop");
    const orderItems = [];
    let totalAmount = 0;

    // ── Phase 1: Validate ALL items before touching the database ──
    for (const item of items) {
      const rawId = item.cropId || item._id;

      if (!rawId || !Types.ObjectId.isValid(rawId)) {
        return res.status(400).json({
          success: false,
          message: `Outdated item found in cart ("${rawId || 'unknown'}"). Please clear your cart and re-add products from the Browse page.`,
        });
      }

      const crop = await Crop.findById(rawId);
      if (!crop) {
        return res.status(404).json({
          success: false,
          message: `Product "${item.name || rawId}" is no longer available.`,
        });
      }

      // Crop must be available for purchase (listed OR ready-to-sell)
      if (!["listed", "ready"].includes(crop.status)) {
        return res.status(409).json({
          success: false,
          message: `"${crop.name}" is not available for purchase (status: ${crop.status}).`,
        });
      }

      // Farmer reference must exist on the crop document
      if (!crop.farmer) {
        return res.status(404).json({
          success: false,
          message: `"${crop.name}" has no associated farmer. Cannot place order.`,
        });
      }

      const qty = Math.max(1, Number(item.qty || item.quantity || 1));

      // Oversell guard — check available stock
      if (qty > crop.quantity) {
        return res.status(409).json({
          success: false,
          message: `Only ${crop.quantity} ${crop.unit} of "${crop.name}" available. You requested ${qty}.`,
        });
      }

      const price    = Number(crop.price || 0);  // always use DB price
      const subtotal = qty * price;
      totalAmount   += subtotal;

      orderItems.push({
        crop:     crop._id,
        farmer:   crop.farmer,           // strictly from DB — buyer cannot override
        cropName: crop.name || "Crop Item",
        quantity: qty,
        unit:     crop.unit || "kg",
        price,
        subtotal,
        _cropRef: crop,                  // temp ref for stock deduction (not saved)
      });
    }

    // ── Phase 2: Create the order ──
    const savedItems = orderItems.map(({ _cropRef, ...rest }) => rest); // strip temp ref

    const order = await Order.create({
      buyer:           req.user._id,
      items:           savedItems,
      totalAmount,
      deliveryAddress: {
        name:    String(deliveryAddress.name).trim(),
        phone:   String(deliveryAddress.phone).trim(),
        address: String(deliveryAddress.address).trim(),
        city:    String(deliveryAddress.city).trim(),
        state:   String(deliveryAddress.state).trim(),
        pincode: String(deliveryAddress.pincode).trim(),
      },
      paymentMethod:   paymentMethod || "cod",
      notes:           notes || "",
      status:          "pending",
      paymentStatus:   "pending",
    });

    // ── Phase 3: Atomically deduct stock for each crop ──
    for (const oi of orderItems) {
      const crop = oi._cropRef;
      const remaining = crop.quantity - oi.quantity;

      await Crop.findByIdAndUpdate(
        crop._id,
        {
          $inc: { quantity: -oi.quantity },
          ...(remaining <= 0 ? { status: "sold", quantity: 0 } : {}),
        }
      );
    }

    return res.status(201).json({ success: true, message: "Order placed successfully", order });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(400).json({ success: false, message: error.message || "Failed to place order. Please try again." });
  }
};


module.exports = {
  getFarmerOrders,
  getFarmerOrderById,
  updateFarmerOrderStatus,
  createTestOrder,
  getFarmerIncome,
  getFarmerDashboardStats,
  getSellerOrders,
  getBuyerOrders,
  createOrder,
};