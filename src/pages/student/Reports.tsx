import { useEffect, useState } from 'react';
import { Sparkles, Send, FileDown, Edit3, Save, CheckCircle2, AlertCircle } from 'lucide-react';
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
import { generateWeeklySummary, polishWeeklyReport } from '../../services/geminiService';
import { generateInternshipPDF } from '../../services/pdfServices';
import { PageHeader, Card, StatusBadge, EmptyState } from '../../components/ui';
import type { WeeklyReport, DiaryEntry } from '../../types';

export function StudentReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [generating, setGenerating] = useState(false);
  const [polishingId, setPolishingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState<string>('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const load = async () => {
    if (!user) return;
    try {
      const [r, d] = await Promise.all([getReports(user.uid), getDiaries(user.uid)]);
      setReports(r);
      setDiaries(d);
    } catch (err) {
      console.error('Error loading report data:', err);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  // Handler: Generate Initial Draft
  const handleGenerateReport = async () => {
    if (!user) return;
    setGenerating(true);
    setMessage(null);

    try {
      const now = new Date();
      const weekStart = format(startOfWeek(subWeeks(now, 0), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(subWeeks(now, 0), { weekStartsOn: 1 }), 'yyyy-MM-dd');

      // Check if report for this week already exists
      const existing = reports.find((r) => r.weekStart === weekStart);
      if (existing) {
        setMessage({ text: `A report for week ${weekStart} already exists below.`, type: 'info' });
        setGenerating(false);
        return;
      }

      const weekDiaries = diaries.filter((d) => d.date >= weekStart && d.date <= weekEnd);
      if (weekDiaries.length === 0) {
        setMessage({ text: 'No diary entries found for this week. Add daily entries first.', type: 'error' });
        setGenerating(false);
        return;
      }

      const summaryText = await generateWeeklySummary(
        weekDiaries.map((d) => `${d.date} (${d.title}): ${d.content}`),
        weekStart,
        weekEnd
      );

      const created = await createReport({
        studentId: user.uid,
        studentName: user.displayName || 'Student',
        weekStart,
        weekEnd,
        summary: summaryText,
        diaryIds: weekDiaries.map((d) => d.id),
        status: 'draft',
      });

      setMessage({ text: 'Draft report generated! You can now edit and review it before submission.', type: 'success' });
      await load();
      startEditing(created.id, created.summary);
    } catch (error) {
      console.error('Generation error:', error);
      setMessage({ text: 'Failed to generate weekly report draft.', type: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  // Handler: Start Editing
  const startEditing = (reportId: string, currentSummary: string) => {
    setEditingReportId(reportId);
    setDraftContent(currentSummary);
  };

  // Handler: Save Manual Edits
  const handleSaveDraft = async (reportId: string) => {
    setSavingId(reportId);
    try {
      await updateReport(reportId, { summary: draftContent });
      setMessage({ text: 'Draft changes saved successfully.', type: 'success' });
      await load();
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ text: 'Failed to save draft changes.', type: 'error' });
    } finally {
      setSavingId(null);
    }
  };

  // Handler: Polish Report with AI
  const handlePolishReport = async (reportId: string) => {
    if (!draftContent.trim()) return;
    setPolishingId(reportId);
    setMessage(null);

    try {
      const polished = await polishWeeklyReport(draftContent);
      setDraftContent(polished);
      await updateReport(reportId, { summary: polished });
      setMessage({ text: 'Report polished successfully! Grammar and formatting enhanced.', type: 'success' });
      await load();
    } catch (error: any) {
      console.error('Polish error:', error);
      setMessage({
        text: error.message || 'Unable to polish report at this time. You can manually edit the text.',
        type: 'error',
      });
    } finally {
      setPolishingId(null);
    }
  };

  // Handler: Finalize & Submit Report
  const handleSubmitReport = async (report: WeeklyReport) => {
    if (!user) return;
    setMessage(null);

    try {
      // 1. Fetch active internship record
      const internships = await getInternships({ studentId: user.uid });
      const activeInternship = internships[0];

      if (!activeInternship) {
        setMessage({ text: 'Failed to submit: No active internship record found.', type: 'error' });
        return;
      }

      // 2. Ensure current editor content is saved first if editing
      const finalSummary = editingReportId === report.id ? draftContent : report.summary;

      // 3. Update report status
      await updateReport(report.id, {
        summary: finalSummary,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      });

      // 4. Dispatch Notifications
      if (activeInternship.companyId) {
        await createNotification({
          userId: activeInternship.companyId,
          title: 'New Weekly Report Submitted',
          message: `${report.studentName} submitted weekly report for ${report.weekStart}`,
          type: 'info',
          read: false,
        });
      }

      if (activeInternship.supervisorId) {
        await createNotification({
          userId: activeInternship.supervisorId,
          title: 'Weekly Report Pending Review',
          message: `${report.studentName} submitted weekly report for ${report.weekStart}`,
          type: 'reminder',
          read: false,
        });
      }

      setMessage({ text: 'Report submitted successfully for company verification!', type: 'success' });
      setEditingReportId(null);
      await load();
    } catch (error) {
      console.error('Submission error:', error);
      setMessage({ text: 'Failed to submit report or send notifications.', type: 'error' });
    }
  };

  // Handler: Download PDF Compilation
  const handleDownloadPDF = async () => {
    if (!user) return;

    try {
      const internships = await getInternships({ studentId: user.uid });
      const evaluations = await getEvaluations(user.uid);

      if (!internships[0]) {
        setMessage({ text: 'No active internship record found.', type: 'error' });
        return;
      }

      const approvedReports = reports.filter((r) => r.status === 'supervisor_approved');

      generateInternshipPDF(internships[0], diaries, approvedReports, evaluations);
      setMessage({ text: 'Final PDF document generated successfully.', type: 'success' });
    } catch (error) {
      console.error('PDF error:', error);
      setMessage({ text: 'Failed to generate PDF document.', type: 'error' });
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Weekly Reports"
        subtitle="Synthesize daily diaries, edit and polish drafts, and submit for evaluation"
        action={
          <div className="header-actions">
            <button type="button" className="btn btn-outline" onClick={handleDownloadPDF}>
              <FileDown size={16} /> Export Final PDF
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGenerateReport}
              disabled={generating}
            >
              <Sparkles size={16} /> {generating ? 'Generating Draft...' : 'Generate This Week'}
            </button>
          </div>
        }
      />

      {message && (
        <div
          className={`alert ${
            message.type === 'success'
              ? 'alert-success'
              : message.type === 'error'
              ? 'alert-danger'
              : 'alert-info'
          }`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}
        >
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <Card>
        {reports.length === 0 ? (
          <EmptyState message="No weekly reports generated yet. Click 'Generate This Week' to begin." />
        ) : (
          <div className="report-list">
            {reports.map((report) => {
              const isEditable = report.status === 'draft' || report.status === 'rejected';
              const isEditingThis = editingReportId === report.id;

              return (
                <div key={report.id} className="report-item" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '24px', marginBottom: '24px' }}>
                  <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <strong style={{ fontSize: '1.1rem' }}>
                        Week: {report.weekStart} — {report.weekEnd}
                      </strong>
                      <span style={{ marginLeft: '12px' }}>
                        <StatusBadge status={report.status} />
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {isEditable && !isEditingThis && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => startEditing(report.id, report.summary)}
                        >
                          <Edit3 size={14} /> Edit Draft
                        </button>
                      )}

                      {isEditable && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSubmitReport(report)}
                        >
                          <Send size={14} /> Finalize & Submit
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Feedback Section */}
                  {report.companyFeedback && (
                    <div className="feedback-block" style={{ backgroundColor: '#fffbe3', padding: '10px', borderRadius: '6px', marginBottom: '12px' }}>
                      <strong>Company Feedback:</strong> {report.companyFeedback}
                    </div>
                  )}

                  {report.supervisorFeedback && (
                    <div className="feedback-block" style={{ backgroundColor: '#f0f9ff', padding: '10px', borderRadius: '6px', marginBottom: '12px' }}>
                      <strong>Supervisor Feedback:</strong> {report.supervisorFeedback}
                    </div>
                  )}

                  {report.rejectionReason && (
                    <div className="feedback-block" style={{ backgroundColor: '#fef2f2', padding: '10px', borderRadius: '6px', marginBottom: '12px', color: '#991b1b' }}>
                      <strong>Rejection Reason:</strong> {report.rejectionReason}
                    </div>
                  )}

                  {/* Editor vs View Mode */}
                  {isEditingThis ? (
                    <div className="report-editor" style={{ marginTop: '12px' }}>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
                        Inspect & Edit Draft Content (Markdown Supported):
                      </label>
                      <textarea
                        className="form-control"
                        rows={14}
                        style={{ fontFamily: 'monospace', fontSize: '14px', width: '100%', padding: '12px' }}
                        value={draftContent}
                        onChange={(e) => setDraftContent(e.target.value)}
                      />

                      <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleSaveDraft(report.id)}
                          disabled={savingId === report.id}
                        >
                          <Save size={14} /> {savingId === report.id ? 'Saving...' : 'Save Draft'}
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => handlePolishReport(report.id)}
                          disabled={polishingId === report.id}
                        >
                          <Sparkles size={14} /> {polishingId === report.id ? 'Polishing Language...' : 'Polish with AI'}
                        </button>

                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setEditingReportId(null)}
                        >
                          Done Editing
                        </button>
                      </div>
                    </div>
                  ) : (
                    <pre
                      className="report-summary"
                      style={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'inherit',
                        backgroundColor: '#f8fafc',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      {report.summary}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}