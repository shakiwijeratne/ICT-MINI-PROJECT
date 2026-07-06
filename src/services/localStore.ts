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
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export const localStore = {
  getUsers: () => read<Record<string, import('../types').UserProfile>>('users', {}),
  setUsers: (users: Record<string, import('../types').UserProfile>) => write('users', users),

  getSession: () => read<string | null>('session', null),
  setSession: (uid: string | null) => write('session', uid),

  getDiaries: () => read<import('../types').DiaryEntry[]>('diaries', []),
  setDiaries: (items: import('../types').DiaryEntry[]) => write('diaries', items),

  getReports: () => read<import('../types').WeeklyReport[]>('reports', []),
  setReports: (items: import('../types').WeeklyReport[]) => write('reports', items),

  getInternships: () => read<import('../types').Internship[]>('internships', []),
  setInternships: (items: import('../types').Internship[]) => write('internships', items),

  getEvaluations: () => read<import('../types').SkillEvaluation[]>('evaluations', []),
  setEvaluations: (items: import('../types').SkillEvaluation[]) => write('evaluations', items),

  getNotifications: () => read<import('../types').AppNotification[]>('notifications', []),
  setNotifications: (items: import('../types').AppNotification[]) => write('notifications', items),

  getCompanies: () => read<import('../types').Company[]>('companies', []),
  setCompanies: (items: import('../types').Company[]) => write('companies', items),

  seedDemoData: () => {
    if (localStorage.getItem(PREFIX + 'seeded')) return;

    const now = new Date().toISOString();
    const users: Record<string, import('../types').UserProfile> = {
      'demo-student': {
        uid: 'demo-student',
        email: 'student@demo.sjp.ac.lk',
        displayName: 'Imasha Sayakkara',
        role: 'student',
        indexNumber: 'ICT/23/927',
        department: 'Network Technology',
        createdAt: now,
      },
      'demo-supervisor': {
        uid: 'demo-supervisor',
        email: 'supervisor@demo.sjp.ac.lk',
        displayName: 'Mr. Akalanka Panapitiya',
        role: 'supervisor',
        department: 'ICT Department',
        createdAt: now,
      },
      'demo-company': {
        uid: 'demo-company',
        email: 'company@demo.lk',
        displayName: 'Tech Solutions Ltd',
        role: 'company',
        companyName: 'Tech Solutions Ltd',
        createdAt: now,
      },
      'demo-admin': {
        uid: 'demo-admin',
        email: 'admin@demo.sjp.ac.lk',
        displayName: 'System Administrator',
        role: 'admin',
        createdAt: now,
      },
    };

    localStore.setUsers(users);
    localStore.setCompanies([
      {
        id: 'company-1',
        name: 'Tech Solutions Ltd',
        industry: 'Information Technology',
        address: 'Colombo, Sri Lanka',
        contactEmail: 'info@techsolutions.lk',
        contactPhone: '+94 11 234 5678',
        website: 'https://techsolutions.lk',
        supervisorName: 'Mr. Kamal Perera',
        status: 'active',
        createdAt: now,
      },
    ]);
    localStore.setInternships([
      {
        id: 'int-1',
        studentId: 'demo-student',
        studentName: 'Imasha Sayakkara',
        companyName: 'Tech Solutions Ltd',
        companySupervisor: 'Tech Solutions Ltd',
        universitySupervisorId: 'demo-supervisor',
        startDate: '2026-01-15',
        endDate: '2026-06-15',
        status: 'active',
        progress: 45,
      },
    ]);

    localStorage.setItem(PREFIX + 'seeded', 'true');
  },
};
