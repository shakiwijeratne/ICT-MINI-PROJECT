import { useEffect, useState } from 'react';

import {
  Building,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  UserCheck,
  XCircle,
} from 'lucide-react';

import { useAuth } from '../../contexts/useAuth';

import {
  getDiaries,
  getReports,
  updateReport,
  createNotification,
  getInternships,
} from '../../services/dataService';

import { getAllUsers } from '../../services/authService';

import {
  PageHeader,
  Card,
  EmptyState,
  StatCard,
} from '../../components/ui';

import type {
  WeeklyReport,
  UserProfile,
  Internship,
} from '../../types';


/* =========================================================
   STATUS BADGE
   ========================================================= */

function StatusBadge({
  status,
}: {
  status: WeeklyReport['status'];
}) {
  const statusConfig: Record<
    WeeklyReport['status'],
    {
      label: string;
      className: string;
    }
  > = {
    draft: {
      label: 'Draft',
      className: 'badge badge-secondary',
    },
    submitted: {
      label: 'Submitted',
      className: 'badge badge-warning',
    },
    company_verified: {
      label: 'Company Verified',
      className: 'badge badge-success',
    },
    supervisor_approved: {
      label: 'Supervisor Approved',
      className: 'badge badge-success',
    },
    rejected: {
      label: 'Rejected',
      className: 'badge badge-danger',
    },
  };

  const config = statusConfig[status];

  return (
    <span className={config.className}>
      {config.label}
    </span>
  );
}


/* =========================================================
   PROCESSED REPORTS ACCORDION
   ========================================================= */

