import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the official Google Gen AI client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY || "" });

// Central SDK Helper
async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "your-gemini-api-key") {
    throw new Error("AI service is not configured. Missing API Key in VITE_GEMINI_API_KEY.");
  }

  try {
    // Generate text using the official unified SDK and gemini-2.5-flash-lite
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });

    if (!response.text) {
      throw new Error("AI returned an empty response.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini SDK Error:", error);

    // Handle rate-limiting errors with clear messaging
    if (error?.status === 429 || error?.message?.includes("429")) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    }

    // Re-throw the error 
    throw new Error(error.message || "AI service temporarily unavailable.");
  }
}

// Feature Services-powered by the @google/genai SDK)

// 1. Diary Enhancement
export async function enhanceDiaryEntry(
  content: string,
  title: string
): Promise<string> {
  const prompt = `
You are an internship documentation assistant.
Improve this university ICT internship diary entry.

Rules:
- Keep the original meaning.
- Improve grammar and use professional language.
- Do not invent fake activities.
- STRICT RULE: Return ONLY the enhanced paragraph text. 
- DO NOT include headers, titles, bullet points, learning outcomes, or labels like "Diary:".

Context Title: ${title}
Draft Description: ${content}
`;

  return await callGemini(prompt);
}

// 2. Weekly Report Generation
// Explicit Weekly Draft Generator
export async function generateWeeklySummary(
  diaryTexts: string[],
  weekStart: string,
  weekEnd: string,
  optionalStudentNotes?: string
): Promise<string> {
  const prompt = `
You are an internship report compiler. Synthesize the provided daily diary entries into a structured draft weekly internship report.

PERIOD: ${weekStart} to ${weekEnd}

DAILY DIARY ENTRIES:
${diaryTexts.length > 0 ? diaryTexts.join("\n---\n") : "No daily entries recorded."}

ADDITIONAL STUDENT NOTES FOR THIS WEEK:
${optionalStudentNotes || "None provided."}

INSTRUCTIONS & EXTRACTION RULES:
1. Executive Summary: Write a 2-3 sentence overview summarizing the primary focus and progress made during this period.
2. Completed Tasks: Group and synthesize activities from daily entries into clear, professional accomplishments. Do not invent tasks not mentioned in the entries.
3. Technical Skills Developed: Extract specific tools, languages, frameworks, or technical methodologies evident in the daily entries.
4. Soft Skills Developed: Identify professional competencies demonstrated (e.g., documentation, analytical problem-solving, communication).
5. Challenges & Roadblocks: Summarize technical issues or blockers explicitly mentioned in the daily logs. If none were mentioned, state "Routine tasks executed without significant blockers."
6. Next Week Plans: If additional student notes mention upcoming work, summarize them. Otherwise, insert the placeholder: "[Insert planned tasks for next week]".

FORMATTING RULE: Use plain uppercase text headers for sections instead of Markdown symbols like '##' or '**'.

Example format:
1. EXECUTIVE SUMMARY
[Text here]

2. COMPLETED TASKS
[Text here]`;

  return await callGemini(prompt);
}

// Report Polish Service
export async function polishWeeklyReport(
  editedReportContent: string
): Promise<string> {
  const prompt = `
You are a technical editor reviewing a university internship weekly report draft.

TASK:
Improve grammar, spelling, sentence structure, and overall professional tone of the report below.

RULES:
- Preserve all facts, dates, technical details, and original meaning.
- Keep the existing section headers and Markdown structure intact.
- Do NOT remove any custom content added by the student.
- Return ONLY the polished report text without introductory or concluding remarks.

REPORT DRAFT TO POLISH:
${editedReportContent}
`;

  return await callGemini(prompt);
}
// 3. CV Analysis
export async function analyzeCV(cvText: string): Promise<string> {
  const prompt = `
Analyze this student's CV.

Provide:

1. Technical skills
2. Missing skills
3. Internship suitability
4. Improvement suggestions

CV:

${cvText}
`;

  return await callGemini(prompt);
}

// 4. Skill Feedback Generator
export async function generateSkillFeedback(
  skills: string[],
  score: number
): Promise<string> {
  const prompt = `
Generate professional internship evaluation feedback.

Skills:
${skills.join(", ")}

Score:
${score}/5

Give short constructive feedback.
`;

  return await callGemini(prompt);
}

// 5. Final Internship Summary
export async function generateFinalInternshipSummary(
  diaries: string[],
  reports: string[]
): Promise<string> {
  const prompt = `
Create a final internship summary.

Daily Diary Information:

${diaries.join("\n")}

Weekly Reports:

${reports.join("\n")}

Include:

- Internship Overview
- Main Contributions
- Technical Growth
- Professional Development
- Final Reflection
`;

  return await callGemini(prompt);
}