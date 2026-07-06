import { useEffect, useState } from 'react';
import { BookOpen, FileText, TrendingUp, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { getDiaries, getReports, getInternships, getNotifications } from '../../services/dataService';
import { PageHeader, Card, StatCard, EmptyState } from '../../components/ui';
import type { DiaryEntry, WeeklyReport, Internship, AppNotification } from '../../types';

export function StudentDashboard() {
  const { user } = useAuth();
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [internship, setInternship] = useState<Internship | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getDiaries(user.uid),
      getReports(user.uid),
      getInternships({ studentId: user.uid }),
      getNotifications(user.uid),
    ]).then(([d, r, i, n]) => {
      setDiaries(d);
      setReports(r);
      setInternship(i[0] ?? null);
      setNotifications(n.slice(0, 5));
    });
  }, [user]);

  const pendingReports = reports.filter((r) => r.status === 'draft').length;
  const totalHours = diaries.reduce((sum, d) => sum + d.hoursWorked, 0);

  return (
    <div className="page">
      <PageHeader
        title={`Welcome, ${user?.displayName}`}
        subtitle="Track your internship progress, submit diaries, and manage weekly reports"
      />

      <div className="stats-grid">
        <StatCard label="Diary Entries" value={diaries.length} icon={<BookOpen size={24} />} />
        <StatCard label="Weekly Reports" value={reports.length} icon={<FileText size={24} />} />
        <StatCard label="Hours Logged" value={totalHours} icon={<Clock size={24} />} />
        <StatCard
          label="Progress"
          value={`${internship?.progress ?? 0}%`}
          icon={<TrendingUp size={24} />}
        />
      </div>

      {internship && (
        <Card className="internship-card">
          <h3>Current Internship</h3>
          <div className="internship-details">
            <div><strong>Company:</strong> {internship.companyName}</div>
            <div><strong>Period:</strong> {internship.startDate} — {internship.endDate}</div>
            <div><strong>Status:</strong> {internship.status}</div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${internship.progress}%` }} />
          </div>
        </Card>
      )}

      <div className="grid-2">
        <Card>
          <h3>Recent Diary Entries</h3>
          {diaries.length === 0 ? (
            <EmptyState message="No diary entries yet. Start logging your daily activities." />
          ) : (
            <ul className="item-list">
              {diaries.slice(0, 5).map((d) => (
                <li key={d.id}>
                  <strong>{d.date}</strong> — {d.title}
                  <span>{d.hoursWorked}h</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3>Notifications</h3>
          {notifications.length === 0 ? (
            <EmptyState message="No notifications" />
          ) : (
            <ul className="item-list">
              {notifications.map((n) => (
                <li key={n.id} className={n.read ? '' : 'unread'}>
                  <strong>{n.title}</strong>
                  <span>{n.message}</span>
                </li>
              ))}
            </ul>
          )}
          {pendingReports > 0 && (
            <div className="alert alert-warning">
              You have {pendingReports} draft report(s) pending submission
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
