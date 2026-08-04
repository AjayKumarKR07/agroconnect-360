const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Retry on 429/503 — same pattern as geminiService.js
const generateWithRetry = async (params, maxAttempts = 3) => {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      lastError = err;
      const status = err.status || err?.error?.code;
      if ((status === 429 || status === 503) && attempt < maxAttempts) {
        const delay = attempt * 3000; // 3s, 6s
        console.log(`[Assistant] Rate limit (${status}). Retrying in ${delay / 1000}s... (${attempt}/${maxAttempts})`);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
  throw lastError;
};

const SYSTEM_PROMPT = `You are AgroConnect AI, an expert agricultural assistant for Indian farmers.
You help with:
- Crop selection for Kharif, Rabi, Zaid seasons
- Pest and disease identification and Indian-market treatment products
- Fertilizer recommendations (DAP, Urea, NPK, micronutrients)
- Irrigation guidance (drip, sprinkler, flood)
- APMC mandi prices, MSP rates, selling strategies
- Government schemes: PM-KISAN, Fasal Bima, KCC, Soil Health Card
- Organic farming, crop rotation, intercropping

Rules:
- Use Indian units: kg, quintal (100kg), acre, litre
- Use Rupees (₹) for prices
- Be concise and practical: 3-5 sentences unless step-by-step is needed
- If unsure, advise consulting local KVK (Krishi Vigyan Kendra)`;

// Models to try in order (lighter = less rate-limited)
const MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

// POST /api/assistant/chat
router.post("/chat", protect, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, reply: "AI service not configured. Please add GEMINI_API_KEY to .env" });
    }

    const prompt = SYSTEM_PROMPT + "\n\nFarmer's question: " + message.trim();
    let reply = null;
    let lastErr = null;

    // Try each model until one works
    for (const model of MODELS) {
      try {
        const response = await generateWithRetry({
          model,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        reply = response.text;
        if (reply) break;
      } catch (err) {
        lastErr = err;
        const status = err.status || err?.error?.code;
        console.log(`[Assistant] Model ${model} failed (${status}), trying next...`);
        if (status !== 429 && status !== 503) break; // Don't try next model for non-rate-limit errors
        await sleep(1000);
      }
    }

    if (reply) {
      return res.status(200).json({ success: true, reply });
    }

    // All models failed
    const status = lastErr?.status || lastErr?.error?.code;
    if (status === 429) {
      return res.status(200).json({
        success: true,
        reply: "⏳ I'm getting too many requests right now. Please wait 30 seconds and try again. In the meantime, you can check the Weather page or Market Trends for quick farming insights.",
      });
    }

    return res.status(200).json({
      success: true,
      reply: "I'm having trouble connecting right now. Please try again in a moment.",
    });

  } catch (error) {
    console.error("[Assistant] Unexpected error:", error?.message || error);
    return res.status(200).json({
      success: true,
      reply: "Something went wrong on my end. Please try again shortly.",
    });
  }
});

module.exports = router;
