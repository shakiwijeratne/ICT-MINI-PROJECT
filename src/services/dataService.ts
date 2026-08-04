import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { localStore } from './localStore';
import type {
  DiaryEntry,
  WeeklyReport,
  Internship,
  SkillEvaluation,
  AppNotification,
  CompanyFeedback
} from '../types';

function id(): string {
  return crypto.randomUUID();
}

// Diary
export async function getDiaries(studentId?: string): Promise<DiaryEntry[]> {
  if (isFirebaseConfigured && db) {
    const q = studentId
      ? query(collection(db, 'diaries'), where('studentId', '==', studentId), orderBy('date', 'desc'))
      : query(collection(db, 'diaries'), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DiaryEntry));
  }
  const all = localStore.getDiaries();
  return studentId ? all.filter((d) => d.studentId === studentId) : all;
}

export async function createDiary(
  entry: Omit<
    DiaryEntry,
    'id' |
    'createdAt' |
    'status' |
    'reviewedBy' |
    'reviewedAt' |
    'supervisorFeedback'
  >
): Promise<DiaryEntry> {


const diaryData = {

 ...entry,

 status:"pending",

 createdAt:new Date().toISOString(),

 reviewedBy:"",

 reviewedAt:"",

 supervisorFeedback:""

};


if(isFirebaseConfigured && db){

 const ref = await addDoc(
   collection(db,"diaries"),
   diaryData
 );


 return {

   id:ref.id,

   ...diaryData

 } as DiaryEntry;


}



const full={
 id:id(),
 ...diaryData
} as DiaryEntry;



const items=localStore.getDiaries();

items.unshift(full);

localStore.setDiaries(items);


return full;


}
   

export async function updateDiary(
 diaryId:string,
 data:Partial<DiaryEntry>
):Promise<void>{


if(isFirebaseConfigured && db){


const diaryRef =
doc(db,"diaries",diaryId);



await updateDoc(
 diaryRef,
 {

 ...data,

 updatedAt:new Date().toISOString()

 }
);


return;

}



const updated =
localStore
.getDiaries()
.map(d=>

d.id===diaryId

?
{
...d,
...data,
updatedAt:new Date().toISOString()
}

:
d

);



localStore.setDiaries(updated);


}


export async function deleteDiary(
 diaryId:string
):Promise<void>{


if(isFirebaseConfigured && db){


await deleteDoc(
 doc(db,"diaries",diaryId)
);


return;


}



const remaining =
localStore
.getDiaries()
.filter(
d=>d.id!==diaryId
);



localStore.setDiaries(
remaining
);



}

// ==============================
// Diary Approval Workflow
// ==============================

export async function approveDiary(
  diaryId:string,
  supervisorId:string,
  feedback?:string
):Promise<void>{

await updateDiary(
  diaryId,
  {
    status:"approved",
    reviewedBy:supervisorId,
    supervisorFeedback:feedback ?? "",
    reviewedAt:new Date().toISOString()
  }
);

}

export async function rejectDiary(
  diaryId:string,
  supervisorId:string,
  feedback:string
):Promise<void>{

await updateDiary(
 diaryId,
 {
  status:"rejected",
  reviewedBy:supervisorId,
  supervisorFeedback:feedback,
  reviewedAt:new Date().toISOString()
 }
);

}

// Reports
export async function getReports(studentId?: string): Promise<WeeklyReport[]> {
  if (isFirebaseConfigured && db) {
    const q = studentId
      ? query(collection(db, 'reports'), where('studentId', '==', studentId), orderBy('weekStart', 'desc'))
      : query(collection(db, 'reports'), orderBy('weekStart', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WeeklyReport));
  }
  const all = localStore.getReports();
  return studentId ? all.filter((r) => r.studentId === studentId) : all;
}

export async function createReport(report: Omit<WeeklyReport, 'id' | 'generatedAt'>): Promise<WeeklyReport> {
  const full: WeeklyReport = { ...report, id: id(), generatedAt: new Date().toISOString() };
  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, 'reports'), full);
    return { ...full, id: ref.id };
  }
  const items = localStore.getReports();
  items.unshift(full);
  localStore.setReports(items);
  return full;
}

export async function updateReport(reportId: string, data: Partial<WeeklyReport>): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'reports', reportId), data);
    return;
  }
  const items = localStore.getReports().map((r) => (r.id === reportId ? { ...r, ...data } : r));
  localStore.setReports(items);
}

// ==============================
// Report Workflow
// ==============================


export async function submitReport(
reportId:string
){

await updateReport(
reportId,
{
status:"submitted",
submittedAt:new Date().toISOString()
}
);

}



export async function verifyReportByCompany(
reportId:string,
feedback:string
){

await updateReport(
reportId,
{
status:"company_verified",
companyFeedback:feedback,
companyVerifiedAt:new Date().toISOString()
}
);

}



