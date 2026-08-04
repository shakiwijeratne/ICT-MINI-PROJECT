import type {
  UserProfile,
  DiaryEntry,
  WeeklyReport,
  Internship,
  SkillEvaluation,
  AppNotification,
  CompanyFeedback,
} from '../types';

const PREFIX = 'ims_';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(
    PREFIX + key,
    JSON.stringify(value)
  );
}


export const localStore = {

  // ==========================
  // USERS
  // ==========================

  getUsers: () =>
    read<Record<string, UserProfile>>(
      'users',
      {}
    ),

  setUsers: (
    users: Record<string, UserProfile>
  ) =>
    write(
      'users',
      users
    ),


  // ==========================
  // SESSION
  // ==========================

  getSession: () =>
    read<string | null>(
      'session',
      null
    ),

  setSession: (
    uid:string | null
  ) =>
    write(
      'session',
      uid
    ),


  // ==========================
  // DIARIES
  // ==========================

  getDiaries: () =>
    read<DiaryEntry[]>(
      'diaries',
      []
    ),

  setDiaries: (
    items:DiaryEntry[]
  ) =>
    write(
      'diaries',
      items
    ),



  // ==========================
  // REPORTS
  // ==========================

  getReports: () =>
    read<WeeklyReport[]>(
      'reports',
      []
    ),

  setReports: (
    items:WeeklyReport[]
  ) =>
    write(
      'reports',
      items
    ),



  // ==========================
  // INTERNSHIPS
  // ==========================

  getInternships: () =>
    read<Internship[]>(
      'internships',
      []
    ),

  setInternships: (
    items:Internship[]
  ) =>
    write(
      'internships',
      items
    ),



  // ==========================
  // EVALUATIONS
  // ==========================

  getEvaluations: () =>
    read<SkillEvaluation[]>(
      'evaluations',
      []
    ),

  setEvaluations: (
    items:SkillEvaluation[]
  ) =>
    write(
      'evaluations',
      items
    ),



  // ==========================
  // COMPANY FEEDBACK
  // NEW FEATURE
  // ==========================

  getCompanyFeedback: () =>
    read<CompanyFeedback[]>(
      'companyFeedback',
      []
    ),

  setCompanyFeedback: (
    items:CompanyFeedback[]
  ) =>
    write(
      'companyFeedback',
      items
    ),



  // ==========================
  // FILE ATTACHMENTS
  // NEW FEATURE
  // ==========================

  getFiles: () =>
    read<any[]>(
      'files',
      []
    ),

  setFiles: (
    items:any[]
  ) =>
    write(
      'files',
      items
    ),



  // ==========================
  // NOTIFICATIONS
  // ==========================

  getNotifications: () =>
    read<AppNotification[]>(
      'notifications',
      []
    ),

  setNotifications: (
    items:AppNotification[]
  ) =>
    write(
      'notifications',
      items
    ),


  getCompanyFeedback: () =>
  read<import('../types').CompanyFeedback[]>(
  'companyFeedback',
  []),

  setCompanyFeedback: 
  (items: import('../types').CompanyFeedback[]) =>
  write(
  'companyFeedback',
  items
  ),
  // ==========================
  // DEMO DATA
  // ==========================

  seedDemoData: () => {

    if (
      localStorage.getItem(
        PREFIX + 'seeded'
      )
    )
      return;


    const now =
      new Date()
      .toISOString();


    const users:
      Record<string, UserProfile> =
    {

      "demo-student":
      {
        uid:"demo-student",
        email:
        "student@demo.sjp.ac.lk",

        displayName:
        "Demo Student",

        role:"student",

        indexNumber:
        "ICT/23/000",

        department:
        "ICT",

        createdAt:now
      },


      "demo-supervisor":
      {
        uid:
        "demo-supervisor",

        email:
        "supervisor@demo.sjp.ac.lk",

        displayName:
        "University Supervisor",

        role:
        "supervisor",

        department:
        "ICT Department",

        createdAt:now
      },


      "demo-company":
      {
        uid:
        "demo-company",

        email:
        "company@demo.lk",

        displayName:
        "Company Supervisor",

        role:
        "company",

        companyName:
        "Tech Solutions Ltd",

        createdAt:now
      },


      "demo-admin":
      {
        uid:
        "demo-admin",

        email:
        "admin@demo.sjp.ac.lk",

        displayName:
        "System Administrator",

        role:
        "admin",

        createdAt:now
      }

    };


    localStore.setUsers(users);



    localStore.setInternships([

      {

        id:
        "int-001",

        studentId:
        "demo-student",

        studentName:
        "Demo Student",

        companyName:
        "Tech Solutions Ltd",

        companySupervisor:
        "Company Supervisor",

        universitySupervisorId:
        "demo-supervisor",

        startDate:
        "2026-06-01",

        endDate:
        "2026-12-01",

        status:
        "active",

        progress:
        50
      }

    ]);



    localStorage.setItem(
      PREFIX + "seeded",
      "true"
    );

  }

};