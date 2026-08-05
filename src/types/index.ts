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
//added by me
export interface StudentEvaluation {
  id: string;
  studentId: string;
  studentName: string;
  supervisorId: string;

  technicalSkills: number;
  communicationSkills: number;
  teamworkSkills: number;
  problemSolvingSkills: number;

  feedback: string;

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

  aiEnhanced?: boolean;
  aiGeneratedContent?: string;

  status:
    | 'pending'
    | 'approved'
    | 'rejected';

  supervisorFeedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;

  createdAt: string;
}

export interface WeeklyReport {
    attachmentUrl?: string;
  attachmentName?: string;

  companyVerifiedAt?: string;
  supervisorApprovedAt?: string;
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
export interface CompanyFeedback {

  id:string;

  studentId:string;

  companyId:string;

  companyName:string;

  attendance:number;

  technicalPerformance:number;

  communication:number;

  teamwork:number;

  comments:string;

  createdAt:string;
}
export interface CompanyFeedback {

id:string;

studentId:string;

companyId:string;

feedback:string;

rating:number;

createdAt:string;

}
export interface DashboardStats {

 total:number;

 completed:number;

 pending:number;

 averageScore:number;

}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'reminder'| 'error';
  read: boolean;
  createdAt: string;
  link?: string;
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
