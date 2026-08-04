const GEMINI_API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY;


const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";



async function callGemini(prompt:string):Promise<string>{

  if(
    !GEMINI_API_KEY ||
    GEMINI_API_KEY === "your-gemini-api-key"
  ){

    return "AI service is not configured. Please add VITE_GEMINI_API_KEY.";

  }


  try{

    const response =
      await fetch(
        `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
        {
          method:"POST",

          headers:{
            "Content-Type":"application/json"
          },

          body:JSON.stringify({

            contents:[
              {
                parts:[
                  {
                    text:prompt
                  }
                ]
              }
            ]

          })

        }
      );



    if(!response.ok){

      throw new Error(
        "Gemini request failed"
      );

    }



    const data =
      await response.json();



    return (
      data
      ?.candidates
      ?.[0]
      ?.content
      ?.parts
      ?.[0]
      ?.text
    )
    ||
    "AI could not generate a response.";


  }
  catch(error){

    console.error(
      "Gemini Error:",
      error
    );


    return "AI service temporarily unavailable.";

  }

}




// ===============================
// Diary Enhancement
// ===============================

export async function enhanceDiaryEntry(
  content:string,
  title:string
):Promise<string>{


const prompt = `

You are an internship documentation assistant.

Improve this university ICT internship diary entry.

Rules:
- Keep the original meaning.
- Improve grammar.
- Use professional language.
- Add learning outcomes.
- Do not invent fake activities.

Title:
${title}


Diary:
${content}

Return only the improved diary text.

`;



return await callGemini(prompt);


}





// ===============================
// Weekly Report Generation
// ===============================

export async function generateWeeklySummary(

diaryTexts:string[],

weekStart:string,

weekEnd:string

):Promise<string>{


const prompt = `

Create a professional weekly internship report.

Period:
${weekStart}
to
${weekEnd}


Daily Activities:

${diaryTexts.join("\n---\n")}



Include:

1. Executive Summary

2. Completed Tasks

3. Technical Skills Developed

4. Soft Skills Developed

5. Challenges

6. Next Week Plans


Return a structured report.

`;



return await callGemini(prompt);


}





// ===============================
// CV Analysis Feature
// NEW
// ===============================

export async function analyzeCV(
cvText:string
):Promise<string>{


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





// ===============================
// Skill Feedback Generator
// NEW
// ===============================

export async function generateSkillFeedback(

skills:string[],

score:number

):Promise<string>{


const prompt = `

Generate professional internship evaluation feedback.

Skills:

${skills.join(",")}


Score:
${score}/5


Give short constructive feedback.

`;



return await callGemini(prompt);


}





// ===============================
// Final Internship Summary
// NEW
// ===============================

export async function generateFinalInternshipSummary(

diaries:string[],

reports:string[]

):Promise<string>{


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