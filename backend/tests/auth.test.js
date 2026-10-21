/**
 * tests/auth.test.js
 *
 * Tests: Registration, Login, JWT, Role-based access, Admin registration block
 *
 * Strategy:
 *  - Uses supertest to make real HTTP requests through the Express app
 *  - Mocks mongoose entirely (no live DB, no Atlas connection required)
 *  - Mocks bcryptjs for deterministic hash comparison
 *  - Mocks jsonwebtoken for deterministic tokens
 *  - Uses jest.resetAllMocks() between tests for isolation
 */

"use strict";

jest.mock("../config/db", () => jest.fn().mockResolvedValue(undefined));
jest.mock("mongoose", () => {
  const m = jest.requireActual("mongoose");
  m.connect = jest.fn().mockResolvedValue(true);
  m.connection = { readyState: 1, host: "mock-atlas" };
  return m;
});
jest.mock("../models/User");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

const request  = require("supertest");
const app      = require("../app");
const User     = require("../models/User");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");

// ── Shared mock user factory ────────────────────────────────────────────────
const mockUser = (overrides = {}) => ({
  _id: "user_id_123",
  name: "Test Farmer",
  email: "farmer@test.com",
  password: "$hashed$",
  role: "farmer",
  isActive: true,
  isEmailVerified: true,
  profileCompleted: true,
  lastLogin: null,
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  // Default: genSalt → "salt", hash → "$hashed$"
  bcrypt.genSalt  = jest.fn().mockResolvedValue("salt");
  bcrypt.hash     = jest.fn().mockResolvedValue("$hashed$");
  bcrypt.compare  = jest.fn().mockResolvedValue(true);
  jwt.sign        = jest.fn().mockReturnValue("mock.jwt.token");
  jwt.verify      = jest.fn().mockReturnValue({ userId: "user_id_123", role: "farmer" });
});

