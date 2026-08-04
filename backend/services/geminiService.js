const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ==========================================
// RETRY HELPER
// Retries temporary Gemini 429 / 503 errors
// ==========================================

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const generateWithRetry = async (
  request,
  maxAttempts = 3
) => {
  let lastError;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    try {
      return await ai.models.generateContent(
        request
      );
    } catch (error) {
      lastError = error;

      const status =
        error.status ||
        error?.error?.code;

      const retryable =
        status === 429 ||
        status === 503;

      // Do not retry permanent errors
      if (
        !retryable ||
        attempt === maxAttempts
      ) {
        throw error;
      }

      // 1st retry = 2 sec
      // 2nd retry = 4 sec
      const delay = attempt * 2000;

      console.log(
        `Gemini temporary error (${status}). ` +
        `Retrying in ${delay / 1000}s... ` +
        `Attempt ${attempt + 1}/${maxAttempts}`
      );

      await sleep(delay);
    }
  }

  throw lastError;
};

// ==========================================
// ANALYZE CROP IMAGE
// ==========================================

const analyzeCropImage = async ({
  imageBuffer,
  mimeType,
  cropName,
  symptoms,
}) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "Gemini API key is not configured"
    );
  }

  const prompt = `
You are an AI crop health assistant for AgroConnect 360.

Analyze the uploaded crop or leaf image.

Crop reported by farmer:
${cropName}

Farmer-reported symptoms:
${symptoms || "No symptoms provided"}

Your task:
1. Determine whether the image appears to contain a plant/crop.
2. Determine whether the plant appears healthy or shows signs of disease.
3. If disease symptoms are visible, identify the most likely disease.
4. Give a cautious confidence score from 0 to 100.
5. Classify severity as low, medium, high, critical, or unknown.
6. Briefly describe the visible signs.
7. Give possible causes.
8. Give practical treatment suggestions.
9. Give prevention recommendations.

Important:
- Do not claim certainty from an image alone.
- If the image is unclear or does not contain a plant, return "Unable to determine" as the disease and confidence 0.
- Do not invent visible symptoms.
- Treatment should be general agricultural guidance.
`;

  const response =
    await generateWithRetry({
      model: "gemini-3-flash-preview",

      contents: [
        {
          role: "user",

          parts: [
            {
              text: prompt,
            },

            {
              inlineData: {
                mimeType:
                  mimeType || "image/jpeg",

                data:
                  imageBuffer.toString(
                    "base64"
                  ),
              },
            },
          ],
        },
      ],

      config: {
        responseMimeType:
          "application/json",

        responseJsonSchema: {
          type: "object",

          properties: {
            disease: {
              type: "string",
            },

            confidence: {
              type: "number",
              minimum: 0,
              maximum: 100,
            },

            severity: {
              type: "string",
              enum: [
                "low",
                "medium",
                "high",
                "critical",
                "unknown",
              ],
            },

            description: {
              type: "string",
            },

            causes: {
              type: "array",
              items: {
                type: "string",
              },
            },

            treatment: {
              type: "array",
              items: {
                type: "string",
              },
            },

            prevention: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },

          required: [
            "disease",
            "confidence",
            "severity",
            "description",
            "causes",
            "treatment",
            "prevention",
          ],
        },
      },
    });

  if (!response.text) {
    throw new Error(
      "Gemini returned an empty response"
    );
  }

  try {
    return JSON.parse(response.text);
  } catch (error) {
    console.error(
      "Invalid Gemini JSON:",
      response.text
    );

    throw new Error(
      "Gemini returned an invalid diagnosis response"
    );
  }
};

module.exports = {
  analyzeCropImage,
};