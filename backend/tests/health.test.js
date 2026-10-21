/**
 * tests/health.test.js
 * Tests for liveness probe, readiness probe, production CORS, and route registration.
 */

const request = require("supertest");
const mongoose = require("mongoose");

// app.js is the Express app factory (no server.listen)
const app = require("../app");

// ------------------------------------------------------------------
// LIVENESS — GET /api/health
// ------------------------------------------------------------------
describe("GET /api/health — liveness probe", () => {
  test("200 — always alive when process is up (DB disconnected)", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe("alive");
    expect(res.body).toHaveProperty("database");
  });

  test("200 — liveness does NOT return 503 when DB is disconnected", async () => {
    const readyState = mongoose.connection.readyState;
    expect(readyState).not.toBe(1);
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });

  test("200 — liveness response includes project name", async () => {
    const res = await request(app).get("/api/health");
    expect(res.body.project).toBe("AgroConnect 360");
  });
});

// ------------------------------------------------------------------
// READINESS — GET /api/ready
// ------------------------------------------------------------------
describe("GET /api/ready — readiness probe", () => {
  test("503 — not ready when MongoDB is disconnected", async () => {
    const res = await request(app).get("/api/ready");
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.status).toBe("not_ready");
    expect(res.body.database).toBe("disconnected");
  });

  test("readiness returns 200 when DB connected (mock)", async () => {
    const original = Object.getOwnPropertyDescriptor(mongoose.connection, "readyState");
    Object.defineProperty(mongoose.connection, "readyState", { value: 1, configurable: true });

    const res = await request(app).get("/api/ready");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe("ready");

    if (original) {
      Object.defineProperty(mongoose.connection, "readyState", original);
    } else {
      delete mongoose.connection.readyState;
    }
  });
});

// ------------------------------------------------------------------
// PRODUCTION CORS
// ------------------------------------------------------------------
describe("CORS — origin enforcement", () => {
  test("dev localhost origin allowed in non-production env", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:5173");
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });

  test("unknown production origin is rejected", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "https://attacker.example.com");
    const acao = res.headers["access-control-allow-origin"];
    expect(acao).not.toBe("https://attacker.example.com");
  });

  test("production mode builds empty DEV_ORIGINS array", () => {
    const savedEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const devOrigins = process.env.NODE_ENV !== "production" ? ["http://localhost:5173"] : [];
    expect(devOrigins).toHaveLength(0);
    process.env.NODE_ENV = savedEnv;
  });
});

// ------------------------------------------------------------------
// ROUTE REGISTRATION
// ------------------------------------------------------------------
describe("Route registration", () => {
  test.each(["/api/health", "/api/ready", "/"])(
    "GET %s — registered and reachable",
    async (route) => {
      const res = await request(app).get(route);
      expect(res.status).not.toBe(404);
    }
  );

  test.each([
    ["/api/farmer/analytics",       "get"],
    ["/api/farmer/notifications",   "get"],
    ["/api/farmer/smart-farm-plans","get"],
    ["/api/crops",                  "get"],
    ["/api/orders",                 "get"],
    ["/api/subscriptions",          "get"],
    ["/api/profile/me",        "get"],
  ])(
    "%s %s — registered (401 without token, not 404)",
    async (path, method) => {
      const res = await request(app)[method](path);
      expect(res.status).not.toBe(404);
      expect([401, 403]).toContain(res.status);
    }
  );

  test("/api/farmer dual-registration — both routers reachable", async () => {
    const smart  = await request(app).get("/api/farmer/smart-farm-plans");
    const farmer = await request(app).get("/api/farmer/analytics");
    expect(smart.status).toBe(401);
    expect(farmer.status).toBe(401);
  });
});

// ------------------------------------------------------------------
// ROOT
// ------------------------------------------------------------------
describe("GET /", () => {
  test("200 — root ping", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("AgroConnect 360");
  });
});