function ProcessedReportsAccordion({
  reports,
  students,
  viewerRole,
}: {
  reports: WeeklyReport[];
  students: UserProfile[];
  viewerRole: 'university_supervisor';
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: '2rem' }}>
      <Card>
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            textAlign: 'left',
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>
              Processed Reports ({reports.length})
            </h3>

            <p
              style={{
                margin: '6px 0 0',
                color: '#64748b',
                fontSize: '0.875rem',
              }}
            >
              Previously approved or rejected reports
            </p>
          </div>

          <span
            style={{
              fontSize: '1.2rem',
              color: '#64748b',
            }}
          >
            {open ? '▲' : '▼'}
          </span>
        </button>

        {open && (
          <div style={{ marginTop: '1.5rem' }}>
            {reports.length === 0 ? (
              <EmptyState message="No processed reports available." />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {reports.map((report) => {
                  const student = students.find(
                    (item) => item.uid === report.studentId
                  );

                  return (
                    <div
                      key={report.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '16px',
                        background: '#f8fafc',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '12px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <strong
                            style={{
                              display: 'block',
                              marginBottom: '4px',
                            }}
                          >
                            {student?.displayName ||
                              report.studentName ||
                              'Student'}
                          </strong>

                          <span
                            style={{
                              color: '#64748b',
                              fontSize: '0.875rem',
                            }}
                          >
                            Week {report.weekStart}
                            {report.weekEnd
                              ? ` to ${report.weekEnd}`
                              : ''}
                          </span>
                        </div>

                        <StatusBadge status={report.status} />
                      </div>

                      {report.supervisorFeedback && (
                        <p
                          style={{
                            margin: '12px 0 0',
                            color: '#475569',
                            fontSize: '0.9rem',
                          }}
                        >
                          <strong>Academic Feedback:</strong>{' '}
                          {report.supervisorFeedback}
                        </p>
                      )}

                      {report.rejectionReason && (
                        <p
                          style={{
                            margin: '8px 0 0',
                            color: '#b91c1c',
                            fontSize: '0.9rem',
                          }}
                        >
                          <strong>Rejection Reason:</strong>{' '}
                          {report.rejectionReason}
                        </p>
                      )}

                      {viewerRole === 'university_supervisor' && (
                        <div
                          style={{
                            marginTop: '8px',
                            fontSize: '0.8rem',
                            color: '#94a3b8',
                          }}
                        >
                          Processed report
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}


/* =========================================================
   UNIVERSITY SUPERVISOR - STUDENTS
   ========================================================= */

export function SupervisorStudentsPage() {
  const { user } = useAuth();

  const [activeInterns, setActiveInterns] = useState<any[]>([]);
  const [searchingStudents, setSearchingStudents] =
    useState<UserProfile[]>([]);

  useEffect(() => {
    if (!user || !user.uid) return;

    Promise.all([
      getAllUsers(),
      getInternships(),
      getDiaries(),
      getReports(),
    ])
      .then(([users, allInternships, diaries, reports]) => {
        const assignedUsers = users.filter(
          (u) =>
            u.role === 'student' &&
            u.supervisorId === user.uid
        );

        const assignedStudentIds = new Set(
          assignedUsers.map((u) => u.uid)
        );

        const assignedInternships = allInternships.filter(
          (internship) =>
            assignedStudentIds.has(internship.studentId)
        );

        const activeStudentIds = new Set(
          assignedInternships.map(
            (internship) => internship.studentId
          )
        );

        const active = assignedUsers.filter(
          (student) =>
            activeStudentIds.has(student.uid)
        );

        const searching = assignedUsers.filter(
          (student) =>
            !activeStudentIds.has(student.uid)
        );

        setSearchingStudents(searching);

        const mappedActiveInterns = active.map(
          (student) => {
            const internship =
              assignedInternships.find(
                (i) =>
                  i.studentId === student.uid
              );

            const studentDiaries =
              diaries.filter(
                (diary) =>
                  diary.studentId === student.uid
              );

            const studentReports =
              reports.filter(
                (report) =>
                  report.studentId === student.uid
              );

            const progress =
              internship?.progress ??
              Math.min(
                100,
                studentDiaries.length * 10
              );

            let companySupervisor: any = null;

            if (internship) {
              if (internship.companyId) {
                companySupervisor = users.find(
                  (u) =>
                    u.role === 'company' &&
                    u.companyId ===
                      internship.companyId
                );
              }

              if (
                !companySupervisor &&
                internship.companySupervisor
              ) {
                companySupervisor = users.find(
                  (u) =>
                    u.role === 'company' &&
                    (
                      u.displayName ===
                        internship.companySupervisor ||
                      (u as any).name ===
                        internship.companySupervisor
                    )
                );
              }
            }

            return {
              ...student,

              studentName:
                student.displayName ??
                'Student',

              studentEmail:
                student.email ??
                'No email',

              companyName:
                internship?.companyName ??
                student.companyName ??
                'Assigned Company',

              status:
                (student as any).status ??
                internship?.status ??
                'active',

              progress,

              diaryCount:
                studentDiaries.length,

              reportCount:
                studentReports.length,

              lastActivity:
                studentDiaries.length > 0
                  ? (
                      studentDiaries[
                        studentDiaries.length - 1
                      ]?.date ??
                      'No activity'
                    )
                  : 'No activity',

              companySupervisorName:
                companySupervisor?.displayName ??
                (companySupervisor as any)?.name ??
                internship?.companySupervisor ??
                'Not Assigned',

              companySupervisorEmail:
                companySupervisor?.email ??
                'Not Available',

              companySupervisorId:
                companySupervisor?.uid ??
                null,
            };
          }
        );

        setActiveInterns(mappedActiveInterns);
      })
      .catch((error) => {
        console.error(
          'Error loading supervisor students:',
          error
        );

        setActiveInterns([]);
        setSearchingStudents([]);
      });
  }, [user]);

  return (
    <div className="page">
      <PageHeader
        title="Assigned Students"
        subtitle="Manage active placements and students seeking internships"
      />

      <Card>
        <h3>
          Active Interns ({activeInterns.length})
        </h3>

        {activeInterns.length === 0 ? (
          <EmptyState
            message="No active interns currently placed"
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Company</th>
                <th>Company Supervisor</th>
                <th>Supervisor Email</th>
                <th>Diaries</th>
                <th>Reports</th>
                <th>Last Activity</th>
              </tr>
            </thead>

            <tbody>
              {activeInterns.map((student) => (
                <tr key={student.uid}>
                  <td>
                    <strong>
                      {student.studentName}
                    </strong>
                  </td>

                  <td>
                    {student.studentEmail}
                  </td>

                  <td>
                    {student.companyName}
                  </td>

                  <td>
                    {student.companySupervisorName}
                  </td>

                  <td>
                    {student.companySupervisorEmail}
                  </td>

                  <td>
                    {student.diaryCount}
                  </td>

                  <td>
                    {student.reportCount}
                  </td>

                  <td>
                    {student.lastActivity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <div style={{ marginTop: '2rem' }}>
        <Card>
          <h3>
            Students Seeking Internships (
            {searchingStudents.length}
            )
          </h3>

          {searchingStudents.length === 0 ? (
            <EmptyState
              message="All assigned students have secured placements"
            />
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
                {searchingStudents.map(
                  (student) => (
                    <tr key={student.uid}>
                      <td>
                        <strong>
                          {student.displayName}
                        </strong>
                      </td>

                      <td>
                        {student.department ??
                          'General'}
                      </td>

                      <td>
                        {student.email}
                      </td>

                      <td>
                        <span className="badge badge-warning">
                          Looking for Placement
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}


/* =========================================================
   COMPANY SUPERVISOR - STUDENTS
   ========================================================= */

export function CompanySupervisorStudentsPage() {
  const { user } = useAuth();

  const [students, setStudents] =
    useState<any[]>([]);

  useEffect(() => {
    if (!user || !user.uid) return;

    Promise.all([
      getAllUsers(),
      getInternships(),
    ])
      .then(
        ([users, internships]) => {
          const companySupervisorName =
            user.displayName ??
            (user as any).name ??
            '';

          const companySupervisorCompanyId =
            (user as any).companyId ??
            null;

          const assignedInternships =
            internships.filter(
              (internship) => {
                const supervisorIdMatch =
                  internship.companyId ===
                  user.uid;

                const companyIdMatch =
                  companySupervisorCompanyId &&
                  internship.companyId ===
                    companySupervisorCompanyId;

                const supervisorNameMatch =
                  internship.companySupervisor &&
                  companySupervisorName &&
                  internship.companySupervisor ===
                    companySupervisorName;

                return (
                  supervisorIdMatch ||
                  companyIdMatch ||
                  supervisorNameMatch
                );
              }
            );

          const mappedStudents =
            assignedInternships
              .map((internship) => {
                const student =
                  users.find(
                    (u) =>
                      u.uid ===
                        internship.studentId &&
                      u.role === 'student'
                  );

                if (!student) {
                  return null;
                }

                let universitySupervisor: any =
                  null;

                if (student.supervisorId) {
                  universitySupervisor =
                    users.find(
                      (u) =>
                        u.uid ===
                        student.supervisorId
                    );
                }

                return {
                  studentId:
                    student.uid,

                  studentName:
                    student.displayName ??
                    'Student',

                  studentEmail:
                    student.email ??
                    'No email',

                  companyName:
                    internship.companyName ??
                    student.companyName ??
                    'Assigned Company',

                  universitySupervisorName:
                    universitySupervisor?.displayName ??
                    (universitySupervisor as any)?.name ??
                    'Not Assigned',

                  universitySupervisorEmail:
                    universitySupervisor?.email ??
                    'Not Available',

                  universitySupervisorId:
                    universitySupervisor?.uid ??
                    student.supervisorId ??
                    null,

                  internshipStatus:
                    internship.status ??
                    'active',
                };
              })
              .filter(Boolean);

          setStudents(
            mappedStudents as any[]
          );
        }
      )
      .catch((error) => {
        console.error(
          'Error loading company supervisor students:',
          error
        );

        setStudents([]);
      });
  }, [user]);

  return (
    <div className="page">
      <PageHeader
        title="My Assigned Students"
        subtitle="Students assigned to you for internship supervision"
      />

      <Card>
        <h3>
          Assigned Students ({students.length})
        </h3>

        {students.length === 0 ? (
          <EmptyState
            message="No students are currently assigned to you"
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Student Email</th>
                <th>Company</th>
                <th>University Supervisor</th>
                <th>University Supervisor Email</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {students.map(
                (student) => (
                  <tr
                    key={
                      student.studentId
                    }
                  >
                    <td>
                      <strong>
                        {student.studentName}
                      </strong>
                    </td>

                    <td>
                      {student.studentEmail}
                    </td>

                    <td>
                      {student.companyName}
                    </td>

                    <td>
                      {
                        student.universitySupervisorName
                      }
                    </td>

                    <td>
                      {
                        student.universitySupervisorEmail
                      }
                    </td>

                    <td>
                      <span className="badge badge-success">
                        {student.internshipStatus}
                      </span>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}


/* =========================================================
   UNIVERSITY SUPERVISOR - REPORTS
   ========================================================= */

export function SupervisorReportsPage() {
  const { user } = useAuth();

  const [reports, setReports] =
    useState<WeeklyReport[]>([]);

  const [processedReports, setProcessedReports] =
    useState<WeeklyReport[]>([]);

  const [studentsList, setStudentsList] =
    useState<UserProfile[]>([]);

  const [internships, setInternships] =
    useState<Internship[]>([]);

  const [feedback, setFeedback] =
    useState<Record<string, string>>({});

  const [loading, setLoading] =
    useState<boolean>(true);

  const [actionMessage, setActionMessage] =
    useState<{
      type: 'success' | 'warning';
      text: string;
    } | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);

      try {
        const [
          users,
          allReports,
          allInternships,
        ] = await Promise.all([
          getAllUsers(),
          getReports(),
          getInternships(),
        ]);

        /* Get students assigned to this university supervisor */
        const assignedStudents =
          users.filter(
            (u) =>
              u.role === 'student' &&
              u.supervisorId === user.uid
          );

        const assignedStudentIds =
          new Set(
            assignedStudents.map(
              (u) => u.uid
            )
          );

        /*
         * Pending reports:
         * Only company-verified reports should
         * appear in the academic supervisor's
         * approval queue.
         */
        const pending =
          allReports.filter(
            (report) =>
              (
                assignedStudentIds.size === 0 ||
                assignedStudentIds.has(
                  report.studentId
                )
              ) &&
              report.status ===
                'company_verified'
          );

        /*
         * Previously processed reports:
         * Keep approved and rejected reports
         * for the accordion below.
         */
        const processed =
          allReports.filter(
            (report) =>
              assignedStudentIds.has(
                report.studentId
              ) &&
              (
                report.status ===
                  'supervisor_approved' ||
                report.status ===
                  'rejected'
              )
          );

        setReports(pending);
        setProcessedReports(processed);
        setInternships(allInternships);
        setStudentsList(assignedStudents);
      } catch (error) {
        console.error(
          'Failed to fetch reports:',
          error
        );

        setReports([]);
        setProcessedReports([]);
        setInternships([]);
        setStudentsList([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [user]);

  const approve = async (
    report: WeeklyReport
  ) => {
    const supervisorComment =
      feedback[report.id]?.trim() ||
      'Approved — good academic progress';

    try {
      /*
       * Grant final university supervisor approval.
       */
      await updateReport(
        report.id,
        {
          status:
            'supervisor_approved',

          supervisorFeedback:
            supervisorComment,

          uniApproval: {
            supervisorId:
              user?.uid ||
              'unknown-id',

            supervisorName:
              user?.displayName ||
              'University Supervisor',

            designation:
              'Academic Supervisor',

            timestamp:
              new Date().toISOString(),
          },
        }
      );

      /*
       * Notify student.
       */
      await createNotification({
        userId:
          report.studentId,

        title:
          'Report Approved',

        message:
          `Your weekly report (${report.weekStart}) received final university approval.`,

        type:
          'success',

        read:
          false,
      });

      /*
       * Find the internship belonging
       * to this student.
       */
      const studentInternship =
        internships.find(
          (internship) =>
            internship.studentId ===
            report.studentId
        );

      /*
       * Notify company supervisor.
       */
      if (
        studentInternship?.companyId
      ) {
        await createNotification({
          userId:
            studentInternship.companyId,

          title:
            'Report Fully Approved',

          message:
            `${report.studentName}'s report for ${report.weekStart} received final university approval.`,

          type:
            'success',

          read:
            false,
        });
      }

      setActionMessage({
        type: 'success',
        text:
          `Report for ${report.studentName} approved successfully.`,
      });

      /*
       * Remove from pending list.
       */
      setReports(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !== report.id
          )
      );

      /*
       * Add to processed reports immediately
       * so the UI updates without refreshing.
       */
      setProcessedReports(
        (previous) => [
          {
            ...report,
            status:
              'supervisor_approved',
            supervisorFeedback:
              supervisorComment,
          },
          ...previous.filter(
            (item) =>
              item.id !== report.id
          ),
        ]
      );

      /*
       * Clear feedback field for this report.
       */
      setFeedback(
        (previous) => {
          const updated = {
            ...previous,
          };

          delete updated[report.id];

          return updated;
        }
      );
    } catch (err) {
      console.error(
        'Failed to approve report:',
        err
      );

      setActionMessage({
        type: 'warning',
        text:
          'Failed to approve the report. Please try again.',
      });
    }
  };

  const reject = async (
    report: WeeklyReport
  ) => {
    const supervisorComment =
      feedback[report.id]?.trim() ||
      'Please revise and resubmit.';

    try {
      await updateReport(
        report.id,
        {
          status:
            'rejected',

          supervisorFeedback:
            supervisorComment,
        }
      );

      await createNotification({
        userId:
          report.studentId,

        title:
          'Report Revision Requested',

        message:
          `Your weekly report (${report.weekStart}) requires revision as requested by your university supervisor.`,

        type:
          'warning',

        read:
          false,
      });

      setActionMessage({
        type: 'warning',
        text:
          `Report for ${report.studentName} sent back for revision.`,
      });

      /*
       * Remove from pending list.
       */
      setReports(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !== report.id
          )
      );

      /*
       * Add to processed reports.
       */
      setProcessedReports(
        (previous) => [
          {
            ...report,
            status:
              'rejected',
            supervisorFeedback:
              supervisorComment,
          },
          ...previous.filter(
            (item) =>
              item.id !== report.id
          ),
        ]
      );

      /*
       * Clear feedback field.
       */
      setFeedback(
        (previous) => {
          const updated = {
            ...previous,
          };

          delete updated[report.id];

          return updated;
        }
      );
    } catch (err) {
      console.error(
        'Failed to reject report:',
        err
      );

      setActionMessage({
        type: 'warning',
        text:
          'Failed to reject the report. Please try again.',
      });
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Academic Report Approval"
        subtitle="Review and grant final approval for company-verified weekly reports"
      />

      {/* Stats Summary */}
      <div
        className="stats-grid"
        style={{
          marginBottom: '1.5rem',
        }}
      >
        <StatCard
          label="Pending Academic Approval"
          value={reports.length}
          icon={
            <Clock
              size={24}
              color="#f59e0b"
            />
          }
        />
      </div>

      {actionMessage && (
        <div
          className={`alert alert-${actionMessage.type}`}
          style={{
            marginBottom: '1.2rem',
          }}
        >
          {actionMessage.text}
        </div>
      )}

      <Card>
        {loading ? (
          <p
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#64748b',
            }}
          >
            Loading pending reports...
          </p>
        ) : reports.length === 0 ? (
          <EmptyState
            message="No company-verified reports currently awaiting academic approval."
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {reports.map((report) => {
              const studentInternship =
                internships.find(
                  (internship) =>
                    internship.studentId ===
                    report.studentId
                );

              const companyName =
                studentInternship?.companyName ||
                'Assigned Company';

              const companySupervisorName =
                report.companyApproval
                  ?.supervisorName ||
                'Industry Supervisor';

              return (
                <div
                  key={report.id}
                  style={{
                    border:
                      '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '20px',
                    background: '#ffffff',
                    boxShadow:
                      '0 1px 3px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  {/* Student & Internship Info */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems:
                        'flex-start',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginBottom: '14px',
                      borderBottom:
                        '1px solid #f1f5f9',
                      paddingBottom: '12px',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin:
                            '0 0 6px 0',
                          fontSize:
                            '1.15rem',
                          color:
                            '#1e293b',
                        }}
                      >
                        {report.studentName}
                      </h3>

                      <div
                        style={{
                          display:
                            'flex',
                          gap: '16px',
                          fontSize:
                            '0.875rem',
                          color:
                            '#64748b',
                          flexWrap:
                            'wrap',
                        }}
                      >
                        <span
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap: '5px',
                          }}
                        >
                          <Building
                            size={16}
                          />
                          {companyName}
                        </span>

                        <span
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap: '5px',
                          }}
                        >
                          <Calendar
                            size={16}
                          />
                          Week:{' '}
                          {report.weekStart}
                          {report.weekEnd
                            ? ` to ${report.weekEnd}`
                            : ''}
                        </span>
                      </div>
                    </div>

                    <StatusBadge
                      status={
                        report.status
                      }
                    />
                  </div>

                  {/* Company Verification Banner */}
                  <div
                    style={{
                      background:
                        '#f0fdf4',
                      borderLeft:
                        '4px solid #16a34a',
                      padding:
                        '12px 16px',
                      borderRadius: '4px',
                      marginBottom:
                        '16px',
                    }}
                  >
                    <div
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap: '6px',
                        color:
                          '#15803d',
                        fontWeight:
                          600,
                        fontSize:
                          '0.875rem',
                        marginBottom:
                          '4px',
                      }}
                    >
                      <UserCheck
                        size={16}
                      />

                      Verified by Company (
                      {
                        companySupervisorName
                      }
                      )
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize:
                          '0.9rem',
                        color:
                          '#334155',
                        fontStyle:
                          'italic',
                      }}
                    >
                      "
                      {report.companyFeedback ||
                        'Activities verified without additional notes.'}
                      "
                    </p>
                  </div>

                  {/* Student Summary */}
                  <div
                    style={{
                      marginBottom:
                        '16px',
                    }}
                  >
                    <div
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap: '6px',
                        fontWeight:
                          600,
                        color:
                          '#475569',
                        fontSize:
                          '0.9rem',
                        marginBottom:
                          '6px',
                      }}
                    >
                      <FileText
                        size={16}
                      />

                      Weekly Summary
                    </div>

                    <pre
                      style={{
                        whiteSpace:
                          'pre-wrap',
                        fontFamily:
                          'inherit',
                        background:
                          '#f8fafc',
                        padding:
                          '14px',
                        borderRadius:
                          '8px',
                        fontSize:
                          '0.9rem',
                        color:
                          '#1e293b',
                        border:
                          '1px solid #e2e8f0',
                        margin: 0,
                      }}
                    >
                      {report.summary}
                    </pre>
                  </div>

                  {/* Academic Feedback Field */}
                  <div
                    style={{
                      marginBottom:
                        '16px',
                    }}
                  >
                    <label
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap: '6px',
                        fontWeight:
                          600,
                        color:
                          '#475569',
                        fontSize:
                          '0.875rem',
                        marginBottom:
                          '6px',
                      }}
                    >
                      <MessageSquare
                        size={16}
                      />

                      Academic Supervisor
                      Feedback
                    </label>

                    <textarea
                      placeholder="Add supervisor feedback or guidance..."
                      value={
                        feedback[
                          report.id
                        ] ?? ''
                      }
                      onChange={(e) =>
                        setFeedback({
                          ...feedback,
                          [report.id]:
                            e.target.value,
                        })
                      }
                      style={{
                        width:
                          '100%',
                        minHeight:
                          '80px',
                        padding:
                          '10px 12px',
                        borderRadius:
                          '8px',
                        border:
                          '1px solid #cbd5e1',
                        fontFamily:
                          'inherit',
                        fontSize:
                          '0.9rem',
                        resize:
                          'vertical',
                      }}
                    />
                  </div>

                  {/* Approval Actions */}
                  <div
                    style={{
                      display:
                        'flex',
                      justifyContent:
                        'flex-end',
                      gap: '12px',
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-outline danger"
                      onClick={() =>
                        reject(report)
                      }
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap: '6px',
                      }}
                    >
                      <XCircle
                        size={18}
                      />

                      Reject / Request
                      Revision
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        approve(report)
                      }
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap: '6px',
                      }}
                    >
                      <CheckCircle
                        size={18}
                      />

                      Approve Report
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


/* =========================================================
   UNIVERSITY SUPERVISOR - ANALYTICS
   ========================================================= */

export function SupervisorAnalyticsPage() {
  const { user } = useAuth();

  const [data, setData] =
    useState<
      {
        name: string;
        progress: number;
        diaries: number;
      }[]
    >([]);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      getAllUsers(),
      getDiaries(),
    ]).then(
      ([users, diaries]) => {
        const assignedStudents =
          users.filter(
            (u) =>
              u.role === 'student' &&
              u.supervisorId ===
                user.uid
          );

        const list =
          assignedStudents.length
            ? assignedStudents
            : [
                {
                  uid: 'demo-student',

                  displayName:
                    'Imasha Sayakkara',

                  email:
                    'imasha@example.com',

                  role:
                    'student' as const,

                  supervisorId:
                    user.uid,

                  createdAt:
                    new Date().toISOString(),
                },
              ];

        setData(
          list.map((student) => {
            const studentDiaries =
              diaries.filter(
                (diary) =>
                  diary.studentId ===
                  student.uid
              );

            const progress =
              (student as any)
                .progress ??
              Math.min(
                100,
                studentDiaries.length *
                  10
              );

            return {
              name:
                (
                  student.displayName ??
                  'Student'
                ).split(' ')[0],

              progress,

              diaries:
                studentDiaries.length,
            };
          })
        );
      }
    );
  }, [user]);

  return (
    <div className="page">
      <PageHeader
        title="Analytics"
        subtitle="Performance insights across assigned students"
      />

      <Card>
        <table className="data-table">
          <thead>
            <tr>
              <th>
                Student
              </th>

              <th>
                Progress %
              </th>

              <th>
                Diary Entries
              </th>
            </tr>
          </thead>

          <tbody>
            {data.map(
              (item) => (
                <tr key={item.name}>
                  <td>
                    {item.name}
                  </td>

                  <td>
                    {item.progress}%
                  </td>

                  <td>
                    {item.diaries}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}