export async function approveReportBySupervisor(
reportId:string,
feedback:string
){

await updateReport(
reportId,
{
status:"supervisor_approved",
supervisorFeedback:feedback,
supervisorApprovedAt:new Date().toISOString()
}
);

}
// Internships
export async function getInternships(filter?: { studentId?: string; supervisorId?: string }): Promise<Internship[]> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(collection(db, 'internships'));
    let items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Internship));
    if (filter?.studentId) items = items.filter((i) => i.studentId === filter.studentId);
    if (filter?.supervisorId) items = items.filter((i) => i.universitySupervisorId === filter.supervisorId);
    return items;
  }
  let items = localStore.getInternships();
  if (filter?.studentId) items = items.filter((i) => i.studentId === filter.studentId);
  if (filter?.supervisorId) items = items.filter((i) => i.universitySupervisorId === filter.supervisorId);
  return items;
}

export async function createInternship(data: Omit<Internship, 'id'>): Promise<Internship> {
  const full: Internship = { ...data, id: id() };
  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, 'internships'), full);
    return { ...full, id: ref.id };
  }
  const items = localStore.getInternships();
  items.push(full);
  localStore.setInternships(items);
  return full;
}

export async function updateInternship(internshipId: string, data: Partial<Internship>): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'internships', internshipId), data);
    return;
  }
  const items = localStore.getInternships().map((i) => (i.id === internshipId ? { ...i, ...data } : i));
  localStore.setInternships(items);
}

// Evaluations
export async function getEvaluations(studentId?: string): Promise<SkillEvaluation[]> {
  if (isFirebaseConfigured && db) {
    const q = studentId
      ? query(collection(db, 'evaluations'), where('studentId', '==', studentId))
      : collection(db, 'evaluations');
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SkillEvaluation));
  }
  const all = localStore.getEvaluations();
  return studentId ? all.filter((e) => e.studentId === studentId) : all;
}

export async function createEvaluation(data: Omit<SkillEvaluation, 'id' | 'createdAt'>): Promise<SkillEvaluation> {
  const full: SkillEvaluation = { ...data, id: id(), createdAt: new Date().toISOString() };
  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, 'evaluations'), full);
    return { ...full, id: ref.id };
  }
  const items = localStore.getEvaluations();
  items.push(full);
  localStore.setEvaluations(items);
  return full;
}

// Notifications
export async function getNotifications(userId: string): Promise<AppNotification[]> {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
  }
  return localStore.getNotifications().filter((n) => n.userId === userId);
}

export async function createNotification(data: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): Promise<void> {
  const full: AppNotification = {
    ...data,
    id: id(),
    read: false,
    createdAt: new Date().toISOString(),
  };
  if (isFirebaseConfigured && db) {
    await addDoc(collection(db, 'notifications'), full);
    return;
  }
  const items = localStore.getNotifications();
  items.unshift(full);
  localStore.setNotifications(items);
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    return;
  }
  const items = localStore.getNotifications().map((n) =>
    n.id === notificationId ? { ...n, read: true } : n,
  );
  localStore.setNotifications(items);
}
// ==============================
// Dashboard Statistics
// ==============================


export async function getStudentStatistics(
studentId:string
){

const diaries =
await getDiaries(studentId);


const reports =
await getReports(studentId);



const hours =
diaries.reduce(
(sum,d)=>sum+d.hoursWorked,
0
);


return {

diaryCount:diaries.length,

reportCount:reports.length,

totalHours:hours,

approvedReports:
reports.filter(
r=>r.status==="supervisor_approved"
).length

};

}
// ==============================
// Company Feedback
// ==============================


export async function createCompanyFeedback(
data:Omit<CompanyFeedback,"id"|"createdAt">
){

const feedback:CompanyFeedback={

...data,

id:id(),

createdAt:new Date().toISOString()

};


if(isFirebaseConfigured && db){

await addDoc(
collection(db,"companyFeedback"),
feedback
);

return feedback;

}



const items =
localStore.getCompanyFeedback();


items.push(feedback);


localStore.setCompanyFeedback(items);


return feedback;

}




export async function getCompanyFeedback(
studentId?:string
):Promise<CompanyFeedback[]>{


if(isFirebaseConfigured && db){

const snap =
await getDocs(
collection(db,"companyFeedback")
);


let items =
snap.docs.map(
d=>({
id:d.id,
...d.data()
} as CompanyFeedback)
);


if(studentId){

items =
items.filter(
i=>i.studentId===studentId
);

}


return items;

}



const all =
localStore.getCompanyFeedback();


return studentId
?
all.filter(
f=>f.studentId===studentId
)
:
all;

}