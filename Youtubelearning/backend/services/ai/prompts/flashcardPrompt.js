function buildFlashcardPrompt({ video, transcriptText, count = 8 }) {
  const videoTitle = video?.title || "";
  const description = video?.description || "";

  const sourceText = transcriptText?.trim()
    ? `Video Transcript:\n${transcriptText}`
    : `Video Title: ${videoTitle}\nVideo Description:\n${description}`;

  return [
    {
      role: "system",
      content:
        "You are an expert AI educator creating high-quality study flashcards for a student. Focus strictly on key concepts, definitions, formulas, terminology, and subject matter taught in the topic. DO NOT create flashcards about video duration, channel name, or description links. Return valid JSON only."
    },
    {
      role: "user",
      content: `
Generate ${count} concept-focused study flashcards for this topic.

Topic / Title: ${videoTitle}

${sourceText}

CRITICAL RULES:
1. Every flashcard MUST focus on a core concept, definition, tool, or skill.
2. DO NOT create flashcards about metadata (e.g. channel name, video length, social media links).

Return ONLY valid JSON in this exact structure:
{
  "cards": [
    {
      "question": "Concept or term to define/explain",
      "answer": "Clear, educational answer"
    }
  ]
}
      `.trim()
    }
  ];
}

module.exports = {
  buildFlashcardPrompt
};