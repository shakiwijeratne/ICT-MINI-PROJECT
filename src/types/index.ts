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
  photoURL?: string;
  companyId?: string;
  companySupervisor: string;
  companyName?: string;
  supervisorId?: string;
  universitySupervisor: string;
  designation?: string; //
  universityName?: string;
  department?: string;
  indexNumber?: string;
  phone?: string;
  createdAt: string;
  internshipPeriod: string;
}

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
  position: string;
  companyId: string; 
  supervisorId: string; 
  companyName: string;
  companySupervisor: string;
  universitySupervisorId?: string; // Optional/legacy support if you are transitioning to just supervisorId
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
  status: 'pending' | 'approved' | 'rejected';
  supervisorFeedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
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
  content?: string; // Optional: The concatenated diary entries
  generatedAt: string;
  submittedAt?: string; // Optional: Added when submitted
  status: ReportStatus;
  
  // The Approval Stamps
  companyApproval?: {
    supervisorId: string;
    supervisorName: string;
    designation: string;
    timestamp: string;
  };
  uniApproval?: {
    supervisorId: string;
    supervisorName: string;
    designation: string;
    timestamp: string;
  };
  
  // Feedback Loop
  supervisorFeedback?: string; // Optional until feedback is given
  companyFeedback?: string; // Optional until feedback is given
  rejectionReason?: string;
  supervisorApprovedAt?: string; // Added to fix the error in image_513d55.jpg
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
  id: string;
  studentId: string;
  companyId: string;
  companyName: string;
  
  // Specific metrics
  attendance: number;
  technicalPerformance: number;
  communication: number;
  teamwork: number;
  rating: number; 
  
  feedback: string; // Replaces 'comments' to unify the duplicates
  createdAt: string;
}

export interface DashboardStats {
  total: number;
  completed: number;
  pending: number;
  averageScore: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'reminder' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface Company {
  id: string;
  name: string;
  contactPhone: string;
  address?: string;
  industry: string;
  contactEmail?: string;
  website?: string;
  supervisorName: string;
  status: 'active' | 'completed' | 'pending';
  createdAt: string;
  // Add any other properties your company profile needs
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
