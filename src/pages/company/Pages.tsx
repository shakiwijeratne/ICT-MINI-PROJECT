import { useEffect, useState } from 'react';
import {
  ClipboardCheck,
  Award,
  Users,
  Star,
  Trash2,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import {
  getReports,
  updateReport,
  createEvaluation,
  getEvaluations,
  updateEvaluation,
  deleteEvaluation,
  createNotification,
  getInternships,
} from '../../services/dataService';
import {
  PageHeader,
  Card,
  StatCard,
  StatusBadge,
  EmptyState,
} from '../../components/ui';
import {
  TECHNICAL_SKILLS,
  SOFT_SKILLS,
  type WeeklyReport,
  type Internship,
  type SkillEvaluation,
} from '../../types';
import { getAllUsers } from '../../services/authService';
import type { UserProfile } from '../../types';

export function CompanyDashboard() {
  const [pending, setPending] = useState<WeeklyReport[]>([]);

  useEffect(() => {
    getReports().then((all) =>
      setPending(all.filter((r) => r.status === 'submitted'))
    );
  }, []);

  return (
    <div className="page">
      <PageHeader
        title="Company Dashboard"
        subtitle="Verify intern reports and evaluate performance"
      />

      <div className="stats-grid">
        <StatCard
          label="Pending Verification"
          value={pending.length}
          icon={<ClipboardCheck size={24} />}
        />

        <StatCard
          label="Active Interns"
          value={1}
          icon={<Users size={24} />}
        />

        <StatCard
          label="Evaluations Due"
          value={pending.length}
          icon={<Award size={24} />}
        />
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
  const { user } = useAuth();

  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [processedReports, setProcessedReports] =
    useState<WeeklyReport[]>([]);
  const [studentsList, setStudentsList] = useState<UserProfile[]>([]);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedReportId, setSelectedReportId] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);

      try {
        const [allUsers, allReports, allInternships] =
          await Promise.all([
            getAllUsers(),
            getReports(),
            getInternships(),
          ]);

        /*
         * Find the company supervisor's user profile.
         *
         * We use the project's UserProfile type from src/types.
         */
        const companySupervisor = allUsers.find(
          (u) => u.uid === user.uid
        );

        /*
         * Find internships assigned to this company supervisor.
         *
         * Existing project logic:
         * - internship.companyId must match the supervisor's companyId
         * - internship.companySupervisor must match the logged-in
         *   supervisor's displayName
         */
        const assignedInternships = allInternships.filter(
          (internship) => {
            const sameCompany =
              internship.companyId ===
              companySupervisor?.companyId;

            const sameSupervisor =
              internship.companySupervisor === user.displayName;

            return sameCompany && sameSupervisor;
          }
        );

        /*
         * Get student IDs from the assigned internships.
         */
        const companyStudentIds = new Set(
          assignedInternships
            .map((internship) => internship.studentId)
            .filter(
              (studentId): studentId is string =>
                Boolean(studentId)
            )
        );

        /*
         * Get the actual student profiles.
         */
        const assignedStudents = allUsers.filter(
          (u) =>
            u.role === 'student' &&
            companyStudentIds.has(u.uid)
        );

        setStudentsList(assignedStudents);

        /*
         * Pending reports:
         * Reports belonging to assigned students and still
         * waiting for company verification.
         */
        const pendingReports = allReports.filter(
          (report) =>
            companyStudentIds.has(report.studentId) &&
            report.status === 'submitted'
        );

        /*
         * Previous/processed reports:
         * Reports belonging to assigned students that have
         * already passed the company verification stage.
         *
         * This includes:
         * - company_verified
         * - university_verified
         * - other later workflow statuses
         */
        const previousReports = allReports.filter(
          (report) =>
            companyStudentIds.has(report.studentId) &&
            report.status !== 'submitted'
        );

        setReports(pendingReports);
        setProcessedReports(previousReports);

        /*
         * Automatically select the first assigned student.
         */
        if (assignedStudents.length > 0) {
          const firstStudent = assignedStudents[0];

          setSelectedStudentId(firstStudent.uid);

          /*
           * Automatically select the newest previous report
           * for the first student, if one exists.
           */
          const firstStudentReports = previousReports
            .filter(
              (report) =>
                report.studentId === firstStudent.uid
            )
            .sort(
              (a, b) =>
                new Date(b.weekStart).getTime() -
                new Date(a.weekStart).getTime()
            );

          setSelectedReportId(
            firstStudentReports.length > 0
              ? firstStudentReports[0].id
              : ''
          );
        } else {
          setSelectedStudentId('');
          setSelectedReportId('');
        }
      } catch (error) {
        console.error(
          'Failed to fetch company verification data:',
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  /*
   * Previous reports belonging to the currently selected student.
   */
  const selectedStudentReports = processedReports
    .filter(
      (report) =>
        report.studentId === selectedStudentId
    )
    .sort(
      (a, b) =>
        new Date(b.weekStart).getTime() -
        new Date(a.weekStart).getTime()
    );

  /*
   * Get the currently selected previous report.
   */
  const selectedPreviousReport =
    selectedStudentReports.find(
      (report) => report.id === selectedReportId
    );

  /*
   * Change selected student and automatically select the
   * newest previous report for that student.
   */
  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);

    const studentReports = processedReports
      .filter(
        (report) =>
          report.studentId === studentId
      )
      .sort(
        (a, b) =>
          new Date(b.weekStart).getTime() -
          new Date(a.weekStart).getTime()
      );

    setSelectedReportId(
      studentReports.length > 0
        ? studentReports[0].id
        : ''
    );
  };

  /*
   * Verify a pending report.
   */
  const verify = async (report: WeeklyReport) => {
    if (!user) {
      return;
    }

    try {
      const companyFeedback =
        feedback[report.id]?.trim() ||
        'Activities verified';

      const approval = {
        supervisorId: user.uid,
        supervisorName:
          user.displayName || 'Company Supervisor',
        designation: 'Industry Supervisor',
        timestamp: new Date().toISOString(),
      };

      /*
       * Update the report in Firestore.
       */
      await updateReport(report.id, {
        status: 'company_verified',
        companyFeedback,
        companyApproval: approval,
      });

      /*
       * Find the student's university supervisor.
       */
      const allUsers = await getAllUsers();

      const studentProfile = allUsers.find(
        (u) => u.uid === report.studentId
      );

      const targetSupervisorId =
        studentProfile?.supervisorId;

      /*
       * Notify the university supervisor if one is assigned.
       */
      if (targetSupervisorId) {
        await createNotification({
          userId: targetSupervisorId,
          title: 'Report Verified',
          message: `${report.studentName}'s report verified by company — awaiting your approval`,
          type: 'info',
          read: false,
        });
      } else {
        console.warn(
          `No University Supervisor assigned for student ${report.studentName}. Notification skipped.`
        );
      }

      /*
       * Notify the student.
       */
      await createNotification({
        userId: report.studentId,
        title: 'Report Verified',
        message: `Your weekly report (${report.weekStart}) was verified by the company`,
        type: 'success',
        read: false,
      });

      /*
       * Remove the report from the pending list.
       */
      setReports((prev) =>
        prev.filter((r) => r.id !== report.id)
      );

      /*
       * Add the newly verified report to the previous
       * reports list immediately.
       */
      const updatedReport: WeeklyReport = {
        ...report,
        status: 'company_verified',
        companyFeedback,
        companyApproval: approval,
      };

      setProcessedReports((prev) => [
        updatedReport,
        ...prev.filter(
          (r) => r.id !== report.id
        ),
      ]);

      /*
       * Select the student and newly verified report so
       * it is immediately visible in the previous reports
       * section.
       */
      setSelectedStudentId(report.studentId);
      setSelectedReportId(report.id);

      /*
       * Clear the feedback field for the verified report.
       */
      setFeedback((prev) => {
        const updated = { ...prev };
        delete updated[report.id];
        return updated;
      });
    } catch (error) {
      console.error(
        'Failed to verify report:',
        error
      );
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Verify Weekly Reports"
        subtitle="Review and verify intern weekly activity reports"
      />

      {/* Pending reports */}
      <Card>
        <h3>Reports Awaiting Verification</h3>

        {loading ? (
          <p
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#64748b',
            }}
          >
            Loading reports...
          </p>
        ) : reports.length === 0 ? (
          <EmptyState message="No reports to verify" />
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="report-item"
            >
              <strong>
                {report.studentName} — {report.weekStart} to{' '}
                {report.weekEnd}
              </strong>

              <pre className="report-summary">
                {report.summary}
              </pre>

              <textarea
                placeholder="Verification feedback..."
                value={feedback[report.id] ?? ''}
                onChange={(e) =>
                  setFeedback((prev) => ({
                    ...prev,
                    [report.id]: e.target.value,
                  }))
                }
              />

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => verify(report)}
              >
                Verify Report
              </button>
            </div>
          ))
        )}
      </Card>

      {/* Previous approved/processed reports */}
      {!loading && (
        <Card>
          <h3>Previous Approved Reports</h3>

          {studentsList.length === 0 ? (
            <EmptyState message="No assigned students found." />
          ) : (
            <>
              <label>
                Assigned Student

                <select
                  value={selectedStudentId}
                  onChange={(e) =>
                    handleStudentChange(e.target.value)
                  }
                >
                  <option value="">
                    Select an assigned student
                  </option>

                  {studentsList.map((student) => (
                    <option
                      key={student.uid}
                      value={student.uid}
                    >
                      {student.displayName}
                    </option>
                  ))}
                </select>
              </label>

              {selectedStudentId && (
                <div style={{ marginTop: '20px' }}>
                  <label>
                    Previous Report

                    <select
                      value={selectedReportId}
                      onChange={(e) =>
                        setSelectedReportId(e.target.value)
                      }
                    >
                      <option value="">
                        Select a previous report
                      </option>

                      {selectedStudentReports.map(
                        (report) => (
                          <option
                            key={report.id}
                            value={report.id}
                          >
                            Week {report.weekStart} -{' '}
                            {report.weekEnd}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  {selectedStudentReports.length === 0 && (
                    <p
                      style={{
                        marginTop: '12px',
                        color: '#64748b',
                      }}
                    >
                      No previous approved reports found
                      for this student.
                    </p>
                  )}

                  {selectedPreviousReport && (
                    <div
                      className="report-item"
                      style={{
                        marginTop: '20px',
                      }}
                    >
                      <strong>
                        {selectedPreviousReport.studentName}
                        {' — '}
                        {selectedPreviousReport.weekStart}
                        {' to '}
                        {selectedPreviousReport.weekEnd}
                      </strong>

                      <div
                        style={{
                          marginTop: '10px',
                          marginBottom: '10px',
                        }}
                      >
                        <strong>Status: </strong>
                        {selectedPreviousReport.status}
                      </div>

                      <pre className="report-summary">
                        {selectedPreviousReport.summary}
                      </pre>

                      {selectedPreviousReport.companyFeedback && (
                        <div
                          style={{
                            marginTop: '15px',
                            padding: '12px',
                            background: '#f8fafc',
                            borderRadius: '8px',
                          }}
                        >
                          <strong>
                            Company Feedback
                          </strong>

                          <p
                            style={{
                              marginTop: '6px',
                              marginBottom: 0,
                            }}
                          >
                            {
                              selectedPreviousReport.companyFeedback
                            }
                          </p>
                        </div>
                      )}

                      {selectedPreviousReport.companyApproval && (
                        <div
                          style={{
                            marginTop: '15px',
                            padding: '12px',
                            background: '#f0fdf4',
                            borderRadius: '8px',
                          }}
                        >
                          <strong>
                            Company Approval
                          </strong>

                          <p
                            style={{
                              marginTop: '6px',
                              marginBottom: 0,
                            }}
                          >
                            Approved by:{' '}
                            {
                              selectedPreviousReport
                                .companyApproval
                                .supervisorName
                            }
                            <br />

                            Designation:{' '}
                            {
                              selectedPreviousReport
                                .companyApproval
                                .designation
                            }
                            <br />

                            Date:{' '}
                            {new Date(
                              selectedPreviousReport
                                .companyApproval
                                .timestamp
                            ).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
}




function Rating({
  value,
  setValue,
}: {
  value: number;
  setValue: (value: number) => void;
}) {
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
            color: num <= value ? '#f59e0b' : '#cbd5e1',
            transition: 'transform 0.1s ease, color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Star
            size={24}
            fill={num <= value ? '#f59e0b' : 'transparent'}
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

export function CompanyEvaluationsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Internship[]>([]);
  const [evaluations, setEvaluations] = useState<SkillEvaluation[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Internship | null>(null);
  const [currentEvaluation, setCurrentEvaluation] = useState<SkillEvaluation | null>(null);
  const [technical, setTechnical] = useState<Record<string, number>>(
    Object.fromEntries(TECHNICAL_SKILLS.map((s) => [s, 3]))
  );
  const [soft, setSoft] = useState<Record<string, number>>(
    Object.fromEntries(SOFT_SKILLS.map((s) => [s, 3]))
  );
  const [comments, setComments] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAssignedStudents = async () => {
      if (!user) return;

      try {
        const [allInternships, allUsers, allEvaluations] = await Promise.all([
          getInternships(),
          getAllUsers(),
          getEvaluations(),
        ]);

        const companySupervisor = allUsers.find((u) => u.uid === user.uid);

        const assignedStudents = allInternships.filter((internship) => {
          const sameCompany =
            internship.companyId === companySupervisor?.companyId;
          const sameSupervisor =
            internship.companySupervisor === user.displayName;

          return sameCompany && sameSupervisor;
        });

        setStudents(assignedStudents);
        setEvaluations(allEvaluations);
      } catch (error) {
        console.error('Error loading assigned students:', error);
      }
    };

    loadAssignedStudents();
  }, [user]);

  const resetForm = () => {
    setCurrentEvaluation(null);
    setTechnical(Object.fromEntries(TECHNICAL_SKILLS.map((s) => [s, 3])));
    setSoft(Object.fromEntries(SOFT_SKILLS.map((s) => [s, 3])));
    setComments('');
  };

  const handleStudentChange = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    setSelectedStudent(student ?? null);
    setMessage('');

    if (!student || !user) {
      resetForm();
      return;
    }

    const existingEvaluation = evaluations.find(
      (evaluation) =>
        evaluation.studentId === student.studentId &&
        evaluation.evaluatorId === user.uid &&
        evaluation.evaluatorRole === 'company'
    );

    if (existingEvaluation) {
      setCurrentEvaluation(existingEvaluation);
      setTechnical({
        ...Object.fromEntries(
          TECHNICAL_SKILLS.map((skill) => [
            skill,
            existingEvaluation.technicalSkills?.[skill] ?? 3,
          ])
        ),
      });

      setSoft({
        ...Object.fromEntries(
          SOFT_SKILLS.map((skill) => [
            skill,
            existingEvaluation.softSkills?.[skill] ?? 3,
          ])
        ),
      });

      setComments(existingEvaluation.comments ?? '');
    } else {
      resetForm();
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !selectedStudent) {
      return;
    }

    if (!comments.trim()) {
      setMessage(
        'Please enter comments or feedback before submitting the evaluation.'
      );
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const evaluationData = {
        studentId: selectedStudent.studentId,
        weekReportId: 'general',
        evaluatorId: user.uid,
        evaluatorRole: 'company' as const,
        technicalSkills: technical,
        softSkills: soft,
        comments: comments.trim(),
      };

      if (currentEvaluation) {
        await updateEvaluation(currentEvaluation.id, evaluationData);

        const updatedEvaluation: SkillEvaluation = {
          ...currentEvaluation,
          ...evaluationData,
        };

        setCurrentEvaluation(updatedEvaluation);
        setEvaluations((prev) =>
          prev.map((evaluation) =>
            evaluation.id === currentEvaluation.id
              ? updatedEvaluation
              : evaluation
          )
        );

        await createNotification({
          userId: selectedStudent.studentId,
          title: 'Company Evaluation Updated',
          message: 'Your company supervisor updated your skill evaluation.',
          type: 'info',
          read: false,
        });

        setMessage('Evaluation updated successfully.');
      } else {
        const newEvaluation = await createEvaluation(evaluationData);

        setCurrentEvaluation(newEvaluation);
        setEvaluations((prev) => [...prev, newEvaluation]);

        await createNotification({
          userId: selectedStudent.studentId,
          title: 'Skill Evaluation Received',
          message: 'Your company supervisor submitted a skill evaluation.',
          type: 'info',
          read: false,
        });

        setMessage('Evaluation submitted successfully.');
      }
    } catch (error) {
      console.error('Error saving company evaluation:', error);
      setMessage('Failed to save evaluation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeEvaluation = async () => {
    if (!currentEvaluation || !selectedStudent) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove the company evaluation for ${selectedStudent.studentName}? This will also remove these ratings from the student's progress chart.`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await deleteEvaluation(currentEvaluation.id);

      setEvaluations((prev) =>
        prev.filter((evaluation) => evaluation.id !== currentEvaluation.id)
      );

      resetForm();

      await createNotification({
        userId: selectedStudent.studentId,
        title: 'Company Evaluation Removed',
        message:
          'Your company evaluation was removed and is no longer included in your skill ratings.',
        type: 'warning',
        read: false,
      });

      setMessage('Evaluation removed successfully.');
    } catch (error) {
      console.error('Error removing company evaluation:', error);
      setMessage('Failed to remove evaluation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Skill Evaluation"
        subtitle="Rate intern technical and soft skills"
      />

      {message && <div className="alert alert-success">{message}</div>}

      <Card>
        <form onSubmit={submit} className="form-stack">
          <label>
            Assigned Student
            <select
              value={selectedStudent?.id ?? ''}
              onChange={(e) => handleStudentChange(e.target.value)}
              required
            >
              <option value="">Select an assigned student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.studentName}
                </option>
              ))}
            </select>
          </label>

          {currentEvaluation && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: '#eff6ff',
                borderRadius: '8px',
                color: '#1d4ed8',
                fontSize: '0.9rem',
              }}
            >
              <Edit3 size={17} />
              <span>
                This student has already been evaluated. You can update or
                remove the existing evaluation.
              </span>
            </div>
          )}

          {selectedStudent && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '32px',
                  marginTop: '20px',
                }}
              >
                <div>
                  <h4>Technical Skills</h4>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '18px',
                      marginTop: '15px',
                    }}
                  >
                    {TECHNICAL_SKILLS.map((skill) => (
                      <div key={skill}>
                        <div
                          style={{
                            marginBottom: '6px',
                            fontWeight: 500,
                          }}
                        >
                          {skill}
                        </div>
                        <Rating
                          value={technical[skill] ?? 3}
                          setValue={(value) =>
                            setTechnical((prev) => ({
                              ...prev,
                              [skill]: value,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4>Soft Skills</h4>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '18px',
                      marginTop: '15px',
                    }}
                  >
                    {SOFT_SKILLS.map((skill) => (
                      <div key={skill}>
                        <div
                          style={{
                            marginBottom: '6px',
                            fontWeight: 500,
                          }}
                        >
                          {skill}
                        </div>
                        <Rating
                          value={soft[skill] ?? 3}
                          setValue={(value) =>
                            setSoft((prev) => ({
                              ...prev,
                              [skill]: value,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <label>
                Comments
                <textarea
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Write feedback about the student's performance..."
                  required
                />
              </label>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                }}
              >
                {currentEvaluation && (
                  <button
                    type="button"
                    className="btn"
                    onClick={removeEvaluation}
                    disabled={loading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      background: '#fee2e2',
                      color: '#b91c1c',
                      border: '1px solid #fecaca',
                    }}
                  >
                    <Trash2 size={18} />
                    {loading ? 'Removing...' : 'Remove Evaluation'}
                  </button>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!selectedStudent || loading}
                >
                  {loading
                    ? 'Saving...'
                    : currentEvaluation
                    ? 'Update Evaluation'
                    : 'Submit Evaluation'}
                </button>
              </div>
            </>
          )}
        </form>
      </Card>
    </div>
  );
}