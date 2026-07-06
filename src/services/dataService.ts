import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  QueryConstraint,
  updateDoc,
  doc,
  deleteDoc,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { localStore } from './localStore';
import type { DiaryEntry, WeeklyReport, Internship, SkillEvaluation, AppNotification, Company } from '../types';

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

export async function createDiary(entry: Omit<DiaryEntry, 'id' | 'createdAt'>): Promise<DiaryEntry> {
  const full: DiaryEntry = { ...entry, id: id(), createdAt: new Date().toISOString() };
  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, 'diaries'), full);
    return { ...full, id: ref.id };
  }
  const items = localStore.getDiaries();
  items.unshift(full);
  localStore.setDiaries(items);
  return full;
}

export async function updateDiary(id: string, data: Partial<DiaryEntry>): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'diaries', id), data);
    return;
  }
  const items = localStore.getDiaries().map((d) => (d.id === id ? { ...d, ...data } : d));
  localStore.setDiaries(items);
}

export async function deleteDiary(entryId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, 'diaries', entryId));
    return;
  }
  localStore.setDiaries(localStore.getDiaries().filter((d) => d.id !== entryId));
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

// Internships
export async function getInternships(filter?: { studentId?: string; supervisorId?: string }): Promise<Internship[]> {
  if (isFirebaseConfigured && db) {
    // 1. Start with an empty array of query constraints
    const constraints: QueryConstraint[] = [];

    // 2. Add constraints only if they exist in the filter
    if (filter?.studentId) {
      constraints.push(where('studentId', '==', filter.studentId));
    }
    if (filter?.supervisorId) {
      constraints.push(where('universitySupervisorId', '==', filter.supervisorId));
    }

    // 3. Apply the constraints to the Firestore query
    const q = query(collection(db, 'internships'), ...constraints);
    const snap = await getDocs(q);
    
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Internship));
  }
  // Local Storage Logic
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

// Companies
export async function getCompanies(): Promise<Company[]> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(collection(db, 'companies'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Company));
  }
  return localStore.getCompanies();
}

export async function createCompany(data: Omit<Company, 'id' | 'createdAt'>): Promise<Company> {
  const full: Company = { ...data, id: id(), createdAt: new Date().toISOString() };
  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, 'companies'), full);
    return { ...full, id: ref.id };
  }
  const items = localStore.getCompanies();
  items.push(full);
  localStore.setCompanies(items);
  return full;
}

export async function updateCompany(companyId: string, data: Partial<Company>): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'companies', companyId), data);
    return;
  }
  const items = localStore.getCompanies().map((c) => (c.id === companyId ? { ...c, ...data } : c));
  localStore.setCompanies(items);
}

export async function deleteCompany(companyId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, 'companies', companyId));
    return;
  }
  localStore.setCompanies(localStore.getCompanies().filter((c) => c.id !== companyId));
}
