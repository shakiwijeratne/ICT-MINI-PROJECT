import { useEffect, useState } from 'react';
import { Sparkles, Send, FileDown } from 'lucide-react';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';
import { useAuth } from '../../contexts/useAuth';
import {
  getDiaries,
  getReports,
  createReport,
  updateReport,
  createNotification,
  getInternships,
  getEvaluations,
} from '../../services/dataService';
import { generateWeeklySummary } from '../../services/geminiService';
import { generateInternshipPDF } from '../../services/pdfServices';
import { PageHeader, Card, StatusBadge, EmptyState } from '../../components/ui';
import type { WeeklyReport, DiaryEntry } from '../../types';

export function StudentReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => {
    if (!user) return;
    Promise.all([getReports(user.uid), getDiaries(user.uid)]).then(([r, d]) => {
      setReports(r);
      setDiaries(d);
    });
  };

  useEffect(() => {
    load();
  }, [user]);

  const generateReport = async () => {
    if (!user) return;
    setGenerating(true);
    setMessage('');
    
    try {
      const now = new Date();
      const weekStart = format(startOfWeek(subWeeks(now, 0), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(subWeeks(now, 0), { weekStartsOn: 1 }), 'yyyy-MM-dd');

      const weekDiaries = diaries.filter((d) => d.date >= weekStart && d.date <= weekEnd);
      if (weekDiaries.length === 0) {
        setMessage('No diary entries found for this week. Add diary entries first.');
        return;
      }

      const summary = await generateWeeklySummary(
        weekDiaries.map((d) => `${d.date}: ${d.title}\n${d.content}`),
        weekStart,
        weekEnd,
      );

      await createReport({
        studentId: user.uid,
        studentName: user.displayName || 'Student',
        weekStart,
        weekEnd,
        summary,
        diaryIds: weekDiaries.map((d) => d.id),
        status: 'draft',
      });

      setMessage('Weekly report generated successfully');
      load();
    } catch (error) {
      console.error(error);
      setMessage('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const submitReport = async (report: WeeklyReport) => {
    if (!user) {
      setMessage('User session not found.');
      return;
    }

    try {
      // 1. Fetch active internship record to map real company/supervisor IDs
      const internships = await getInternships({ studentId: user.uid });
      const activeInternship = internships[0];

      if (!activeInternship) {
        setMessage('Failed to submit: No active internship record found.');
        return;
      }

      // 2. Update report status
      await updateReport(report.id, { 
        status: 'submitted', 
        submittedAt: new Date().toISOString() 
      });

      // 3. Dispatch notification to the actual company ID
      if (activeInternship.companyId) {
        await createNotification({
          userId: activeInternship.companyId,
          title: 'New Weekly Report',
          message: `${report.studentName} submitted a weekly report for ${report.weekStart}`,
          type: 'info',
          read: false,
        });
      }

      // 4. Dispatch notification to the actual supervisor ID
      if (activeInternship.supervisorId) {
        await createNotification({
          userId: activeInternship.supervisorId,
          title: 'Report Submitted',
          message: `${report.studentName} submitted weekly report — pending verification`,
          type: 'reminder',
          read: false,
        });
      }

      setMessage('Report submitted for company verification');
      load();
    } catch (error) {
      console.error('Submission error:', error);
      setMessage('Failed to submit report or dispatch notifications');
    }
  };

  const downloadFinalReport = async () => {
    if (!user) return;

    try {
      const internships = await getInternships({ studentId: user.uid });
      const evaluations = await getEvaluations(user.uid);

      if (!internships[0]) {
        setMessage('No internship record found');
        return;
      }

      generateInternshipPDF(
        internships[0],
        diaries,
        reports.filter((r) => r.status === 'supervisor_approved'),
        evaluations,
      );

      setMessage('Final PDF generated successfully');
    } catch (error) {
      console.error(error);
      setMessage('Failed to generate PDF');
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Weekly Reports"
        subtitle="Auto-generate reports from diary entries and submit for verification"
        action={
          <div className="header-actions">
            <button type="button" className="btn btn-outline" onClick={downloadFinalReport}>
              <FileDown size={16} /> Final Report
            </button>
            <button type="button" className="btn btn-primary" onClick={generateReport} disabled={generating}>
              <Sparkles size={16} /> {generating ? 'Generating...' : 'Generate This Week'}
            </button>
          </div>
        }
      />

      {message && <div className="alert alert-success">{message}</div>}

      <Card>
        {reports.length === 0 ? (
          <EmptyState message="No weekly reports yet. Generate one from your diary entries." />
        ) : (
          <div className="report-list">
            {reports.map((report) => (
              <div key={report.id} className="report-item">
                <div className="report-header">
                  <div>
                    <strong>Week: {report.weekStart} — {report.weekEnd}</strong>
                    <StatusBadge status={report.status} />
                  </div>
                  {report.status === 'draft' && (
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => submitReport(report)}>
                      <Send size={14} /> Submit
                    </button>
                  )}
                </div>

                <pre className="report-summary">{report.summary}</pre>

                {report.companyFeedback && (
                  <div className="feedback-block">
                    <strong>Company Feedback:</strong> {report.companyFeedback}
                  </div>
                )}

                {report.supervisorFeedback && (
                  <div className="feedback-block">
                    <strong>Supervisor Feedback:</strong> {report.supervisorFeedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}