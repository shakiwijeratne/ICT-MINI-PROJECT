import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type {
  Internship,
  DiaryEntry,
  WeeklyReport,
  SkillEvaluation
} from "../types";



export function generateInternshipPDF(

internship: Internship,

diaries: DiaryEntry[],

reports: WeeklyReport[],

evaluations: SkillEvaluation[]

){


const pdf = new jsPDF();



let y = 20;



// Title

pdf.setFontSize(18);

pdf.text(
"Internship Final Report",
20,
y
);


y += 15;



// Student Information

pdf.setFontSize(12);

pdf.text(
`Student: ${internship.studentName}`,
20,
y
);


y += 8;


pdf.text(
`Company: ${internship.companyName}`,
20,
y
);


y += 8;


pdf.text(
`Duration: ${internship.startDate} - ${internship.endDate}`,
20,
y
);


y += 15;



// Internship Details

pdf.setFontSize(14);

pdf.text(
"Internship Details",
20,
y
);


y += 8;


pdf.setFontSize(11);


pdf.text(
`Status: ${internship.status}`,
20,
y
);


y += 8;


pdf.text(
`Progress: ${internship.progress}%`,
20,
y
);


y += 15;



// Diaries

pdf.setFontSize(14);

pdf.text(
"Daily Diary Summary",
20,
y
);


y += 5;



autoTable(pdf,{

startY:y,

head:[
[
"Date",
"Title",
"Hours"
]
],

body:

diaries.map(d=>[

d.date,

d.title,

`${d.hoursWorked}h`

])

});



y =
(pdf as any)
.lastAutoTable.finalY + 15;



// Reports

pdf.setFontSize(14);

pdf.text(
"Weekly Reports",
20,
y
);



y+=5;



autoTable(pdf,{

startY:y,

head:[
[
"Week",
"Status"
]
],

body:

reports.map(r=>[

`${r.weekStart} - ${r.weekEnd}`,

r.status

])

});



y =
(pdf as any)
.lastAutoTable.finalY + 15;



// Evaluation

pdf.setFontSize(14);

pdf.text(
"Skill Evaluation",
20,
y
);



y+=5;



autoTable(pdf,{

startY:y,

head:[
[
"Technical",
"Soft Skills",
"Comments"
]
],

body:

evaluations.map(e=>[

JSON.stringify(
e.technicalSkills
),

JSON.stringify(
e.softSkills
),

e.comments

])

});



pdf.save(
`${internship.studentName}_Internship_Report.pdf`
);


}