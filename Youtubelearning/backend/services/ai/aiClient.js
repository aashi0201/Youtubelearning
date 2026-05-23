const axios = require("axios");
const env = require("../../config/env");

const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = env.OPENROUTER_MODEL;
const OPENROUTER_BASE_URL = env.OPENROUTER_BASE_URL;

async function chatCompletion(messages) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is missing in .env");
  }

  const response = await axios.post(
    `${OPENROUTER_BASE_URL}/chat/completions`,
    {
      model: OPENROUTER_MODEL,
      messages,
      temperature: 0.4,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Interactive Learning",
      },
      timeout: 60000,
    }
  );

  const text = response?.data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("No AI response content returned");
  }

  return text;
}

module.exports = {
  chatCompletion,
};
