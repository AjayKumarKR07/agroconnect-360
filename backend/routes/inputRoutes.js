const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

// Simple in-memory store (replace with MongoDB model if needed)
const inputOrders = [];

// POST /api/inputs/order — Place a farm inputs order
router.post("/order", protect, async (req, res) => {
  try {
    const { items, totalAmount, delivery, payment } = req.body;

    if (!items || !items.length || !delivery || !delivery.name || !delivery.phone) {
      return res.status(400).json({ success: false, message: "Items and delivery details are required" });
    }

    const orderId = "INP" + Date.now().toString().slice(-6);

    const order = {
      orderId,
      farmer: req.user._id,
      items,
      totalAmount,
      delivery,
      payment,
      status: "confirmed",
      placedAt: new Date(),
    };

    // Push to in-memory store (works for demo; swap with Mongoose model for production)
    inputOrders.push(order);

    console.log(`[Input Order] ${orderId} placed by ${req.user.email} — ₹${totalAmount}`);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId,
      order,
    });
  } catch (error) {
    console.error("Input order error:", error);
    return res.status(500).json({ success: false, message: "Unable to place order" });
  }
});

// GET /api/inputs/orders — Get current farmer's input orders
router.get("/orders", protect, async (req, res) => {
  try {
    const myOrders = inputOrders.filter(
      (o) => o.farmer.toString() === req.user._id.toString()
    );
    return res.status(200).json({ success: true, count: myOrders.length, orders: myOrders });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load orders" });
  }
});

module.exports = router;
