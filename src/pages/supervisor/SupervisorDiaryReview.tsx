import { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

import { 
  getDiaries,
  approveDiary,
  rejectDiary
} from "../../services/dataService";

import { 
  PageHeader,
  Card,
  EmptyState
} from "../../components/ui";

import type { DiaryEntry } from "../../types";

export function SupervisorDiaryReview() {
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);

  const load = async () => {
    const data = await getDiaries();
    setDiaries(data.filter((d) => d.status === "pending"));
  };

  useEffect(() => {
    load();
    window.scrollTo({top:0, behavior: 'smooth'});
  }, []);

  const handleApprove = async (id: string) => {
    await approveDiary(id, "supervisor");
    load();
  };

  const handleReject = async (id: string) => {
    await rejectDiary(id, "supervisor", "Please improve diary details");
    load();
  };

  return (
    <div className="page">
      <PageHeader
        title="Diary Review"
        subtitle="Review student daily internship activities"
      />

      <Card>
        {diaries.length === 0 ? (
          <EmptyState message="No pending diaries" />
        ) : (
          diaries.map((diary) => (
            <div key={diary.id} className="report-item">
              <h3>{diary.title}</h3>
              <p>{diary.content}</p>
              <p>Hours: {diary.hoursWorked}</p>

              <div className="actions">
                <button
                  className="btn btn-primary"
                  onClick={() => handleApprove(diary.id)}
                >
                  <CheckCircle size={16} />
                  Approve
                </button>

                <button
                  className="btn btn-outline"
                  onClick={() => handleReject(diary.id)}
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}