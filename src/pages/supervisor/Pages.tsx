import { useEffect, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Building,
  UserCheck,
  Calendar,
  FileText,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import {
   getDiaries, getReports, updateReport, createNotification,getInternships
  } from '../../services/dataService';
import { getAllUsers } from '../../services/authService';
import { PageHeader, Card, EmptyState, StatCard, StatusBadge } from '../../components/ui';
import { ProcessedReportsAccordion } from '../../components/ui/ProcessedReportsAccordion';
import type { WeeklyReport, UserProfile, Internship} from '../../types';


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
  // 1. ADDED MISSING STATE FOR PROCESSED REPORTS
  const [processedReports, setProcessedReports] = useState<WeeklyReport[]>([]);
  const [studentsList, setStudentsList] = useState<UserProfile[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'warning'; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [users, allReports, allInternships] = await Promise.all([
          getAllUsers(),
          getReports(),
          getInternships(),
        ]);

        // 1. Get assigned student UIDs for this university supervisor
        const assignedStudents = users.filter((u) => u.role === 'student' && u.supervisorId === user.uid);
        const assignedStudentIds = new Set(assignedStudents.map((u) => u.uid));

        // 2. Filter reports strictly inside the async function where 'allReports' exists
        const pending = allReports.filter(
          (r) => (assignedStudentIds.size === 0 || assignedStudentIds.has(r.studentId)) && r.status === 'company_verified'
        );

        const processed = allReports.filter(
          (r) => assignedStudentIds.has(r.studentId) && (r.status === 'supervisor_approved' || r.status === 'rejected')
        );

        setReports(pending);
        setProcessedReports(processed); // 3. NOW THIS WORKS
        setInternships(allInternships);
        setStudentsList(assignedStudents);
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [user]);

  const approve = async (report: WeeklyReport) => {
    const supervisorComment = feedback[report.id]?.trim() || 'Approved — good academic progress';

    try {
      // 1. Grant final University Supervisor Approval
      await updateReport(report.id, {
        status: 'supervisor_approved',
        supervisorFeedback: supervisorComment,
        uniApproval: {
          supervisorId: user?.uid || 'unknown-id',
          supervisorName: user?.displayName || 'University Supervisor',
          designation: 'Academic Supervisor',
          timestamp: new Date().toISOString(),
        },
      });

      // 2. Notify Student
      await createNotification({
        userId: report.studentId,
        title: 'Report Approved',
        message: `Your weekly report (${report.weekStart}) received final university approval.`,
        type: 'success',
        read: false,
      });

      // 3. Notify Company Supervisor
      const studentInternship = internships.find((i) => i.studentId === report.studentId);
      if (studentInternship?.companyId) {
        await createNotification({
          userId: studentInternship.companyId,
          title: 'Report Fully Approved',
          message: `${report.studentName}'s report for ${report.weekStart} received final university approval.`,
          type: 'success',
          read: false,
        });
      }

      setActionMessage({ type: 'success', text: `Report for ${report.studentName} approved successfully.` });
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch (err) {
      console.error('Failed to approve report:', err);
    }
  };

  const reject = async (report: WeeklyReport) => {
    const supervisorComment = feedback[report.id]?.trim() || 'Please revise and resubmit.';

    try {
      await updateReport(report.id, {
        status: 'rejected',
        supervisorFeedback: supervisorComment,
      });

      await createNotification({
        userId: report.studentId,
        title: 'Report Revision Requested',
        message: `Your weekly report (${report.weekStart}) requires revision as requested by your university supervisor.`,
        type: 'warning',
        read: false,
      });

      setActionMessage({ type: 'warning', text: `Report for ${report.studentName} sent back for revision.` });
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch (err) {
      console.error('Failed to reject report:', err);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Academic Report Approval"
        subtitle="Review and grant final approval for company-verified weekly reports"
      />

      {/* Stats Summary */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          label="Pending Academic Approval"
          value={reports.length}
          icon={<Clock size={24} color="#f59e0b" />}
        />
      </div>

      {actionMessage && (
        <div className={`alert alert-${actionMessage.type}`} style={{ marginBottom: '1.2rem' }}>
          {actionMessage.text}
        </div>
      )}

      <Card>
        {loading ? (
          <p style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading pending reports...</p>
        ) : reports.length === 0 ? (
          <EmptyState message="No company-verified reports currently awaiting academic approval." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {reports.map((report) => {
              const studentInternship = internships.find((i) => i.studentId === report.studentId);
              const companyName = studentInternship?.companyName || 'Assigned Company';
              const companySupervisorName = report.companyApproval?.supervisorName || 'Industry Supervisor';

              return (
                <div
                  key={report.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '20px',
                    background: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  {/* Student & Internship Info */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginBottom: '14px',
                      borderBottom: '1px solid #f1f5f9',
                      paddingBottom: '12px',
                    }}
                  >
                    <div>
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: '#1e293b' }}>
                        {report.studentName}
                      </h3>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem', color: '#64748b', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Building size={16} /> {companyName}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Calendar size={16} /> Week: {report.weekStart} {report.weekEnd ? `to ${report.weekEnd}` : ''}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={report.status} />
                  </div>

                  {/* Company Verification Banner */}
                  <div
                    style={{
                      background: '#f0fdf4',
                      borderLeft: '4px solid #16a34a',
                      padding: '12px 16px',
                      borderRadius: '4px',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: 600, fontSize: '0.875rem', marginBottom: '4px' }}>
                      <UserCheck size={16} /> Verified by Company ({companySupervisorName})
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', fontStyle: 'italic' }}>
                      "{report.companyFeedback || 'Activities verified without additional notes.'}"
                    </p>
                  </div>

                  {/* Student Summary */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#475569', fontSize: '0.9rem', marginBottom: '6px' }}>
                      <FileText size={16} /> Weekly Summary
                    </div>
                    <pre
                      style={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'inherit',
                        background: '#f8fafc',
                        padding: '14px',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        color: '#1e293b',
                        border: '1px solid #e2e8f0',
                        margin: 0,
                      }}
                    >
                      {report.summary}
                    </pre>
                  </div>

                  {/* Academic Feedback Field */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#475569', fontSize: '0.875rem', marginBottom: '6px' }}>
                      <MessageSquare size={16} /> Academic Supervisor Feedback
                    </label>
                    <textarea
                      placeholder="Add supervisor feedback or guidance..."
                      value={feedback[report.id] ?? ''}
                      onChange={(e) => setFeedback({ ...feedback, [report.id]: e.target.value })}
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  {/* Approval Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                      type="button"
                      className="btn btn-outline danger"
                      onClick={() => reject(report)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <XCircle size={18} /> Reject / Request Revision
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => approve(report)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <CheckCircle size={18} /> Approve Report
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      <ProcessedReportsAccordion 
        reports={processedReports} 
        students={studentsList} 
        viewerRole="university_supervisor" 
      />
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