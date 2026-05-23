import api from "./api";

function withForce(url, forceRefresh = false) {
  return forceRefresh ? `${url}?forceRefresh=true` : url;
}

export async function generateSummary(videoId, forceRefresh = false) {
  const { data } = await api.post(withForce(`/ai/summary/${videoId}`, forceRefresh));
  return data;
}

export async function generateFlashcards(videoId, count = 8, forceRefresh = false) {
  const { data } = await api.post(
    withForce(`/ai/flashcards/${videoId}`, forceRefresh),
    { count }
  );
  return data;
}

export async function generateQuiz(videoId, count = 10, forceRefresh = false) {
  const { data } = await api.post(
    withForce(`/ai/quiz/${videoId}`, forceRefresh),
    { count }
  );
  return data;
}

export async function askAi(videoId, question) {
  const { data } = await api.post(`/ai/ask/${videoId}`, {
    question,
    message: question,
  });
  return data;
}

export async function chatWithAi(videoId, question) {
  const { data } = await api.post(`/ai/chat/${videoId}`, {
    question,
    message: question,
  });
  return data;
}

export async function saveQuizAttempt({ youtubeId, title, answers }) {
  const { data } = await api.post(`/ai/quiz-attempt`, {
    youtubeId,
    title,
    answers,
  });
  return data;
}

export async function getQuizAttempts(youtubeId) {
  const { data } = await api.get(`/ai/quiz-attempts/${youtubeId}`);
  return data;
}

export async function getAllQuizAttempts() {
  const { data } = await api.get(`/ai/quiz-attempts`);
  return data;
}

export async function solveAssignment({ file, instructions }) {
  const formData = new FormData();

  if (file) {
    formData.append("assignment", file);
  }

  if (instructions) {
    formData.append("instructions", instructions);
  }

  const { data } = await api.post("/ai/solve-assignment", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}
