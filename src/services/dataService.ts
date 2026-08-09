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
import { db, auth, isFirebaseConfigured } from './firebase';
import { updateProfile } from 'firebase/auth';
import { localStore } from './localStore';
import type {
  DiaryEntry,
  WeeklyReport,
  Internship,
  SkillEvaluation,
  AppNotification,
  CompanyFeedback,
} from '../types';

// ============================================================================
// Helper Functions
// ============================================================================

function id(): string {
  return crypto.randomUUID();
}

// ============================================================================
// Diary Operations
// ============================================================================

// 1. GET DIARIES - MUST map docSnap.id to entry.id
export async function getDiaries(studentId?: string): Promise<DiaryEntry[]> {
  console.log("The ID passed to getDiaries is:", studentId);
  if (isFirebaseConfigured && db) {
    try {
      // Conditionally build the query: only use 'where' if studentId actually exists
      const q = studentId 
        ? query(collection(db, "diaries"), where("studentId", "==", studentId))
        : collection(db, "diaries");

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as DiaryEntry),
        id: docSnap.id, 
      }));
    } catch (error) {
      console.error("Error fetching diaries from Firestore:", error);
      return [];
    }
  }
  return [];
}

export async function createDiary(data: Omit<DiaryEntry, 'id'>): Promise<string> {
  // Use a clean ISO timestamp string
  const payload = {
    ...data,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      const cleanData = JSON.parse(JSON.stringify(payload));
      const docRef = await addDoc(collection(db, "diaries"), cleanData);
      return docRef.id;
    } catch (error) {
      console.error("Firestore createDoc error:", error);
      throw error;
    }
  }

  // Local store fallback
  const newEntry: DiaryEntry = {
    id: Date.now().toString(),
    ...payload,
  };
  const current = localStore.getDiaries();
  localStore.setDiaries([newEntry, ...current]);
  return newEntry.id;
}

export async function updateDiary(diaryId: string, data: Partial<DiaryEntry>): Promise<void> {
  if (isFirebaseConfigured && db) {
    const diaryRef = doc(db, 'diaries', diaryId);
    await updateDoc(diaryRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  const updated = localStore.getDiaries().map((d) =>
    d.id === diaryId
      ? {
          ...d,
          ...data,
          updatedAt: new Date().toISOString(),
        }
      : d
  );

  localStore.setDiaries(updated);
}

// 2. DELETE DIARY - Target exact document reference
export async function deleteDiary(diaryId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "diaries", diaryId);
      await deleteDoc(docRef);
      return;
    } catch (error) {
      console.error("Firestore deletion failed:", error);
      throw error;
    }
  }

  // Local fallback
  const remaining = localStore.getDiaries().filter((d) => d.id !== diaryId);
  localStore.setDiaries(remaining);
}

// ----------------------------------------------------------------------------
// Diary Workflow
// ----------------------------------------------------------------------------

export async function approveDiary(
  diaryId: string,
  supervisorId: string,
  feedback?: string
): Promise<void> {
  await updateDiary(diaryId, {
    status: 'approved',
    reviewedBy: supervisorId,
    supervisorFeedback: feedback ?? '',
    reviewedAt: new Date().toISOString(),
  });
}

export async function rejectDiary(
  diaryId: string,
  supervisorId: string,
  feedback: string
): Promise<void> {
  await updateDiary(diaryId, {
    status: 'rejected',
    reviewedBy: supervisorId,
    supervisorFeedback: feedback,
    reviewedAt: new Date().toISOString(),
  });
}

// ============================================================================
// Weekly Report Operations
// ============================================================================

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

export async function createReport(
  report: Omit<WeeklyReport, 'id' | 'generatedAt'>
): Promise<WeeklyReport> {
  const full: WeeklyReport = {
    ...report,
    id: id(),
    generatedAt: new Date().toISOString(),
  };

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

// ----------------------------------------------------------------------------
// Report Workflow
// ----------------------------------------------------------------------------

export async function submitReport(reportId: string): Promise<void> {
  await updateReport(reportId, {
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  });
}

export async function verifyReportByCompany(reportId: string, feedback: string): Promise<void> {
  await updateReport(reportId, {
    status: 'company_verified',
    companyFeedback: feedback,
    companyVerifiedAt: new Date().toISOString(),
  });
}

export async function approveReportBySupervisor(reportId: string, feedback: string): Promise<void> {
  await updateReport(reportId, {
    status: 'supervisor_approved',
    supervisorFeedback: feedback,
    supervisorApprovedAt: new Date().toISOString(),
  });
}

// ============================================================================
// Internship Operations
// ============================================================================

export async function getInternships(filter?: {
  studentId?: string;
  supervisorId?: string;
}): Promise<Internship[]> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(collection(db, 'internships'));
    let items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Internship));

    if (filter?.studentId) {
      items = items.filter((i) => i.studentId === filter.studentId);
    }
    if (filter?.supervisorId) {
      items = items.filter((i) => i.universitySupervisorId === filter.supervisorId);
    }
    return items;
  }

  let items = localStore.getInternships();
  if (filter?.studentId) {
    items = items.filter((i) => i.studentId === filter.studentId);
  }
  if (filter?.supervisorId) {
    items = items.filter((i) => i.universitySupervisorId === filter.supervisorId);
  }
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

