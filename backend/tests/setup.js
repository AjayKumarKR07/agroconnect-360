/**
 * tests/setup.js — Jest global setup
 *
 * Runs before every test file (configured via jest.setup in package.json).
 * Sets test env vars and mocks SDK clients that throw at init time when
 * API keys are absent, so tests can import app.js without crashing.
 */

"use strict";

// Set placeholder env vars used by SDK constructors at require-time
process.env.NODE_ENV             = "test";
process.env.JWT_SECRET           = "test-jwt-secret-for-tests-only";
process.env.GROQ_API_KEY         = "test-groq-key";          // keeps lazy guards happy
process.env.GEMINI_API_KEY       = "test-gemini-key";
process.env.RAZORPAY_KEY_ID      = "test_razorpay_key_id";
process.env.RAZORPAY_KEY_SECRET  = "test_razorpay_key_secret";
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY   = "test-cloud-key";
process.env.CLOUDINARY_API_SECRET = "test-cloud-secret";
