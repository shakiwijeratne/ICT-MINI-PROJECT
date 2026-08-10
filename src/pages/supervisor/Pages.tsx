import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/useAuth';
import {
   getDiaries, getReports, updateReport, createNotification,getInternships
  } from '../../services/dataService';
import { getAllUsers } from '../../services/authService';
import { PageHeader, Card, EmptyState } from '../../components/ui';
import type { WeeklyReport, UserProfile} from '../../types';


export function SupervisorStudentsPage() {
  const { user } = useAuth();
  const [activeInterns, setActiveInterns] = useState<any[]>([]);
  const [searchingStudents, setSearchingStudents] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (!user || !user.uid) return;
    
    Promise.all([
      getAllUsers(),
      getInternships(),
      getDiaries(),
      getReports(),
    ]).then(([users, allInternships, diaries, reports]) => {
      // 1. Get all students assigned to this supervisor
      const assignedUsers = users.filter(
        (u) => u.role === 'student' && u.supervisorId === user.uid
      );
      const assignedStudentIds = new Set(assignedUsers.map((u) => u.uid));

      // 2. Filter internships belonging strictly to these assigned students
      const assignedInternships = allInternships.filter((i) => 
        assignedStudentIds.has(i.studentId)
      );
      const activeStudentIds = new Set(assignedInternships.map((i) => i.studentId));

      // 3. Separate them: Active vs Seeking Placement
      const active = assignedUsers.filter((s) => activeStudentIds.has(s.uid));
      const searching = assignedUsers.filter((s) => !activeStudentIds.has(s.uid));

      // 4. Map active interns with their progress and metrics
      setActiveInterns(
        active.map((s) => {
          const internship = assignedInternships.find((i) => i.studentId === s.uid);
          const studentDiaries = diaries.filter((d) => d.studentId === s.uid);
          const studentReports = reports.filter((r) => r.studentId === s.uid);
          const progress = internship?.progress ?? Math.min(100, studentDiaries.length * 10);
          
          return {
            ...s,
            companyName: internship?.companyName ?? s.companyName ?? 'Assigned Company',
            status: (s as any).status ?? 'active',
            progress,
            diaryCount: studentDiaries.length,
            reportCount: studentReports.length,
            lastActivity: studentDiaries[0]?.date ?? 'No activity',
          };
        })
      );

      // 5. Save searching students separately
      setSearchingStudents(searching);
    });
  }, [user]);

  return (
    <div className="page">
      <PageHeader title="Assigned Students" subtitle="Manage active placements and students seeking internships" />

      {/* SECTION 1: Active Interns */}
      <Card>
        <h3>Active Interns ({activeInterns.length})</h3>
        {activeInterns.length === 0 ? (
          <EmptyState message="No active interns currently placed" />
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
              </tr>
            </thead>
            <tbody>
              {activeInterns.map((s) => (
                <tr key={s.uid}>
                  <td><strong>{s.displayName}</strong></td>
                  <td>{s.companyName}</td>
                  <td>
                    <div className="progress-bar small">
                      <div className="progress-fill" style={{ width: `${s.progress}%` }} />
                    </div>
                    {s.progress}%
                  </td>
                  <td>{s.diaryCount}</td>
                  <td>{s.reportCount}</td>
                  <td>{s.lastActivity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* SECTION 2: Intern Searching Students */}
      <div style={{ marginTop: '2rem' }}>
        <Card >
          <h3>Students Seeking Internships ({searchingStudents.length})</h3>
          {searchingStudents.length === 0 ? (
            <EmptyState message="All assigned students have secured placements" />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Department</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {searchingStudents.map((s) => (
                  <tr key={s.uid}>
                    <td><strong>{s.displayName}</strong></td>
                    <td>{s.department ?? 'General'}</td>
                    <td>{s.email}</td>
                    <td><span className="badge badge-warning">Looking for Placement</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}

export function SupervisorReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    Promise.all([getAllUsers(), getReports()]).then(([users, allReports]) => {
      const assignedStudentIds = new Set(
        users.filter((u) => u.role === 'student' && u.supervisorId === user.uid).map((u) => u.uid)
      );

      const filtered = allReports.filter((r) => 
        (assignedStudentIds.size === 0 || assignedStudentIds.has(r.studentId)) &&
        (r.status === 'company_verified' || r.status === 'supervisor_approved')
      );
      setReports(filtered);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [user]);

  const approve = async (report: WeeklyReport) => {
    await updateReport(report.id, {
      status: 'supervisor_approved',
      supervisorFeedback: feedback[report.id] ?? 'Approved — good progress',
      uniApproval: {
        supervisorId: user?.uid || 'unknown-id',
        supervisorName: user?.displayName || 'University Supervisor',
        designation: 'Academic Supervisor',
        timestamp: new Date().toISOString(),
      }
    });

    // 1. Notify the Student (Already dynamic)
    await createNotification({
      userId: report.studentId,
      title: 'Report Approved',
      message: `Your weekly report (${report.weekStart}) was approved by your university supervisor`,
      type: 'success',
      read: false, // Make sure it's unread!
    });

    // 2. NEW: Fetch the internship to dynamically notify the Company Supervisor
    const internships = await getInternships();
    const studentInternship = internships.find((i) => i.studentId === report.studentId);
    const targetCompanyId = studentInternship?.companyId;

    if (targetCompanyId) {
      await createNotification({
        userId: targetCompanyId,
        title: 'Report Fully Approved',
        message: `${report.studentName}'s report for ${report.weekStart} received final university approval.`,
        type: 'success',
        read: false,
      });
    }else {
      console.warn(`No active company found for student ${report.studentName}. Notification skipped.`);
    }
    
    setReports((prev) => prev.filter((r) => r.id !== report.id));
  };

  const reject = async (report: WeeklyReport) => {
    await updateReport(report.id, {
      status: 'rejected',
      supervisorFeedback: feedback[report.id] ?? 'Please revise and resubmit',
    });
    await createNotification({
      userId: report.studentId,
      title: 'Report Rejected',
      message: `Your weekly report (${report.weekStart}) needs revision`,
      type: 'warning',
      read: false,
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
  const { user } = useAuth();
  const [data, setData] = useState<{ name: string; progress: number; diaries: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([getAllUsers(), getDiaries()]).then(([users, diaries]) => {
      const assignedStudents = users.filter(
        (u) => u.role === 'student' && u.supervisorId === user.uid
      );

      const list = assignedStudents.length ? assignedStudents : [{
        uid: 'demo-student',
        displayName: 'Imasha Sayakkara',
        email: 'imasha@example.com',
        role: 'student' as const,
        supervisorId: user.uid,
        createdAt: new Date().toISOString(),
      }];

      setData(
        list.map((s) => {
          const studentDiaries = diaries.filter((d) => d.studentId === s.uid);
          const progress = (s as any).progress ?? Math.min(100, studentDiaries.length * 10);
          return {
            name: (s.displayName ?? 'Student').split(' ')[0],
            progress,
            diaries: studentDiaries.length,
          };
        })
      );
    });
  }, [user]);

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