export async function updateInternship(
  internshipId: string,
  data: Partial<Internship>
): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'internships', internshipId), data);
    return;
  }

  const items = localStore.getInternships().map((i) => (i.id === internshipId ? { ...i, ...data } : i));
  localStore.setInternships(items);
}

// ============================================================================
// Skill Evaluation Operations
// ============================================================================

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

export async function createEvaluation(
  data: Omit<SkillEvaluation, 'id' | 'createdAt'>
): Promise<SkillEvaluation> {
  const full: SkillEvaluation = {
    ...data,
    id: id(),
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, 'evaluations'), full);
    return { ...full, id: ref.id };
  }

  const items = localStore.getEvaluations();
  items.push(full);
  localStore.setEvaluations(items);

  return full;
}

// ============================================================================
// Notification Operations
// ============================================================================

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  if (isFirebaseConfigured && db) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
  }

  return localStore.getNotifications().filter((n) => n.userId === userId);
}

export async function createNotification(
  data: Omit<AppNotification, 'id' | 'createdAt'>
): Promise<string> {
  const payload = {
    ...data,
    createdAt: new Date().toISOString(),
    read: false,
  };

  if (isFirebaseConfigured && db) {
    try {
      const cleanData = JSON.parse(JSON.stringify(payload));
      const docRef = await addDoc(collection(db, "notifications"), cleanData);
      return docRef.id;
    } catch (error) {
      console.error("Error creating notification in Firestore:", error);
      throw error;
    }
  }

  // Local store fallback
  const newNotification: AppNotification = {
    id: Date.now().toString(),
    ...payload,
  };
  
  const current = localStore.getNotifications();
  localStore.setNotifications([newNotification, ...current]);
  return newNotification.id;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    return;
  }

  const items = localStore.getNotifications().map((n) =>
    n.id === notificationId ? { ...n, read: true } : n
  );
  localStore.setNotifications(items);
}

// Get All Notifications for Admin
export async function getAllNotifications(): Promise<AppNotification[]> {
  if (isFirebaseConfigured && db) {
    try {
      const querySnapshot = await getDocs(collection(db, "notifications"));
      
      return querySnapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as AppNotification),
        id: docSnap.id, // Explicit Firestore ID mapping
      }));
    } catch (error) {
      console.error("Error fetching all notifications from Firestore:", error);
      throw error;
    }
  }

  // Local store fallback
  return localStore.getNotifications();
}

// ============================================================================
// Dashboard Statistics
// ============================================================================

export async function getStudentStatistics(studentId: string) {
  const diaries = await getDiaries(studentId);
  const reports = await getReports(studentId);

  const totalHours = diaries.reduce((sum, d) => sum + d.hoursWorked, 0);
  const approvedReports = reports.filter((r) => r.status === 'supervisor_approved').length;

  return {
    diaryCount: diaries.length,
    reportCount: reports.length,
    totalHours,
    approvedReports,
  };
}

// ============================================================================
// Company Feedback Operations
// ============================================================================

export async function createCompanyFeedback(
  data: Omit<CompanyFeedback, 'id' | 'createdAt'>
): Promise<CompanyFeedback> {
  const feedback: CompanyFeedback = {
    ...data,
    id: id(),
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    await addDoc(collection(db, 'companyFeedback'), feedback);
    return feedback;
  }

  const items = (localStore.getCompanyFeedback ? localStore.getCompanyFeedback() : []) as CompanyFeedback[];
  items.push(feedback);
  if (localStore.setCompanyFeedback) {
    localStore.setCompanyFeedback(items);
  }

  return feedback;
}

export async function getCompanyFeedback(studentId?: string): Promise<CompanyFeedback[]> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(collection(db, 'companyFeedback'));
    let items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CompanyFeedback));

    if (studentId) {
      items = items.filter((i) => i.studentId === studentId);
    }
    return items;
  }

  // Fallback
  const all = (localStore.getCompanyFeedback ? localStore.getCompanyFeedback() : []) as CompanyFeedback[];
  // Explicitly type 'f' as CompanyFeedback to resolve the implicit 'any' error
  return studentId ? all.filter((f: CompanyFeedback) => f.studentId === studentId) : all;
}

export const updateProfilePhoto = async (userId: string, base64Image: string): Promise<void> => {
  if (!db) throw new Error("Firestore instance not initialized");

  if (auth?.currentUser) {
    await updateProfile(auth.currentUser, {
      photoURL: base64Image
    });
  }

  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    photoURL: base64Image
  });
};