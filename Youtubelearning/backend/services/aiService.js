const geminiProvider = require("./providers/geminiProvider");
const fallbackProvider = require("./providers/fallbackProvider");

const provider = process.env.AI_PROVIDER || "gemini";

function getPrimaryProvider() {
  switch (provider) {
    case "gemini":
      return geminiProvider;
    default:
      return fallbackProvider;
  }
}

function shouldFallback(error) {
  const message = String(error?.message || error || "").toLowerCase();

  return (
    message.includes("quota") ||
    message.includes("resource_exhausted") ||
    message.includes("429") ||
    message.includes("api key") ||
    message.includes("not found") ||
    message.includes("unsupported") ||
    message.includes("deadline") ||
    message.includes("timeout")
  );
}

async function withFallback(methodName, ...args) {
  const primary = getPrimaryProvider();

  try {
    const result = await primary[methodName](...args);
    return {
      provider: provider,
      fallbackUsed: false,
      result
    };
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error;
    }

    const fallbackResult = await fallbackProvider[methodName](...args);

    return {
      provider: "fallback",
      fallbackUsed: true,
      result: fallbackResult,
      originalError: String(error.message || error)
    };
  }
}

async function generateSummary(text) {
  return withFallback("generateSummary", text);
}

async function generateQuiz(text) {
  return withFallback("generateQuiz", text);
}

async function answerDoubt(question, context = "") {
  return withFallback("answerDoubt", question, context);
}

async function generateNotes(text) {
  return withFallback("generateNotes", text);
}

module.exports = {
  generateSummary,
  generateQuiz,
  answerDoubt,
  generateNotes
};