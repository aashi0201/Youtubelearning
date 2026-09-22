function buildQuizPrompt({ video, transcriptText, count = 5 }) {
  const videoTitle = video?.title || "";
  const description = video?.description || "";

  const sourceText = transcriptText?.trim()
    ? `Video Transcript:\n${transcriptText}`
    : `Video Title: ${videoTitle}\nVideo Description:\n${description}`;

  return [
    {
      role: "system",
      content:
        "You are an expert AI educator creating a high-quality quiz for a student. Focus strictly on testing key concepts, technical knowledge, formulas, terminology, skills, and subject matter taught in the video topic. DO NOT create meta-questions about video duration, channel name, YouTube UI, or links in the description. Return valid JSON only."
    },
    {
      role: "user",
      content: `
Generate ${count} multiple-choice quiz questions based on the educational content of this video.

Topic / Title: ${videoTitle}

${sourceText}

CRITICAL RULES FOR QUESTIONS:
1. Every question MUST test a real concept, skill, definition, tool, or subject-matter knowledge covered in the content.
2. DO NOT ask meta-questions like "What is the channel name?", "What is the video duration?", "Where to download PPT?", "Which platform is mentioned for connecting?", etc.
3. Provide 4 realistic options (A, B, C, D) for each question with 1 clearly correct answer and a helpful explanation.

Return ONLY valid JSON in this exact structure:
{
  "questions": [
    {
      "question": "Clear, concept-focused question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact string matching one of the options",
      "explanation": "Detailed explanation of why this answer is correct"
    }
  ]
}
      `.trim()
    }
  ];
}

module.exports = {
  buildQuizPrompt
};