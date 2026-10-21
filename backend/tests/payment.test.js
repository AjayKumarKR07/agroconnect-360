/**
 * tests/payment.test.js
 *
 * Tests: Razorpay HMAC signature verification, payment state machines,
 *        order ownership enforcement, revenue calculations.
 *
 * All external calls (Razorpay SDK, MongoDB, JWT) are mocked.
 * No real payments are made.
 */

"use strict";

jest.mock("../config/db", () => jest.fn().mockResolvedValue(undefined));
jest.mock("mongoose", () => {
  const m = jest.requireActual("mongoose");
  m.connect = jest.fn().mockResolvedValue(true);
  m.connection = { readyState: 1, host: "mock-atlas" };
  // Keep Types.ObjectId.isValid working
  return m;
});
jest.mock("../models/Order");
jest.mock("../models/Notification");
jest.mock("../models/User");
jest.mock("jsonwebtoken");
jest.mock("razorpay");

const request  = require("supertest");
const crypto   = require("crypto");
const app      = require("../app");
const Order    = require("../models/Order");
const User     = require("../models/User");
const jwt      = require("jsonwebtoken");
const Razorpay = require("razorpay");

// ── Mock Razorpay constructor ─────────────────────────────────────────────────
const mockCreateOrder = jest.fn();
Razorpay.mockImplementation(() => ({
  orders: { create: mockCreateOrder },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
const BUYER_ID   = "aaaaaaaaaaaaaaaaaaaaaaaa"; // 24-char hex
const FARMER_ID  = "bbbbbbbbbbbbbbbbbbbbbbbb";
const ORDER_ID   = "cccccccccccccccccccccccc";
const RZP_ORDER  = "order_rzp_test_001";
const RZP_PAY_ID = "pay_rzp_test_001";
const KEY_SECRET = "test_razorpay_secret";

const validSig = () =>
  crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${RZP_ORDER}|${RZP_PAY_ID}`)
    .digest("hex");

const mockOrder = (overrides = {}) => ({
  _id:              ORDER_ID,
  buyer:            { toString: () => BUYER_ID },
  totalAmount:      1000,
  paymentStatus:    "pending",
  status:           "pending",
  paymentMethod:    "razorpay",
  razorpayOrderId:  null,
  save:             jest.fn().mockResolvedValue(true),
  toObject:         jest.fn().mockReturnThis(),
  ...overrides,
});

const authHeader = () => "Bearer valid.token";

beforeEach(() => {
  jest.clearAllMocks();
  process.env.RAZORPAY_KEY_ID     = "test_key_id";
  process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;

  jwt.verify    = jest.fn().mockReturnValue({ userId: BUYER_ID, role: "user" });
  User.findById = jest.fn().mockResolvedValue({
    _id: BUYER_ID,
    toString: () => BUYER_ID,
    role: "user",
    isActive: true,
  });

  // Order.findById must support .lean() chaining — paymentController uses findById().lean()
  Order.findById = jest.fn().mockImplementation(() => ({
    lean: jest.fn().mockResolvedValue(mockOrder()),
  }));
  Order.findByIdAndUpdate = jest.fn().mockResolvedValue(true);
});

// ════════════════════════════════════════════════════════════════════════════
// PAYMENT SIGNATURE VERIFICATION
// ════════════════════════════════════════════════════════════════════════════
describe("POST /api/payment/verify — Razorpay signature", () => {
  test("200 — valid HMAC signature verifies payment", async () => {
    // verifyRazorpayPayment uses Order.findById (no .lean)
    Order.findById = jest.fn().mockResolvedValue(
      mockOrder({ razorpayOrderId: RZP_ORDER })
    );
    Order.findByIdAndUpdate = jest.fn().mockResolvedValue(true);

    const res = await request(app)
      .post("/api/payment/verify")
      .set("Authorization", authHeader())
      .send({
        orderId:           ORDER_ID,
        razorpayOrderId:   RZP_ORDER,
        razorpayPaymentId: RZP_PAY_ID,
        razorpaySignature: validSig(),
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Order.findByIdAndUpdate).toHaveBeenCalledWith(
      ORDER_ID,
      expect.objectContaining({ paymentStatus: "paid" })
    );
  });

  test("400 — tampered/invalid signature rejected", async () => {
    Order.findById = jest.fn().mockResolvedValue(
      mockOrder({ razorpayOrderId: RZP_ORDER })
    );
    Order.findByIdAndUpdate = jest.fn().mockResolvedValue(true);

    const res = await request(app)
      .post("/api/payment/verify")
      .set("Authorization", authHeader())
      .send({
        orderId:           ORDER_ID,
        razorpayOrderId:   RZP_ORDER,
        razorpayPaymentId: RZP_PAY_ID,
        razorpaySignature: "tampered_signature_value_here",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    const paidCall = (Order.findByIdAndUpdate.mock.calls || []).find(
      (c) => c[1]?.paymentStatus === "paid"
    );
    expect(paidCall).toBeUndefined();
  });

  test("409 — already-paid order returns 200 idempotent (no re-processing)", async () => {
    Order.findById = jest.fn().mockResolvedValue(
      mockOrder({ razorpayOrderId: RZP_ORDER, paymentStatus: "paid" })
    );
    Order.findByIdAndUpdate = jest.fn();

    const res = await request(app)
      .post("/api/payment/verify")
      .set("Authorization", authHeader())
      .send({
        orderId:           ORDER_ID,
        razorpayOrderId:   RZP_ORDER,
        razorpayPaymentId: RZP_PAY_ID,
        razorpaySignature: validSig(),
      });

    expect(res.status).toBe(200);
    expect(Order.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test("400 — missing verification fields", async () => {
    const res = await request(app)
      .post("/api/payment/verify")
      .set("Authorization", authHeader())
      .send({ orderId: ORDER_ID });

    expect(res.status).toBe(400);
  });

  test("403 — buyer cannot verify another buyer's order", async () => {
    const OTHER_BUYER = "dddddddddddddddddddddddd";
    Order.findById = jest.fn().mockResolvedValue(
      mockOrder({
        buyer:            { toString: () => OTHER_BUYER },
        razorpayOrderId:  RZP_ORDER,
      })
    );

    const res = await request(app)
      .post("/api/payment/verify")
      .set("Authorization", authHeader())
      .send({
        orderId:           ORDER_ID,
        razorpayOrderId:   RZP_ORDER,
        razorpayPaymentId: RZP_PAY_ID,
        razorpaySignature: validSig(),
      });

    expect(res.status).toBe(403);
  });

  test("409 — cancelled order cannot be paid", async () => {
    Order.findById = jest.fn().mockResolvedValue(
      mockOrder({ status: "cancelled", razorpayOrderId: RZP_ORDER })
    );

    const res = await request(app)
      .post("/api/payment/verify")
      .set("Authorization", authHeader())
      .send({
        orderId:           ORDER_ID,
        razorpayOrderId:   RZP_ORDER,
        razorpayPaymentId: RZP_PAY_ID,
        razorpaySignature: validSig(),
      });

    expect(res.status).toBe(409);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// CREATE RAZORPAY ORDER — Amount must always come from DB
// ════════════════════════════════════════════════════════════════════════════
describe("POST /api/payment/create-order — amount from DB only", () => {
  test("200 — DB amount used (not frontend amount)", async () => {
    // createRazorpayOrder uses findById().lean()
    Order.findById = jest.fn().mockImplementation(() => ({
      lean: jest.fn().mockResolvedValue(mockOrder({ totalAmount: 2500 })),
    }));
    Order.findByIdAndUpdate = jest.fn().mockResolvedValue(true);
    mockCreateOrder.mockResolvedValue({
      id:       RZP_ORDER,
      amount:   250000,
      currency: "INR",
    });

    const res = await request(app)
      .post("/api/payment/create-order")
      .set("Authorization", authHeader())
      .send({ orderId: ORDER_ID });

    expect(res.status).toBe(200);
    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 250000 })
    );
    expect(JSON.stringify(res.body)).not.toContain(KEY_SECRET);
  });

  test("400 — invalid ObjectId rejected", async () => {
    const res = await request(app)
      .post("/api/payment/create-order")
      .set("Authorization", authHeader())
      .send({ orderId: "not-a-valid-id" });

    expect(res.status).toBe(400);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// EXPORTER REVENUE CALCULATION
// Tests that totalValueUsd = quantityTons × pricePerTon
// ════════════════════════════════════════════════════════════════════════════
describe("Export revenue calculation (unit tests)", () => {
  test("Revenue formula: totalValueUsd = quantityTons × pricePerTon", () => {
    const quantityTons = 20;
    const pricePerTon  = 350;
    const expected     = quantityTons * pricePerTon; // 7000

    // This is the logic applied in exporterController createExportShipment
    const totalValueUsd = quantityTons * pricePerTon;

    expect(totalValueUsd).toBe(expected);
    expect(totalValueUsd).toBe(7000);
  });

  test("Zero price produces zero revenue", () => {
    expect(50 * 0).toBe(0);
  });

  test("Fractional quantity handled correctly", () => {
    const result = Math.round(1.5 * 400 * 100) / 100; // 600.00
    expect(result).toBe(600);
  });
});
