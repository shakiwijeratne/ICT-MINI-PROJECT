import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { getInternships, getDiaries, getReports } from '../../services/dataService';
import { PageHeader, Card, EmptyState } from '../../components/ui';
import type { Internship, DiaryEntry, WeeklyReport } from '../../types';

export function SupervisorStudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<
    (Internship & { diaryCount: number; reportCount: number; lastActivity?: string })[]
  >([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getInternships({ supervisorId: user.uid }),
      getDiaries(),
      getReports(),
    ]).then(([internships, diaries, reports]) => {
      const list = internships.length
        ? internships
        : [{
            id: 'int-1',
            studentId: 'demo-student',
            studentName: 'Imasha Sayakkara',
            companyName: 'Tech Solutions Ltd',
            companySupervisor: 'Tech Solutions Ltd',
            universitySupervisorId: user.uid,
            startDate: '2026-01-15',
            endDate: '2026-06-15',
            status: 'active' as const,
            progress: 45,
          }];

      setStudents(
        list.map((i) => {
          const studentDiaries = diaries.filter((d) => d.studentId === i.studentId);
          const studentReports = reports.filter((r) => r.studentId === i.studentId);
          return {
            ...i,
            diaryCount: studentDiaries.length,
            reportCount: studentReports.length,
            lastActivity: studentDiaries[0]?.date,
          };
        }),
      );
    });
  }, [user]);

  return (
    <div className="page">
      <PageHeader title="Assigned Students" subtitle="View student internship details and activity levels" />

      <Card>
        {students.length === 0 ? (
          <EmptyState message="No students assigned" />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Company</th>
                <th>Progress</th>
                <th>Diaries</th>
                <th>Reports</th>
                <th>Last Activity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.studentName}</strong></td>
                  <td>{s.companyName}</td>
                  <td>
                    <div className="progress-bar small">
                      <div className="progress-fill" style={{ width: `${s.progress}%` }} />
                    </div>
                    {s.progress}%
                  </td>
                  <td>{s.diaryCount}</td>
                  <td>{s.reportCount}</td>
                  <td>{s.lastActivity ?? 'No activity'}</td>
                  <td>{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

export function SupervisorReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    getReports().then((all) => {
      setReports(all.filter((r) => r.status === 'company_verified' || r.status === 'supervisor_approved'));
    });
  }, [user]);

  const approve = async (report: WeeklyReport) => {
    const { updateReport, createNotification } = await import('../../services/dataService');
    await updateReport(report.id, {
      status: 'supervisor_approved',
      supervisorFeedback: feedback[report.id] ?? 'Approved — good progress',
    });
    await createNotification({
      userId: report.studentId,
      title: 'Report Approved',
      message: `Your weekly report (${report.weekStart}) was approved by your university supervisor`,
      type: 'success',
    });
    setReports((prev) => prev.filter((r) => r.id !== report.id));
  };

  const reject = async (report: WeeklyReport) => {
    const { updateReport, createNotification } = await import('../../services/dataService');
    await updateReport(report.id, {
      status: 'rejected',
      supervisorFeedback: feedback[report.id] ?? 'Please revise and resubmit',
    });
    await createNotification({
      userId: report.studentId,
      title: 'Report Rejected',
      message: `Your weekly report (${report.weekStart}) needs revision`,
      type: 'warning',
    });
    setReports((prev) => prev.filter((r) => r.id !== report.id));
  };

  return (
    <div className="page">
      <PageHeader title="Report Review" subtitle="Approve or reject company-verified weekly reports" />

      <Card>
        {reports.length === 0 ? (
          <EmptyState message="No reports awaiting your review" />
        ) : (
          reports.map((report) => (
            <div key={report.id} className="report-item">
              <strong>{report.studentName} — Week {report.weekStart}</strong>
              <pre className="report-summary">{report.summary.slice(0, 500)}...</pre>
              {report.companyFeedback && <p><em>Company: {report.companyFeedback}</em></p>}
              <textarea
                placeholder="Supervisor feedback..."
                value={feedback[report.id] ?? ''}
                onChange={(e) => setFeedback({ ...feedback, [report.id]: e.target.value })}
              />
              <div className="form-actions">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => approve(report)}>Approve</button>
                <button type="button" className="btn btn-outline btn-sm danger" onClick={() => reject(report)}>Reject</button>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

export function SupervisorAnalyticsPage() {
  const [data, setData] = useState<{ name: string; progress: number; diaries: number }[]>([]);

  useEffect(() => {
    Promise.all([getInternships(), getDiaries()]).then(([internships, diaries]) => {
      const list = internships.length ? internships : [{
        studentName: 'Imasha Sayakkara',
        studentId: 'demo-student',
        progress: 45,
      } as never];

      setData(
        list.map((i: { studentName: string; studentId: string; progress: number }) => ({
          name: i.studentName.split(' ')[0],
          progress: i.progress,
          diaries: diaries.filter((d: DiaryEntry) => d.studentId === i.studentId).length,
        })),
      );
    });
  }, []);

  return (
    <div className="page">
      <PageHeader title="Analytics" subtitle="Performance insights across assigned students" />
      <Card>
        <table className="data-table">
          <thead>
            <tr><th>Student</th><th>Progress %</th><th>Diary Entries</th></tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.name}>
                <td>{d.name}</td>
                <td>{d.progress}%</td>
                <td>{d.diaries}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
