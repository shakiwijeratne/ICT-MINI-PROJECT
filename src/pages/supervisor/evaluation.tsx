import { useEffect, useState } from 'react';
import {
  Award,
  Save,
  Star,
  Users,
} from 'lucide-react';

import { useAuth } from '../../contexts/useAuth';
import {
  getInternships,
  createEvaluation,
  getEvaluations,
  createNotification,
} from '../../services/dataService';
import {
  PageHeader,
  Card,
  EmptyState,
} from '../../components/ui';
import type {
  Internship,
  SkillEvaluation,
} from '../../types';

interface RatingProps {
  value: number;
  setValue: (v: number) => void;
}

function Rating({ value, setValue }: RatingProps) {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => setValue(num)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: num <= value ? '#f59e0b' : '#cbd5e1',
            transition: 'transform 0.1s ease, color 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Star 
            size={24} 
            fill={num <= value ? '#f59e0b' : 'transparent'} 
          />
        </button>
      ))}
      <span style={{ marginLeft: '10px', fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>
        {value} / 5
      </span>
    </div>
  );
}

export function SupervisorEvaluationPage() {
  const { user } = useAuth();

  const [students, setStudents] = useState<Internship[]>([]);
  const [evaluations, setEvaluations] = useState<SkillEvaluation[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Internship | null>(null);

  const [technicalSkills, setTechnicalSkills] = useState(3);
  const [communicationSkills, setCommunicationSkills] = useState(3);
  const [teamworkSkills, setTeamworkSkills] = useState(3);
  const [problemSolvingSkills, setProblemSolvingSkills] = useState(3);

  const [feedback, setFeedback] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;

    Promise.all([
      getInternships({ supervisorId: user.uid }),
      getEvaluations(),
    ]).then(([internshipData, evaluationData]) => {
      setStudents(internshipData);
      setEvaluations(evaluationData);
    });
  }, [user]);

  const submitEvaluation = async () => {
    if (!selectedStudent || !user) return;

    await createEvaluation({
      studentId: selectedStudent.studentId,
      weekReportId: 'final',
      evaluatorId: user.uid,
      evaluatorRole: 'supervisor',
      technicalSkills: {
        Programming: technicalSkills,
      },
      softSkills: {
        Communication: communicationSkills,
        Teamwork: teamworkSkills,
        ProblemSolving: problemSolvingSkills,
      },
      comments: feedback,
    });

    await createNotification({
      userId: selectedStudent.studentId,
      title: 'New Evaluation Completed',
      message: 'Your supervisor completed your internship skill evaluation',
      type: 'success',
      read: true,
    });

    setMessage('Evaluation submitted successfully');
    setFeedback('');
  };

  return (
    <div className="page" style={{ paddingBottom: '40px' }}>
      <PageHeader
        title="Student Evaluation"
        subtitle="Evaluate technical and soft skills of assigned interns"
      />

      {message && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Users size={22} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Select Student</h3>
          </div>

          {students.length === 0 ? (
            <EmptyState message="No assigned students" />
          ) : (
            <select
              className="form-control"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              onChange={(e) => {
                const student = students.find((s) => s.id === e.target.value);
                setSelectedStudent(student ?? null);
              }}
            >
              <option value="">-- Choose an intern to evaluate --</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.studentName} ({student.companyName})
                </option>
              ))}
            </select>
          )}
        </Card>

        {selectedStudent && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <Award size={22} color="#2563eb" />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Skill Evaluation for {selectedStudent.studentName}</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px' }}>
                <label style={{ fontWeight: 600, color: '#334155' }}>Technical Skills</label>
                <Rating value={technicalSkills} setValue={setTechnicalSkills} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px' }}>
                <label style={{ fontWeight: 600, color: '#334155' }}>Communication Skills</label>
                <Rating value={communicationSkills} setValue={setCommunicationSkills} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px' }}>
                <label style={{ fontWeight: 600, color: '#334155' }}>Teamwork Skills</label>
                <Rating value={teamworkSkills} setValue={setTeamworkSkills} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px' }}>
                <label style={{ fontWeight: 600, color: '#334155' }}>Problem Solving</label>
                <Rating value={problemSolvingSkills} setValue={setProblemSolvingSkills} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                <label style={{ fontWeight: 600, color: '#334155' }}>Supervisor Feedback & Comments</label>
                <textarea
                  className="feedback-input"
                  placeholder="Write detailed supervisor feedback here..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={submitEvaluation}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', cursor: 'pointer' }}
                >
                  <Save size={18} />
                  Submit Evaluation
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}