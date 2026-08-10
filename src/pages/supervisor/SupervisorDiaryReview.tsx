import { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "../../contexts/useAuth"; 
import { 
  getDiaries,
  approveDiary,
  rejectDiary,
  getInternships 
} from "../../services/dataService";
import { 
  PageHeader,
  Card,
  EmptyState
} from "../../components/ui";
import type { DiaryEntry } from "../../types";

export function SupervisorDiaryReview() {
  const { user } = useAuth(); // Get current supervisor
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Find all active internships where this user is the university supervisor
      const internships = await getInternships({ supervisorId: user.uid });
      const assignedStudentIds = internships.map((i) => i.studentId);

      if (assignedStudentIds.length === 0) {
        setDiaries([]);
        return;
      }

      // 2. Fetch diaries ONLY for these assigned students
      const allAssignedDiaries = await Promise.all(
        assignedStudentIds.map((studentId) => getDiaries(studentId))
      );

      // 3. Flatten the array and filter for pending status
      const pendingDiaries = allAssignedDiaries
        .flat()
        .filter((d) => d.status === "pending");

      setDiaries(pendingDiaries);
    } catch (error) {
      console.error("Failed to load diaries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [user]);

  const handleApprove = async (id: string) => {
    if (!user) return;
    await approveDiary(id, user.uid);
    load();
  };

  const handleReject = async (id: string) => {
    if (!user) return;
    // In a real scenario, you might want a prompt here to ask for the specific rejection reason!
    await rejectDiary(id, user.uid, "Please improve diary details");
    load();
  };

  return (
    <div className="page">
      <PageHeader
        title="Diary Review"
        subtitle="Review assigned student daily internship activities"
      />

      <Card>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading diaries...</div>
        ) : diaries.length === 0 ? (
          <EmptyState message="No pending diaries from your assigned students." />
        ) : (
          diaries.map((diary) => (
            <div key={diary.id} className="report-item" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
              <h3 style={{ marginTop: 0 }}>{diary.title}</h3>
              <p style={{ color: '#4b5563', whiteSpace: 'pre-wrap' }}>{diary.content}</p>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '0.9rem', color: '#64748b' }}>
                <span><strong>Date:</strong> {diary.date}</span>
                <span><strong>Hours:</strong> {diary.hoursWorked}</span>
              </div>

              <div className="actions" style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleApprove(diary.id)}
                >
                  <CheckCircle size={16} /> Approve
                </button>

                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleReject(diary.id)}
                >
                  <XCircle size={16} /> Reject
                </button>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}