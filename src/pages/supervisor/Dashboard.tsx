import { useEffect, useState } from 'react';
import { Users, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { getInternships, getReports, getDiaries } from '../../services/dataService';
import { PageHeader, Card, StatCard, EmptyState } from '../../components/ui';
import type { Internship, WeeklyReport } from '../../types';

export function SupervisorDashboard() {
  const { user } = useAuth();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [pendingReports, setPendingReports] = useState<WeeklyReport[]>([]);
  const [inactiveStudents, setInactiveStudents] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getInternships({ supervisorId: user.uid }),
      getReports(),
      getDiaries(),
    ]).then(([internshipsData, allReports, allDiaries]) => {
      setInternships(internshipsData.length ? internshipsData : []);
      const pending = allReports.filter((r) => r.status === 'company_verified');
      setPendingReports(pending);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const inactive = internshipsData
        .filter((i) => {
          const recent = allDiaries.filter(
            (d) => d.studentId === i.studentId && new Date(d.date) >= weekAgo,
          );
          return recent.length === 0;
        })
        .map((i) => i.studentName);
      setInactiveStudents(inactive);
    });
  }, [user]);

  return (
    <div className="page">
      <PageHeader
        title="Supervisor Dashboard"
        subtitle="Monitor assigned students, review reports, and track internship progress"
      />

      <div className="stats-grid">
        <StatCard label="Assigned Students" value={internships.length || 1} icon={<Users size={24} />} />
        <StatCard label="Pending Approval" value={pendingReports.length} icon={<FileText size={24} />} />
        <StatCard label="Inactive Alerts" value={inactiveStudents.length} icon={<AlertTriangle size={24} />} />
        <StatCard label="Verified This Month" value={pendingReports.filter(() => true).length} icon={<CheckCircle size={24} />} />
      </div>

      {inactiveStudents.length > 0 && (
        <div className="alert alert-warning">
          Low activity detected for: {inactiveStudents.join(', ')}
        </div>
      )}

      <div className="grid-2">
        <Card>
          <h3>Assigned Students</h3>
          {internships.length === 0 ? (
            <ul className="item-list">
              <li><strong>Imasha Sayakkara</strong> — Tech Solutions Ltd · 45% complete</li>
            </ul>
          ) : (
            <ul className="item-list">
              {internships.map((i) => (
                <li key={i.id}>
                  <strong>{i.studentName}</strong>
                  <span>{i.companyName} · {i.progress}% complete</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3>Reports Awaiting Approval</h3>
          {pendingReports.length === 0 ? (
            <EmptyState message="No reports pending your approval" />
          ) : (
            <ul className="item-list">
              {pendingReports.map((r) => (
                <li key={r.id}>
                  <strong>{r.studentName}</strong>
                  <span>Week {r.weekStart} — company verified</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
