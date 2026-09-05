const aiService = require("../services/aiService");
const QuizAttempt = require("../models/QuizAttempt");

function tryParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

async function getSummary(req, res, next) {
  try {
    const { text } = req.body || {};

    if (!text || !String(text).trim()) {
      return res.status(400).json({
        ok: false,
        error: "text is required"
      });
    }

    const output = await aiService.generateSummary(text);

    return res.status(200).json({
      ok: true,
      provider: output.provider,
      fallbackUsed: output.fallbackUsed,
      summary: output.result,
      originalError: output.originalError || null
    });
  } catch (error) {
    next(error);
  }
}

async function generateQuiz(req, res, next) {
  try {
    const { text } = req.body || {};

    if (!text || !String(text).trim()) {
      return res.status(400).json({
        ok: false,
        error: "text is required"
      });
    }

    const output = await aiService.generateQuiz(text);
    const parsedQuiz = tryParseJson(output.result);

    return res.status(200).json({
      ok: true,
      provider: output.provider,
      fallbackUsed: output.fallbackUsed,
      raw: output.result,
      quiz: parsedQuiz || output.result,
      originalError: output.originalError || null
    });
  } catch (error) {
    next(error);
  }
}

async function askDoubt(req, res, next) {
  try {
    const { question, context = "" } = req.body || {};

    if (!question || !String(question).trim()) {
      return res.status(400).json({
        ok: false,
        error: "question is required"
      });
    }

    const output = await aiService.answerDoubt(question, context);

    return res.status(200).json({
      ok: true,
      provider: output.provider,
      fallbackUsed: output.fallbackUsed,
      answer: output.result,
      originalError: output.originalError || null
    });
  } catch (error) {
    next(error);
  }
}

async function getNotes(req, res, next) {
  try {
    const { text } = req.body || {};

    if (!text || !String(text).trim()) {
      return res.status(400).json({
        ok: false,
        error: "text is required"
      });
    }

    const output = await aiService.generateNotes(text);

    return res.status(200).json({
      ok: true,
      provider: output.provider,
      fallbackUsed: output.fallbackUsed,
      notes: output.result,
      originalError: output.originalError || null
    });
  } catch (error) {
    next(error);
  }
}

async function submitQuiz(req, res, next) {
  try {
    const {
      title = "AI Quiz Attempt",
      sourceType = "ai",
      questions = [],
      submittedAnswers = [],
      video = null,
      playlist = null
    } = req.body || {};

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "questions array is required"
      });
    }

    const answers = questions.map((question, index) => {
      const selectedAnswer = String(submittedAnswers[index] || "").trim();
      const correctAnswer = String(question.answer || "").trim();
      const options = Array.isArray(question.options) ? question.options : [];

      return {
        question: String(question.question || ""),
        options,
        selectedAnswer,
        correctAnswer,
        isCorrect: selectedAnswer === correctAnswer,
        explanation: ""
      };
    });

    const totalQuestions = answers.length;
    const correctAnswers = answers.filter((item) => item.isCorrect).length;
    const scorePercent = totalQuestions
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : 0;

    const attempt = await QuizAttempt.create({
      user: req.user._id,
      video,
      playlist,
      title,
      sourceType,
      answers,
      totalQuestions,
      correctAnswers,
      scorePercent,
      passed: scorePercent >= 70
    });

    return res.status(201).json({
      ok: true,
      message: "Quiz submitted successfully",
      attempt
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSummary,
  generateQuiz,
  askDoubt,
  getNotes,
  submitQuiz
};