// ════════════════════════════════════════════════════════════════════════════
// REGISTRATION TESTS
// ════════════════════════════════════════════════════════════════════════════
describe("POST /api/auth/register", () => {
  test("201 — valid farmer registration", async () => {
    User.findOne = jest.fn().mockResolvedValue(null);
    User.create  = jest.fn().mockResolvedValue(mockUser());

    const res = await request(app).post("/api/auth/register").send({
      name: "Test Farmer",
      email: "farmer@test.com",
      password: "password123",
      confirmPassword: "password123",
      role: "farmer",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe("farmer");
    // Password must NOT be in the response
    expect(res.body.user.password).toBeUndefined();
  });

  test("201 — buyer (user) role registration", async () => {
    User.findOne = jest.fn().mockResolvedValue(null);
    User.create  = jest.fn().mockResolvedValue(mockUser({ role: "user" }));

    const res = await request(app).post("/api/auth/register").send({
      name: "Buyer User",
      email: "buyer@test.com",
      password: "password123",
      role: "user",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("user");
  });

  test("201 — exporter role registration", async () => {
    User.findOne = jest.fn().mockResolvedValue(null);
    User.create  = jest.fn().mockResolvedValue(mockUser({ role: "exporter" }));

    const res = await request(app).post("/api/auth/register").send({
      name: "Exporter",
      email: "exporter@test.com",
      password: "password123",
      role: "exporter",
    });

    expect(res.status).toBe(201);
  });

  test("403 — admin role registration blocked", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Hacker",
      email: "admin@test.com",
      password: "password123",
      role: "admin",
    });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    // User.create must NEVER be called
    expect(User.create).not.toHaveBeenCalled();
  });

  test("400 — invalid role rejected", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Bad Actor",
      email: "bad@test.com",
      password: "password123",
      role: "superuser",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("400 — duplicate email", async () => {
    User.findOne = jest.fn().mockResolvedValue(mockUser());

    const res = await request(app).post("/api/auth/register").send({
      name: "Dupe",
      email: "farmer@test.com",
      password: "password123",
      role: "farmer",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("400 — missing required fields", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "no-name@test.com",
      password: "password123",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("400 — password too short (< 8 chars)", async () => {
    User.findOne = jest.fn().mockResolvedValue(null);

    const res = await request(app).post("/api/auth/register").send({
      name: "Short Pass",
      email: "short@test.com",
      password: "abc",
      role: "farmer",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("400 — password mismatch", async () => {
    User.findOne = jest.fn().mockResolvedValue(null);

    const res = await request(app).post("/api/auth/register").send({
      name: "Mismatch",
      email: "mismatch@test.com",
      password: "password123",
      confirmPassword: "differentpass",
      role: "farmer",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("400 — invalid email format", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Bad Email",
      email: "not-an-email",
      password: "password123",
      role: "farmer",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// LOGIN TESTS
// ════════════════════════════════════════════════════════════════════════════
describe("POST /api/auth/login", () => {
  test("200 — valid credentials return token", async () => {
    User.findOne = jest.fn().mockResolvedValue(mockUser());
    bcrypt.compare = jest.fn().mockResolvedValue(true);

    const res = await request(app).post("/api/auth/login").send({
      email: "farmer@test.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBe("mock.jwt.token");
    expect(res.body.user.role).toBe("farmer");
    // Secret must NOT be in the response
    expect(res.body.user.password).toBeUndefined();
  });

  test("401 — wrong password", async () => {
    User.findOne  = jest.fn().mockResolvedValue(mockUser());
    bcrypt.compare = jest.fn().mockResolvedValue(false);

    const res = await request(app).post("/api/auth/login").send({
      email: "farmer@test.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("401 — non-existent user (no user enumeration)", async () => {
    User.findOne = jest.fn().mockResolvedValue(null);

    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@test.com",
      password: "password123",
    });

    expect(res.status).toBe(401);
    // Must return same generic message as wrong password (no enumeration)
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  test("403 — inactive account", async () => {
    User.findOne = jest.fn().mockResolvedValue(mockUser({ isActive: false }));

    const res = await request(app).post("/api/auth/login").send({
      email: "farmer@test.com",
      password: "password123",
    });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test("400 — missing email and password", async () => {
    const res = await request(app).post("/api/auth/login").send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// JWT / PROTECTED ROUTE TESTS
// ════════════════════════════════════════════════════════════════════════════
describe("GET /api/auth/me", () => {
  test("200 — valid token returns user (no password)", async () => {
    jwt.verify   = jest.fn().mockReturnValue({ userId: "user_id_123" });
    User.findById = jest.fn().mockResolvedValue(mockUser());

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer mock.jwt.token");

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("farmer@test.com");
    expect(res.body.user.password).toBeUndefined();
  });

  test("401 — no token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  test("401 — expired/invalid token", async () => {
    jwt.verify = jest.fn().mockImplementation(() => {
      throw new Error("jwt expired");
    });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer expired.token.here");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("401 — malformed Authorization header", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "NotBearer token");

    expect(res.status).toBe(401);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// ROLE-BASED ACCESS CONTROL TESTS
// ════════════════════════════════════════════════════════════════════════════
describe("Admin-only routes", () => {
  test("403 — non-admin accessing /api/admin/stats", async () => {
    jwt.verify    = jest.fn().mockReturnValue({ userId: "u1", role: "farmer" });
    User.findById = jest.fn().mockResolvedValue(mockUser({ role: "farmer" }));

    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", "Bearer valid.token");

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test("401 — unauthenticated accessing /api/admin/stats", async () => {
    const res = await request(app).get("/api/admin/stats");
    expect(res.status).toBe(401);
  });

  test("403 — buyer role cannot access admin user management", async () => {
    jwt.verify    = jest.fn().mockReturnValue({ userId: "u1", role: "user" });
    User.findById = jest.fn().mockResolvedValue(mockUser({ role: "user" }));

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(403);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ════════════════════════════════════════════════════════════════════════════
describe("GET /api/health", () => {
  test("200 — health check returns healthy status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe("healthy");
  });
});
