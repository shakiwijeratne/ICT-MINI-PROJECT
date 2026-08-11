import { useEffect, useState } from 'react';
import { Users, FileText, AlertTriangle, Search } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import {
  getInternships,
  getReports,
  getDiaries,
  getEvaluations,
} from '../../services/dataService';
import { getAllUsers } from '../../services/authService';
import { PageHeader, Card, StatCard, EmptyState } from '../../components/ui';
import type { WeeklyReport, SkillEvaluation, UserProfile } from '../../types';

export function SupervisorDashboard() {
  const { user } = useAuth();
  const [activeInterns, setActiveInterns] = useState<any[]>([]);
  const [searchingStudents, setSearchingStudents] = useState<UserProfile[]>([]);
  const [pendingReports, setPendingReports] = useState<WeeklyReport[]>([]);
  const [inactiveStudents, setInactiveStudents] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<SkillEvaluation[]>([]);

  useEffect(() => {
    if (!user || !user.uid) return;

    Promise.all([
      getAllUsers(),
      getInternships(),
      getReports(),
      getDiaries(),
      getEvaluations(),
    ]).then(([users, allInternships, allReports, allDiaries, allEvaluations]) => {
      const assignedUsers = users.filter(
        (u) => u.role === 'student' && u.supervisorId === user.uid
      );
      const assignedStudentIds = new Set(assignedUsers.map((u) => u.uid));

      const assignedInternships = allInternships.filter((i) =>
        assignedStudentIds.has(i.studentId)
      );
      const activeStudentIds = new Set(assignedInternships.map((i) => i.studentId));

      const active = assignedUsers.filter((s) => activeStudentIds.has(s.uid));
      const searching = assignedUsers.filter((s) => !activeStudentIds.has(s.uid));

      const activeWithDetails = active.map((s) => {
        const internship = assignedInternships.find((i) => i.studentId === s.uid);
        const studentDiaries = allDiaries.filter((d) => d.studentId === s.uid);
        const progress = internship?.progress ?? Math.min(100, studentDiaries.length * 10);

        return {
          ...s,
          companyName: internship?.companyName ?? 'Assigned Company',
          progress,
        };
      });

      setActiveInterns(activeWithDetails);
      setSearchingStudents(searching);
      setEvaluations(allEvaluations);

      const pending = allReports.filter((r) => r.status === 'company_verified');
      setPendingReports(pending);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const inactive = activeWithDetails
        .filter((student) => {
          const recent = allDiaries.filter(
            (d) => d.studentId === student.uid && new Date(d.date) >= weekAgo
          );
          return recent.length === 0;
        })
        .map((student) => student.displayName || 'Student');

      setInactiveStudents(inactive);
    });
  }, [user]);

  return (
    <div className="page">
      <PageHeader
        title="Supervisor Dashboard"
        subtitle="Monitor active placements, track placement seekers, and review reports"
      />

      <div className="stats-grid">
        <StatCard label="Active Interns" value={activeInterns.length} icon={<Users size={24} />} />
        <StatCard label="Seeking Placement" value={searchingStudents.length} icon={<Search size={24} />} />
        <StatCard label="Pending Approval" value={pendingReports.length} icon={<FileText size={24} />} />
        <StatCard label="Inactive Alerts" value={inactiveStudents.length} icon={<AlertTriangle size={24} />} />
      </div>

      {inactiveStudents.length > 0 && (
        <div className="alert alert-warning">
          Low activity detected for active interns: {inactiveStudents.join(', ')}
        </div>
      )}

      <div className="grid-2">
        <Card>
          <h3>Active Interns ({activeInterns.length})</h3>
          {activeInterns.length === 0 ? (
            <EmptyState message="No active interns currently placed" />
          ) : (
            <ul className="item-list">
              {activeInterns.map((s) => (
                <li key={s.uid}>
                  <strong>{s.displayName}</strong>
                  <span>{s.companyName} · {s.progress}% complete</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3>Students Seeking Internships ({searchingStudents.length})</h3>
          {searchingStudents.length === 0 ? (
            <EmptyState message="No students currently seeking placements" />
          ) : (
            <ul className="item-list">
              {searchingStudents.map((s) => (
                <li key={s.uid}>
                  <strong>{s.displayName}</strong>
                  <span>{s.department ?? 'General'} · Looking for placement</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid-2" style={{ marginTop: '1.5rem' }}>
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

        <Card>
          <h3>Evaluations & System Status</h3>
          <p style={{ marginBottom: '1rem' }}>
            Total Evaluations Completed: <strong>{evaluations.length}</strong>
          </p>
          <EmptyState message="Diary approval and review actions are available in the dedicated review pages." />
        </Card>
      </div>
    </div>
  );
}