export type UserRole = 'student' | 'supervisor' | 'company' | 'admin';

export type ReportStatus =
  | 'draft'
  | 'submitted'
  | 'company_verified'
  | 'supervisor_approved'
  | 'rejected';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
  supervisorId?: string;
  department?: string;
  indexNumber?: string;
  phone?: string;
  createdAt: string;
}

export interface Internship {
  id: string;
  studentId: string;
  studentName: string;
  companyName: string;
  companySupervisor: string;
  universitySupervisorId: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'pending';
  progress: number;
}

export interface DiaryEntry {
  id: string;
  studentId: string;
  date: string;
  title: string;
  content: string;
  tasksCompleted: string[];
  hoursWorked: number;
  skillsUsed: string[];
  aiEnhanced?: string;
  createdAt: string;
}

export interface WeeklyReport {
  id: string;
  studentId: string;
  studentName: string;
  weekStart: string;
  weekEnd: string;
  summary: string;
  diaryIds: string[];
  status: ReportStatus;
  companyFeedback?: string;
  supervisorFeedback?: string;
  generatedAt: string;
  submittedAt?: string;
}

export interface SkillEvaluation {
  id: string;
  studentId: string;
  weekReportId: string;
  evaluatorId: string;
  evaluatorRole: 'company' | 'supervisor';
  technicalSkills: Record<string, number>;
  softSkills: Record<string, number>;
  comments: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'reminder';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  supervisorName: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export const TECHNICAL_SKILLS = [
  'Programming',
  'Problem Solving',
  'Database Management',
  'Web Development',
  'Testing & QA',
  'Documentation',
] as const;

export const SOFT_SKILLS = [
  'Communication',
  'Teamwork',
  'Time Management',
  'Adaptability',
  'Professionalism',
  'Initiative',
] as const;
