const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const Groq = require("groq-sdk");

const router = express.Router();

// ==========================================
// GROQ CLIENT
// ==========================================
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Retry on 429/503
const chatWithRetry = async (params, maxAttempts = 3) => {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await groq.chat.completions.create(params);
    } catch (err) {
      lastError = err;
      const status = err.status || err?.error?.code;
      if ((status === 429 || status === 503) && attempt < maxAttempts) {
        const delay = attempt * 3000;
        console.log(
          `[Groq Assistant] Rate limit (${status}). Retrying in ${delay / 1000}s... (${attempt}/${maxAttempts})`
        );
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
  throw lastError;
};

// ==========================================
// SYSTEM PROMPT
// ==========================================
const SYSTEM_PROMPT = `You are AgroConnect AI, an expert agricultural assistant for Indian farmers.
You help with:
- Crop selection for Kharif, Rabi, Zaid seasons
- Pest and disease identification and Indian-market treatment products
- Fertilizer recommendations (DAP, Urea, NPK, micronutrients)
- Irrigation guidance (drip, sprinkler, flood)
- APMC mandi prices, MSP rates, selling strategies
- Government schemes: PM-KISAN, Fasal Bima, KCC, Soil Health Card
- Organic farming, crop rotation, intercropping
- Weather-based farming decisions

Rules:
- Use Indian units: kg, quintal (100kg), acre, litre
- Use Rupees (₹) for prices
- Be concise and practical: 3-5 sentences unless step-by-step is needed
- If unsure, advise consulting local KVK (Krishi Vigyan Kendra)
- Respond in English by default, but if the farmer writes in Hindi, respond in Hindi`;

// Models to try in order (faster = less rate-limited)
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
];

// ==========================================
// POST /api/assistant/chat
// ==========================================
router.post("/chat", protect, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Message is required" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        success: false,
        reply: "AI service not configured. Please add GROQ_API_KEY to .env",
      });
    }

    // Build conversation messages
    const messages = [{ role: "system", content: SYSTEM_PROMPT }];

    // Include recent chat history if provided (max 6 turns)
    if (Array.isArray(history) && history.length > 0) {
      const recent = history.slice(-6);
      recent.forEach((turn) => {
        if (turn.role && turn.content) {
          messages.push({ role: turn.role, content: String(turn.content) });
        }
      });
    }

    // Add current message
    messages.push({ role: "user", content: message.trim() });

    let reply = null;
    let lastErr = null;

    // Try each model until one works
    for (const model of GROQ_MODELS) {
      try {
        const response = await chatWithRetry({
          model,
          messages,
          max_tokens: 1024,
          temperature: 0.7,
        });

        reply = response.choices?.[0]?.message?.content;
        if (reply) {
          console.log(`[Groq Assistant] Responded using model: ${model}`);
          break;
        }
      } catch (err) {
        lastErr = err;
        const status = err.status || err?.error?.code;
        console.log(
          `[Groq Assistant] Model ${model} failed (${status}), trying next...`
        );
        if (status !== 429 && status !== 503) break;
        await sleep(1000);
      }
    }

    if (reply) {
      return res.status(200).json({ success: true, reply });
    }

    // All models failed — check error type
    const status = lastErr?.status || lastErr?.error?.code;

    if (status === 429) {
      return res.status(200).json({
        success: true,
        reply:
          "⏳ I'm getting too many requests right now. Please wait 30 seconds and try again. In the meantime, check the Weather page or Market Trends for quick insights.",
      });
    }

    if (status === 401) {
      console.error("[Groq] Invalid API key");
      return res.status(200).json({
        success: true,
        reply:
          "⚠️ AI service authentication failed. Please check the GROQ_API_KEY in your server configuration.",
      });
    }

    return res.status(200).json({
      success: true,
      reply:
        "I'm having trouble connecting right now. Please try again in a moment.",
    });
  } catch (error) {
    console.error("[Groq Assistant] Unexpected error:", error?.message || error);
    return res.status(200).json({
      success: true,
      reply: "Something went wrong on my end. Please try again shortly.",
    });
  }
});

module.exports = router;
