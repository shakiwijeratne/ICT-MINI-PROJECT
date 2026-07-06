const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function enhanceDiaryEntry(content: string, title: string): Promise<string> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key') {
    return `[AI Preview - Configure VITE_GEMINI_API_KEY]\n\nEnhanced version of "${title}":\n\n${content}\n\nThis entry demonstrates professional internship documentation with clear task descriptions, learning outcomes, and reflective notes suitable for weekly report generation.`;
  }

  const prompt = `You are an internship diary assistant. Improve the following diary entry for a university ICT student internship. Fix grammar, improve clarity, and maintain a professional tone. Keep the same meaning. Return only the improved text.\n\nTitle: ${title}\n\nEntry:\n${content}`;

  // Alternative header approach optimized for newer secure keys
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY // Delivers key safely via headers
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });


  if (!response.ok) {
    throw new Error('Failed to enhance diary entry with AI');
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? content;
}

export async function generateWeeklySummary(
  diaryTexts: string[],
  weekStart: string,
  weekEnd: string,
): Promise<string> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key') {
    return `Weekly Internship Report (${weekStart} to ${weekEnd})\n\nSummary:\nThis week covered ${diaryTexts.length} working days of internship activities including technical tasks, team collaboration, and skill development.\n\nKey Activities:\n${diaryTexts.map((t, i) => `${i + 1}. ${t.slice(0, 120)}...`).join('\n')}\n\nLearning Outcomes:\n- Applied theoretical knowledge in a professional environment\n- Improved communication and teamwork skills\n- Gained practical experience in assigned project tasks`;
  }

  const prompt = `Generate a professional weekly internship report summary from these daily diary entries for the period ${weekStart} to ${weekEnd}. Include: Executive Summary, Key Activities, Skills Developed, Challenges Faced, and Plans for Next Week.\n\nDiary entries:\n${diaryTexts.join('\n---\n')}`;

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY // Delivers key safely via headers
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate weekly report with AI');
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Report generation failed.';
}
