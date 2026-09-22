const axios = require("axios");
const { GoogleGenAI } = require("@google/genai");
const env = require("../../config/env");

async function chatCompletionWithOpenRouter(messages) {
  const apiKey = env.OPENROUTER_API_KEY;
  const model = env.OPENROUTER_MODEL || "deepseek/deepseek-chat";
  const baseUrl = env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is missing in backend/.env");
  }

  try {
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model,
        messages,
        temperature: 0.4,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": env.FRONTEND_URL || "http://localhost:5173",
          "X-Title": "Interactive Learning",
        },
        timeout: 60000,
      }
    );

    const text = response?.data?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error("No content returned from OpenRouter AI response");
    }
    return text;
  } catch (err) {
    if (err.response?.status === 401) {
      throw new Error(
        "OPENROUTER_API_KEY in backend/.env is invalid or expired (HTTP 401: User not found). Please provide a valid OPENROUTER_API_KEY or set AI_PROVIDER=gemini with a GEMINI_API_KEY."
      );
    }
    throw err;
  }
}

async function chatCompletionWithGemini(messages) {
  const apiKey = env.GEMINI_API_KEY;
  const model = env.GEMINI_MODEL || "gemini-2.0-flash";

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in backend/.env");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    let systemInstruction = "";
    const contents = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        systemInstruction = systemInstruction ? `${systemInstruction}\n${msg.content}` : msg.content;
      } else {
        const role = msg.role === "assistant" ? "model" : "user";
        contents.push({
          role,
          parts: [{ text: msg.content }]
        });
      }
    }

    const config = systemInstruction ? { systemInstruction } : {};
    const response = await ai.models.generateContent({
      model,
      contents,
      config
    });

    const text = response?.text;
    if (!text) {
      throw new Error("No text returned from Gemini AI response");
    }
    return text;
  } catch (err) {
    if (err.status === 400 || err.message?.includes("API_KEY_INVALID") || err.message?.includes("API key not valid")) {
      throw new Error(
        "GEMINI_API_KEY in backend/.env is invalid. Please provide a valid GEMINI_API_KEY or OPENROUTER_API_KEY."
      );
    }
    throw err;
  }
}

async function chatCompletion(messages) {
  const provider = (env.AI_PROVIDER || "openrouter").toLowerCase();

  if (provider === "gemini") {
    return await chatCompletionWithGemini(messages);
  }

  // Default provider: openrouter
  if (env.OPENROUTER_API_KEY) {
    try {
      return await chatCompletionWithOpenRouter(messages);
    } catch (err) {
      if (env.GEMINI_API_KEY) {
        console.warn("OpenRouter request failed, falling back to Gemini:", err.message);
        return await chatCompletionWithGemini(messages);
      }
      throw err;
    }
  }

  if (env.GEMINI_API_KEY) {
    return await chatCompletionWithGemini(messages);
  }

  throw new Error(
    "No AI API key found. Please set OPENROUTER_API_KEY or GEMINI_API_KEY in backend/.env"
  );
}

module.exports = {
  chatCompletion,
};
