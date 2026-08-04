import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './useAuth';
import { getDiaries, getReports, getInternships, getNotifications } from '../services/dataService';
import type { DiaryEntry, WeeklyReport, Internship, AppNotification } from '../types';

interface InternshipData {
  diaries: DiaryEntry[];
  reports: WeeklyReport[];
  internship: Internship | null;
  notifications: AppNotification[];
  refreshData: () => Promise<void>;
  loading: boolean;
}

const InternshipContext = createContext<InternshipData | undefined>(undefined);

export function InternshipProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [internship, setInternship] = useState<Internship | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    if (!user?.uid) return;
    setLoading(true);
    
    try {
      // Promise.allSettled prevents the entire block from failing if one collection is empty
      const results = await Promise.allSettled([
        getDiaries(user.uid),
        getReports(user.uid),
        getInternships({ studentId: user.uid }),
        getNotifications(user.uid),
      ]);

      if (results[0].status === 'fulfilled') setDiaries(results[0].value);
      if (results[1].status === 'fulfilled') setReports(results[1].value);
      if (results[2].status === 'fulfilled') setInternship(results[2].value[0] ?? null);
      if (results[3].status === 'fulfilled') setNotifications(results[3].value.slice(0, 5));
    } catch (error) {
      console.error("Critical error in data synchronization:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user?.uid]);

  return (
    <InternshipContext.Provider value={{ diaries, reports, internship, notifications, refreshData, loading }}>
      {children}
    </InternshipContext.Provider>
  );
}

export const useInternshipData = () => {
  const context = useContext(InternshipContext);
  if (!context) throw new Error("useInternshipData must be used within an InternshipProvider");
  return context;
};