const Groq = require("groq-sdk");

// ==========================================
// GROQ CLIENT (for disease diagnosis)
// ==========================================
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ==========================================
// RETRY HELPER
// ==========================================
const callWithRetry = async (fn, maxAttempts = 2) => {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const status = error.status || error?.error?.code;
      if ((status === 429 || status === 503) && attempt < maxAttempts) {
        const delay = attempt * 3000;
        console.log(`[Groq] Temporary error (${status}). Retrying in ${delay / 1000}s...`);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
  throw lastError;
};

// ==========================================
// VISION MODELS (image + text)
// ==========================================
const VISION_MODELS = [
  "llama-4-scout-17b-16e-instruct",
  "llama-4-maverick-17b-128e-instruct",
];

// ==========================================
// TEXT MODELS (symptom-based fallback)
// ==========================================
const TEXT_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

// JSON schema description for prompt
const JSON_SCHEMA = `{
  "disease": "string — disease name or 'Healthy' or 'Unable to determine'",
  "confidence": number (0-100),
  "severity": "low" | "medium" | "high" | "critical" | "unknown",
  "description": "string — brief description of the condition",
  "causes": ["string", ...],
  "treatment": ["string", ...],
  "prevention": ["string", ...]
}`;

// ==========================================
// ANALYZE CROP IMAGE
// Strategy: Try vision → fall back to text
// ==========================================
const analyzeCropImage = async ({
  imageBuffer,
  mimeType,
  cropName,
  symptoms,
}) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Groq API key is not configured");
  }

  const symptomText = symptoms || "No symptoms described";

  // ── STEP 1: Try vision models (image + text) ──────────────────
  const base64Image = imageBuffer.toString("base64");
  const imageMime = mimeType || "image/jpeg";
  const dataUrl = `data:${imageMime};base64,${base64Image}`;

  const visionPrompt = `You are an expert agricultural plant pathologist AI for AgroConnect 360, India.

Analyze the uploaded crop/leaf image carefully.

Crop: ${cropName}
Farmer-reported symptoms: ${symptomText}

Provide a diagnosis. Respond ONLY with valid JSON matching this schema:
${JSON_SCHEMA}

Rules:
- If image shows a healthy plant → disease = "Healthy", confidence = 85-95, severity = "low"
- If image is unclear/not a plant → disease = "Unable to determine", confidence = 0, severity = "unknown"
- Be practical: suggest Indian-market treatments and prevention methods
- Do not invent symptoms not visible in the image`;

  for (const model of VISION_MODELS) {
    try {
      console.log(`[Groq vision] Trying model: ${model}`);
      const response = await callWithRetry(() =>
        groq.chat.completions.create({
          model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: visionPrompt },
                {
                  type: "image_url",
                  image_url: { url: dataUrl },
                },
              ],
            },
          ],
          max_tokens: 1024,
          temperature: 0.3,
        })
      );

      const text = response?.choices?.[0]?.message?.content;
      if (text) {
        console.log(`[Groq vision] Success with model: ${model}`);
        return parseJsonResponse(text);
      }
    } catch (err) {
      const status = err.status || err?.error?.code;
      console.warn(`[Groq vision] Model ${model} failed (${status}) — trying next...`);
    }
  }

  // ── STEP 2: Text fallback — symptom-based diagnosis ──────────
  console.log("[Groq] Vision models unavailable. Using symptom-based text diagnosis...");

  const textPrompt = `You are an expert agricultural plant pathologist AI for AgroConnect 360, India.

A farmer has uploaded a crop image but the image analysis service is unavailable.
Based on the crop type and described symptoms, provide your best expert diagnosis.

Crop: ${cropName}
Symptoms described by farmer: ${symptomText}

Analyze these symptoms and diagnose the most likely disease or condition.
Respond ONLY with valid JSON matching this schema:
${JSON_SCHEMA}

Rules:
- Base your diagnosis on the crop type + symptoms described
- Consider common diseases for this crop in Indian agricultural conditions
- If symptoms are vague → use moderate confidence (40-60)
- Be practical: suggest Indian-market treatments (e.g., Mancozeb, Carbendazim, Neem oil)
- Note in description that diagnosis is based on symptoms, not image`;

  for (const model of TEXT_MODELS) {
    try {
      console.log(`[Groq text] Trying model: ${model}`);
      const response = await callWithRetry(() =>
        groq.chat.completions.create({
          model,
          messages: [
            { role: "system", content: "You are an expert agricultural plant pathologist. Always respond with valid JSON only." },
            { role: "user", content: textPrompt },
          ],
          max_tokens: 1024,
          temperature: 0.4,
          response_format: { type: "json_object" },
        })
      );

      const text = response?.choices?.[0]?.message?.content;
      if (text) {
        console.log(`[Groq text] Success with model: ${model}`);
        return parseJsonResponse(text);
      }
    } catch (err) {
      const status = err.status || err?.error?.code;
      console.warn(`[Groq text] Model ${model} failed (${status}) — trying next...`);
    }
  }

  // ── STEP 3: Last resort — structured fallback ─────────────────
  console.error("[Groq] All models failed. Returning generic response.");
  return {
    disease: "Unable to determine",
    confidence: 0,
    severity: "unknown",
    description: `Unable to analyze the image at this time. For crop: ${cropName} with symptoms: ${symptomText} — please consult your local KVK (Krishi Vigyan Kendra) for an accurate diagnosis.`,
    causes: ["Analysis service temporarily unavailable"],
    treatment: [
      "Consult your local KVK (Krishi Vigyan Kendra)",
      "Contact the agriculture department helpline: 1800-180-1551",
    ],
    prevention: [
      "Monitor crop regularly for early signs of disease",
      "Maintain proper field hygiene and crop rotation",
    ],
  };
};

// ==========================================
// PARSE JSON FROM MODEL RESPONSE
// Handles markdown code blocks too
// ==========================================
const parseJsonResponse = (text) => {
  let jsonText = text.trim();

  // Strip markdown code blocks
  const fenced = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) jsonText = fenced[1].trim();

  // Extract first JSON object
  const start = jsonText.indexOf("{");
  const end = jsonText.lastIndexOf("}");
  if (start !== -1 && end !== -1) {
    jsonText = jsonText.slice(start, end + 1);
  }

  try {
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("[Groq] JSON parse error:", jsonText.slice(0, 200));
    throw new Error("AI returned an invalid diagnosis response");
  }
};

module.exports = {
  analyzeCropImage,
};