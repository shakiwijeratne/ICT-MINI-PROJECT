import { useEffect, useState } from 'react';
import { ClipboardCheck, Award, Users } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { getReports, updateReport, createEvaluation, createNotification } from '../../services/dataService';
import { PageHeader, Card, StatCard, StatusBadge, EmptyState } from '../../components/ui';
import { TECHNICAL_SKILLS, SOFT_SKILLS, type WeeklyReport } from '../../types';

export function CompanyDashboard() {
  const [pending, setPending] = useState<WeeklyReport[]>([]);

  useEffect(() => {
    getReports().then((all) => setPending(all.filter((r) => r.status === 'submitted')));
  }, []);

  return (
    <div className="page">
      <PageHeader title="Company Dashboard" subtitle="Verify intern reports and evaluate performance" />
      <div className="stats-grid">
        <StatCard label="Pending Verification" value={pending.length} icon={<ClipboardCheck size={24} />} />
        <StatCard label="Active Interns" value={1} icon={<Users size={24} />} />
        <StatCard label="Evaluations Due" value={pending.length} icon={<Award size={24} />} />
      </div>
      <Card>
        <h3>Reports Awaiting Verification</h3>
        {pending.length === 0 ? (
          <EmptyState message="No reports pending verification" />
        ) : (
          pending.map((r) => (
            <div key={r.id} className="item-list-row">
              <strong>{r.studentName}</strong>
              <span>Week {r.weekStart}</span>
              <StatusBadge status={r.status} />
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

export function CompanyVerifyPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    getReports().then((all) => setReports(all.filter((r) => r.status === 'submitted')));
  }, []);

  const verify = async (report: WeeklyReport) => {
    await updateReport(report.id, {
      status: 'company_verified',
      companyFeedback: feedback[report.id] ?? 'Activities verified',
    });
    await createNotification({
      userId: 'demo-supervisor',
      title: 'Report Verified',
      message: `${report.studentName}'s report verified by company — awaiting supervisor approval`,
      type: 'info',
    });
    await createNotification({
      userId: report.studentId,
      title: 'Report Verified',
      message: `Your weekly report (${report.weekStart}) was verified by the company`,
      type: 'success',
    });
    setReports((prev) => prev.filter((r) => r.id !== report.id));
  };

  return (
    <div className="page">
      <PageHeader title="Verify Weekly Reports" subtitle="Review and verify intern weekly activity reports" />
      <Card>
        {reports.length === 0 ? (
          <EmptyState message="No reports to verify" />
        ) : (
          reports.map((report) => (
            <div key={report.id} className="report-item">
              <strong>{report.studentName} — {report.weekStart} to {report.weekEnd}</strong>
              <pre className="report-summary">{report.summary}</pre>
              <textarea
                placeholder="Verification feedback..."
                value={feedback[report.id] ?? ''}
                onChange={(e) => setFeedback({ ...feedback, [report.id]: e.target.value })}
              />
              <button type="button" className="btn btn-primary" onClick={() => verify(report)}>
                Verify Report
              </button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

export function CompanyEvaluationsPage() {
  const { user } = useAuth();
  const [reportId, setReportId] = useState('');
  const [studentId, setStudentId] = useState('demo-student');
  const [technical, setTechnical] = useState<Record<string, number>>(
    Object.fromEntries(TECHNICAL_SKILLS.map((s) => [s, 3])),
  );
  const [soft, setSoft] = useState<Record<string, number>>(
    Object.fromEntries(SOFT_SKILLS.map((s) => [s, 3])),
  );
  const [comments, setComments] = useState('');
  const [message, setMessage] = useState('');
  const [reports, setReports] = useState<WeeklyReport[]>([]);

  useEffect(() => {
    getReports().then(setReports);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await createEvaluation({
      studentId,
      weekReportId: reportId || 'general',
      evaluatorId: user.uid,
      evaluatorRole: 'company',
      technicalSkills: technical,
      softSkills: soft,
      comments,
    });
    await createNotification({
      userId: studentId,
      title: 'Skill Evaluation Received',
      message: 'Your company supervisor submitted a skill evaluation',
      type: 'info',
    });
    setMessage('Evaluation submitted successfully');
  };

  return (
    <div className="page">
      <PageHeader title="Skill Evaluation" subtitle="Rate intern technical and soft skills" />
      {message && <div className="alert alert-success">{message}</div>}
      <Card>
        <form onSubmit={submit} className="form-stack">
          <label>
            Related Report
            <select value={reportId} onChange={(e) => {
              setReportId(e.target.value);
              const r = reports.find((rep) => rep.id === e.target.value);
              if (r) setStudentId(r.studentId);
            }}>
              <option value="">General evaluation</option>
              {reports.map((r) => (
                <option key={r.id} value={r.id}>{r.studentName} — {r.weekStart}</option>
              ))}
            </select>
          </label>

          <h4>Technical Skills (1-5)</h4>
          <div className="skill-grid">
            {TECHNICAL_SKILLS.map((skill) => (
              <label key={skill}>
                {skill}
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={technical[skill]}
                  onChange={(e) => setTechnical({ ...technical, [skill]: Number(e.target.value) })}
                />
                <span>{technical[skill]}</span>
              </label>
            ))}
          </div>

          <h4>Soft Skills (1-5)</h4>
          <div className="skill-grid">
            {SOFT_SKILLS.map((skill) => (
              <label key={skill}>
                {skill}
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={soft[skill]}
                  onChange={(e) => setSoft({ ...soft, [skill]: Number(e.target.value) })}
                />
                <span>{soft[skill]}</span>
              </label>
            ))}
          </div>

          <label>
            Comments
            <textarea rows={4} value={comments} onChange={(e) => setComments(e.target.value)} required />
          </label>

          <button type="submit" className="btn btn-primary">Submit Evaluation</button>
        </form>
      </Card>
    </div>
  );
}
