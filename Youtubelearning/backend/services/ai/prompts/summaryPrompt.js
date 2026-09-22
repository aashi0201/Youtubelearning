function buildSummaryPrompt({ video, transcriptText }) {
  const videoTitle = video?.title || "";
  const description = video?.description || "";

  const sourceText = transcriptText?.trim()
    ? `Video Transcript:\n${transcriptText}`
    : `Video Title: ${videoTitle}\nVideo Description:\n${description}`;

  return [
    {
      role: "system",
      content:
        "You are an AI learning assistant for educational videos. Return concise structured study notes in valid JSON only. Focus purely on subject matter knowledge, concepts, and key learnings."
    },
    {
      role: "user",
      content: `
Create a structured learning summary for this educational video.

Topic / Title: ${videoTitle}

${sourceText}

CRITICAL RULES:
1. Focus on educational concepts, tools, skills, and takeaways.
2. DO NOT include meta-information like channel name, video duration, or social links in the key concepts or points.

Return ONLY valid JSON in this structure:
{
  "summary": "Short paragraph summarizing the main subject matter taught in the video",
  "keyConcepts": ["Concept 1", "Concept 2"],
  "importantPoints": ["Key takeaway 1", "Key takeaway 2"],
  "revisionPoints": ["Revision item 1", "Revision item 2"]
}
      `.trim()
    }
  ];
}

module.exports = {
  buildSummaryPrompt
};