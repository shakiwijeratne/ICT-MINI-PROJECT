import { useEffect, useState } from 'react';
import {
  Award,
  Save,
  Star,
  Users,
  Trash2,
  Edit3,
} from 'lucide-react';

import { useAuth } from '../../contexts/useAuth';

import {
  getInternships,
  createEvaluation,
  getEvaluations,
  updateEvaluation,
  deleteEvaluation,
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

function Rating({
  value,
  setValue,
}: RatingProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
      }}
    >
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
            color:
              num <= value
                ? '#f59e0b'
                : '#cbd5e1',
            transition:
              'transform 0.1s ease, color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform =
              'scale(1.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform =
              'scale(1)';
          }}
        >
          <Star
            size={24}
            fill={
              num <= value
                ? '#f59e0b'
                : 'transparent'
            }
          />
        </button>
      ))}

      <span
        style={{
          marginLeft: '10px',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: '#64748b',
        }}
      >
        {value} / 5
      </span>
    </div>
  );
}

export function SupervisorEvaluationPage() {
  const { user } = useAuth();

  const [students, setStudents] =
    useState<Internship[]>([]);

  const [evaluations, setEvaluations] =
    useState<SkillEvaluation[]>([]);

  const [selectedStudent, setSelectedStudent] =
    useState<Internship | null>(null);

  const [currentEvaluation, setCurrentEvaluation] =
    useState<SkillEvaluation | null>(null);

  const [technicalSkills, setTechnicalSkills] =
    useState(3);

  const [communicationSkills, setCommunicationSkills] =
    useState(3);

  const [teamworkSkills, setTeamworkSkills] =
    useState(3);

  const [problemSolvingSkills, setProblemSolvingSkills] =
    useState(3);

  const [feedback, setFeedback] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [loading, setLoading] =
    useState(false);
 


  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [
          internshipData,
          evaluationData,
        ] = await Promise.all([
          getInternships({
            supervisorId: user.uid,
          }),
          getEvaluations(),
        ]);

        setStudents(internshipData);
        setEvaluations(evaluationData);
      } catch (error) {
        console.error(
          'Error loading supervisor evaluation data:',
          error
        );
      }
    };

    loadData();
  }, [user]);

  

  const resetForm = () => {
    setCurrentEvaluation(null);

    setTechnicalSkills(3);
    setCommunicationSkills(3);
    setTeamworkSkills(3);
    setProblemSolvingSkills(3);

    setFeedback('');
  };
 

  const handleStudentChange = (
    studentId: string
  ) => {
    const student = students.find(
      (s) => s.id === studentId
    );

    setSelectedStudent(
      student ?? null
    );

    setMessage('');

    if (!student || !user) {
      resetForm();
      return;
    }

     
    const existingEvaluation =
      evaluations.find(
        (evaluation) =>
          evaluation.studentId ===
            student.studentId &&
          evaluation.evaluatorId ===
            user.uid &&
          evaluation.evaluatorRole ===
            'supervisor'
      );

    if (existingEvaluation) {
      setCurrentEvaluation(
        existingEvaluation
      );

      const programming =
        existingEvaluation
          .technicalSkills?.Programming ??
        3;

      const communication =
        existingEvaluation
          .softSkills?.Communication ??
        3;

      const teamwork =
        existingEvaluation
          .softSkills?.Teamwork ??
        3;

      const problemSolving =
        existingEvaluation
          .softSkills?.ProblemSolving ??
        3;

      setTechnicalSkills(
        programming
      );

      setCommunicationSkills(
        communication
      );

      setTeamworkSkills(teamwork);

      setProblemSolvingSkills(
        problemSolving
      );

      setFeedback(
        existingEvaluation.comments ??
          ''
      );
    } else {
      resetForm();
    }
  };

   

  const submitEvaluation = async () => {
    if (!selectedStudent || !user) {
      return;
    }

    if (!feedback.trim()) {
      setMessage(
        'Please enter feedback before submitting the evaluation.'
      );
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const evaluationData = {
        studentId:
          selectedStudent.studentId,

        weekReportId: 'final',

        evaluatorId: user.uid,

        evaluatorRole:
          'supervisor' as const,

        technicalSkills: {
          Programming:
            technicalSkills,
        },

        softSkills: {
          Communication:
            communicationSkills,

          Teamwork:
            teamworkSkills,

          ProblemSolving:
            problemSolvingSkills,
        },

        comments: feedback.trim(),
      };

      
      if (currentEvaluation) {
        await updateEvaluation(
          currentEvaluation.id,
          evaluationData
        );

        const updatedEvaluation: SkillEvaluation =
          {
            ...currentEvaluation,
            ...evaluationData,
          };

        setCurrentEvaluation(
          updatedEvaluation
        );

        setEvaluations((prev) =>
          prev.map((evaluation) =>
            evaluation.id ===
            currentEvaluation.id
              ? updatedEvaluation
              : evaluation
          )
        );

        await createNotification({
          userId:
            selectedStudent.studentId,

          title:
            'Evaluation Updated',

          message:
            'Your supervisor updated your internship skill evaluation.',

          type: 'info',

          read: false,
        });

        setMessage(
          'Evaluation updated successfully.'
        );
      }

       

      else {
        const newEvaluation =
          await createEvaluation(
            evaluationData
          );

        setCurrentEvaluation(
          newEvaluation
        );

        setEvaluations((prev) => [
          ...prev,
          newEvaluation,
        ]);

        await createNotification({
          userId:
            selectedStudent.studentId,

          title:
            'New Evaluation Completed',

          message:
            'Your supervisor completed your internship skill evaluation.',

          type: 'success',

          read: false,
        });

        setMessage(
          'Evaluation submitted successfully.'
        );
      }
    } catch (error) {
      console.error(
        'Error saving evaluation:',
        error
      );

      setMessage(
        'Failed to save evaluation. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  

  const removeEvaluation = async () => {
    if (!currentEvaluation || !selectedStudent) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove the evaluation for ${selectedStudent.studentName}? This will also remove the rating from the student's progress chart.`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await deleteEvaluation(
        currentEvaluation.id
      );

      setEvaluations((prev) =>
        prev.filter(
          (evaluation) =>
            evaluation.id !==
            currentEvaluation.id
        )
      );

      resetForm();

      await createNotification({
        userId:
          selectedStudent.studentId,

        title:
          'Evaluation Removed',

        message:
          'Your supervisor evaluation was removed and will no longer be included in your skill ratings.',

        type: 'warning',

        read: false,
      });

      setMessage(
        'Evaluation removed successfully.'
      );
    } catch (error) {
      console.error(
        'Error removing evaluation:',
        error
      );

      setMessage(
        'Failed to remove evaluation. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };
 

  return (
    <div
      className="page"
      style={{
        paddingBottom: '40px',
      }}
    >
      <PageHeader
        title="Student Evaluation"
        subtitle="Evaluate technical and soft skills of assigned interns"
      />

      {message && (
        <div
          className="alert alert-success"
          style={{
            marginBottom: '20px',
          }}
        >
          {message}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        
        <Card>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <Users
              size={22}
              color="#2563eb"
            />

            <h3
              style={{
                margin: 0,
                fontSize: '1.1rem',
              }}
            >
              Select Student
            </h3>
          </div>

          {students.length === 0 ? (
            <EmptyState message="No assigned students" />
          ) : (
            <select
              className="form-control"
              value={
                selectedStudent?.id ?? ''
              }
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border:
                  '1px solid #cbd5e1',
              }}
              onChange={(e) =>
                handleStudentChange(
                  e.target.value
                )
              }
            >
              <option value="">
                -- Choose an intern to evaluate --
              </option>

              {students.map((student) => (
                <option
                  key={student.id}
                  value={student.id}
                >
                  {student.studentName}{' '}
                  ({student.companyName})
                </option>
              ))}
            </select>
          )}
        </Card>

        

        {selectedStudent && (
          <Card>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '24px',
                borderBottom:
                  '1px solid #e2e8f0',
                paddingBottom: '12px',
              }}
            >
              <Award
                size={22}
                color="#2563eb"
              />

              <h3
                style={{
                  margin: 0,
                  fontSize: '1.1rem',
                }}
              >
                Skill Evaluation for{' '}
                {
                  selectedStudent.studentName
                }
              </h3>
            </div>

            {/* Existing evaluation indicator */}

            {currentEvaluation && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  marginBottom: '20px',
                  background:
                    '#eff6ff',
                  borderRadius: '8px',
                  color: '#1d4ed8',
                  fontSize: '0.9rem',
                }}
              >
                <Edit3 size={17} />

                <span>
                  This student has already
                  been evaluated. You can
                  update or remove the
                  existing evaluation.
                </span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {/* Technical */}

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  background:
                    '#f8fafc',
                  padding:
                    '12px 16px',
                  borderRadius: '8px',
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: '#334155',
                  }}
                >
                  Technical Skills
                </label>

                <Rating
                  value={
                    technicalSkills
                  }
                  setValue={
                    setTechnicalSkills
                  }
                />
              </div>

              {/* Communication */}

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  background:
                    '#f8fafc',
                  padding:
                    '12px 16px',
                  borderRadius: '8px',
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: '#334155',
                  }}
                >
                  Communication Skills
                </label>

                <Rating
                  value={
                    communicationSkills
                  }
                  setValue={
                    setCommunicationSkills
                  }
                />
              </div>

              {/* Teamwork */}

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  background:
                    '#f8fafc',
                  padding:
                    '12px 16px',
                  borderRadius: '8px',
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: '#334155',
                  }}
                >
                  Teamwork Skills
                </label>

                <Rating
                  value={
                    teamworkSkills
                  }
                  setValue={
                    setTeamworkSkills
                  }
                />
              </div>

              {/* Problem Solving */}

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  background:
                    '#f8fafc',
                  padding:
                    '12px 16px',
                  borderRadius: '8px',
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: '#334155',
                  }}
                >
                  Problem Solving
                </label>

                <Rating
                  value={
                    problemSolvingSkills
                  }
                  setValue={
                    setProblemSolvingSkills
                  }
                />
              </div>

              {/* Feedback */}

              <div
                style={{
                  display: 'flex',
                  flexDirection:
                    'column',
                  gap: '8px',
                  marginTop: '10px',
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: '#334155',
                  }}
                >
                  Supervisor Feedback &
                  Comments
                </label>

                <textarea
                  className="feedback-input"
                  placeholder="Write detailed supervisor feedback here..."
                  value={feedback}
                  onChange={(e) =>
                    setFeedback(
                      e.target.value
                    )
                  }
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '12px',
                    borderRadius: '8px',
                    border:
                      '1px solid #cbd5e1',
                    fontFamily:
                      'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Buttons */}

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'flex-end',
                  gap: '10px',
                  marginTop: '10px',
                }}
              >
                {currentEvaluation && (
                  <button
                    type="button"
                    className="btn"
                    onClick={
                      removeEvaluation
                    }
                    disabled={loading}
                    style={{
                      display: 'flex',
                      alignItems:
                        'center',
                      gap: '8px',
                      padding:
                        '10px 20px',
                      cursor: loading
                        ? 'not-allowed'
                        : 'pointer',
                      background:
                        '#fee2e2',
                      color: '#b91c1c',
                      border:
                        '1px solid #fecaca',
                    }}
                  >
                    <Trash2 size={18} />

                    {loading
                      ? 'Removing...'
                      : 'Remove Evaluation'}
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={
                    submitEvaluation
                  }
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems:
                      'center',
                    gap: '8px',
                    padding:
                      '10px 20px',
                    cursor: loading
                      ? 'not-allowed'
                      : 'pointer',
                  }}
                >
                  <Save size={18} />

                  {loading
                    ? 'Saving...'
                    : currentEvaluation
                    ? 'Update Evaluation'
                    : 'Submit Evaluation'}
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
