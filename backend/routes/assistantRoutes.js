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

// Models to try in order — verified available on this Groq account
const GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
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

// ==========================================
// SELLER SYSTEM PROMPT
// ==========================================
const SELLER_SYSTEM_PROMPT = `You are AgroConnect Seller AI, a specialized business intelligence assistant for agricultural sellers and wholesalers on the AgroConnect 360 platform.

You are an expert in:

PROCUREMENT & SOURCING
- Finding and evaluating the best farmer suppliers for bulk agricultural produce
- Negotiating bulk procurement prices and calculating margins
- Understanding seasonal crop availability calendars for India
- Advising on minimum order quantities, storage requirements, and shelf life

MARKET INTELLIGENCE
- APMC mandi prices, wholesale rates, and commodity price forecasts
- Comparing procurement cost vs. market selling price to identify profitable margins
- Price trends for Kharif and Rabi crops
- Identifying high-demand crops for wholesale resale

INVENTORY & LOGISTICS
- Stock management: reorder points, safety stock, inventory turnover
- Cold chain storage requirements for perishables (fruits, vegetables, dairy)
- Warehousing costs per quintal in major Indian cities
- Freight and transport options: truck, rail, cold truck rates

BUSINESS OPERATIONS
- GST on agricultural products (exemptions, taxable categories)
- FSSAI licensing requirements for food wholesalers
- Basic financial metrics: gross margin, EBITDA, working capital for agri-traders
- Export opportunities for Indian produce via APEDA channels
- Payment terms: LoC, advance, credit cycles for farmer procurement

SELLER PORTAL GUIDANCE
- How to use the AgroConnect Seller Portal (Dashboard, Procurement, Orders, Logistics, Revenue, Analytics pages)
- How to place bulk orders to farmers through the Procurement page
- How to track order status: pending → accepted → shipped → delivered
- Interpreting revenue reports and analytics
- Understanding stock alerts and low-inventory warnings

Rules:
- Use Indian units: kg, quintal (100 kg = 1 quintal), ton, litre
- Use Indian Rupees (₹) for all prices
- Be concise and commercially practical — give numbers, margins, and actionable advice
- If asked about crop prices, give realistic current Indian wholesale market ranges
- For regulatory questions, refer to FSSAI, APEDA, or state APMC acts
- If unsure of exact current prices, give a typical range with a disclaimer to verify at local APMC
- Respond in English by default; if the seller writes in Hindi, respond in Hindi`;

// ==========================================
// POST /api/assistant/seller-chat
// ==========================================
router.post("/seller-chat", protect, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        success: false,
        reply: "AI service not configured. Please add GROQ_API_KEY to .env",
      });
    }

    // Build conversation messages with seller system prompt
    const messages = [{ role: "system", content: SELLER_SYSTEM_PROMPT }];

    // Include recent chat history if provided (max 6 turns)
    if (Array.isArray(history) && history.length > 0) {
      const recent = history.slice(-6);
      recent.forEach((turn) => {
        if (turn.role && turn.content) {
          messages.push({ role: turn.role, content: String(turn.content) });
        }
      });
    }

    messages.push({ role: "user", content: message.trim() });

    let reply = null;
    let lastErr = null;

    for (const model of GROQ_MODELS) {
      try {
        const response = await chatWithRetry({
          model,
          messages,
          max_tokens: 1024,
          temperature: 0.65,
        });

        reply = response.choices?.[0]?.message?.content;
        if (reply) {
          console.log(`[Groq Seller Assistant] Responded using model: ${model}`);
          break;
        }
      } catch (err) {
        lastErr = err;
        const status = err.status || err?.error?.code;
        console.log(`[Groq Seller Assistant] Model ${model} failed (${status}), trying next...`);
        if (status !== 429 && status !== 503) break;
        await sleep(1000);
      }
    }

    if (reply) return res.status(200).json({ success: true, reply });

    const status = lastErr?.status || lastErr?.error?.code;

    if (status === 429) {
      return res.status(200).json({
        success: true,
        reply: "⏳ I'm getting too many requests right now. Please wait 30 seconds and try again. In the meantime, check the Market Trends or Revenue pages for quick insights.",
      });
    }

    if (status === 401) {
      return res.status(200).json({
        success: true,
        reply: "⚠️ AI service authentication failed. Please check the GROQ_API_KEY in your server configuration.",
      });
    }

    return res.status(200).json({
      success: true,
      reply: "I'm having trouble connecting right now. Please try again in a moment.",
    });
  } catch (error) {
    console.error("[Groq Seller Assistant] Unexpected error:", error?.message || error);
    return res.status(200).json({
      success: true,
      reply: "Something went wrong on my end. Please try again shortly.",
    });
  }
});

module.exports = router;
