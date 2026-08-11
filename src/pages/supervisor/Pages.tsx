import { useEffect, useState } from 'react';

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
} from '../../components/ui';

import type {
  WeeklyReport,
  UserProfile,
} from '../../types';


 

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

              // Method 1: companyId
              if (internship.companyId) {
                companySupervisor = users.find(
                  (u) =>
                    u.role === 'company' &&
                    u.companyId ===
                      internship.companyId
                );
              }


              // Method 2: company supervisor name
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


              /* Student information */

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

                  {/* Student */}
                  <td>
                    <strong>
                      {student.studentName}
                    </strong>
                  </td>


                  {/* Student Email */}
                  <td>
                    {student.studentEmail}
                  </td>


                  {/* Company */}
                  <td>
                    {student.companyName}
                  </td>


                  {/* Company Supervisor */}
                  <td>
                    {student.companySupervisorName}
                  </td>


                  {/* Company Supervisor Email */}
                  <td>
                    {student.companySupervisorEmail}
                  </td>


                  {/* Diaries */}
                  <td>
                    {student.diaryCount}
                  </td>


                  {/* Reports */}
                  <td>
                    {student.reportCount}
                  </td>


                  {/* Last Activity */}
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


                /* Match using company supervisor UID */

                const supervisorIdMatch =
                  internship.companyId ===
                  user.uid;


                /* Match using company ID */

                const companyIdMatch =
                  companySupervisorCompanyId &&
                  internship.companyId ===
                    companySupervisorCompanyId;


                /* Match using supervisor name */

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


                /* Find student */

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

                  /* Student */

                  studentId:
                    student.uid,

                  studentName:
                    student.displayName ??
                    'Student',

                  studentEmail:
                    student.email ??
                    'No email',


                  /* Company */

                  companyName:
                    internship.companyName ??
                    student.companyName ??
                    'Assigned Company',


                  /* University Supervisor */

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


                  /* Internship */

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

                    {/* Student */}

                    <td>
                      <strong>
                        {student.studentName}
                      </strong>
                    </td>


                    {/* Student Email */}

                    <td>
                      {student.studentEmail}
                    </td>


                    {/* Company */}

                    <td>
                      {student.companyName}
                    </td>


                    {/* University Supervisor */}

                    <td>
                      {
                        student.universitySupervisorName
                      }
                    </td>


                    {/* University Supervisor Email */}

                    <td>
                      {
                        student.universitySupervisorEmail
                      }
                    </td>


                    {/* Status */}

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



 

export function SupervisorReportsPage() {

  const { user } = useAuth();


  const [reports, setReports] =
    useState<WeeklyReport[]>([]);


  const [feedback, setFeedback] =
    useState<Record<string, string>>({});


  useEffect(() => {

    if (!user) return;


    Promise.all([
      getAllUsers(),
      getReports(),
    ]).then(
      ([users, allReports]) => {


        const assignedStudentIds =
          new Set(
            users
              .filter(
                (u) =>
                  u.role === 'student' &&
                  u.supervisorId ===
                    user.uid
              )
              .map(
                (u) => u.uid
              )
          );


        const filtered =
          allReports.filter(
            (report) =>
              (
                assignedStudentIds.size === 0 ||
                assignedStudentIds.has(
                  report.studentId
                )
              ) &&
              (
                report.status ===
                  'company_verified' ||
                report.status ===
                  'supervisor_approved'
              )
          );


        setReports(filtered);
      }
    );


    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });


  }, [user]);


   

  const approve = async (
    report: WeeklyReport
  ) => {


    await updateReport(
      report.id,
      {
        status: 'supervisor_approved',

        supervisorFeedback:
          feedback[report.id] ??
          'Approved — good progress',

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


    /* Notify student */

    await createNotification({

      userId:
        report.studentId,

      title:
        'Report Approved',

      message:
        `Your weekly report (${report.weekStart}) was approved by your university supervisor`,

      type:
        'success',

      read:
        false,
    });


    /* Find company */

    const internships =
      await getInternships();


    const studentInternship =
      internships.find(
        (internship) =>
          internship.studentId ===
          report.studentId
      );


    const targetCompanyId =
      studentInternship?.companyId;


    /* Notify company */

    if (targetCompanyId) {

      await createNotification({

        userId:
          targetCompanyId,

        title:
          'Report Fully Approved',

        message:
          `${report.studentName}'s report for ${report.weekStart} received final university approval.`,

        type:
          'success',

        read:
          false,
      });

    } else {

      console.warn(
        `No active company found for student ${report.studentName}. Notification skipped.`
      );

    }


    setReports(
      (previous) =>
        previous.filter(
          (r) =>
            r.id !== report.id
        )
    );
  };


   

  const reject = async (
    report: WeeklyReport
  ) => {


    await updateReport(
      report.id,
      {
        status:
          'rejected',

        supervisorFeedback:
          feedback[report.id] ??
          'Please revise and resubmit',
      }
    );


    await createNotification({

      userId:
        report.studentId,

      title:
        'Report Rejected',

      message:
        `Your weekly report (${report.weekStart}) needs revision`,

      type:
        'warning',

      read:
        false,
    });


    setReports(
      (previous) =>
        previous.filter(
          (r) =>
            r.id !== report.id
        )
    );
  };


  return (

    <div className="page">

      <PageHeader
        title="Report Review"
        subtitle="Approve or reject company-verified weekly reports"
      />


      <Card>

        {reports.length === 0 ? (

          <EmptyState
            message="No reports awaiting your review"
          />

        ) : (

          reports.map(
            (report) => (

              <div
                key={report.id}
                className="report-item"
              >

                <strong>
                  {report.studentName}
                  {' — '}
                  Week {report.weekStart}
                </strong>


                <pre className="report-summary">
                  {report.summary?.slice(
                    0,
                    500
                  )}
                  ...
                </pre>


                {report.companyFeedback && (

                  <p>
                    <em>
                      Company:{' '}
                      {report.companyFeedback}
                    </em>
                  </p>

                )}


                <textarea
                  placeholder="Supervisor feedback..."
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
                />


                <div className="form-actions">

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() =>
                      approve(report)
                    }
                  >
                    Approve
                  </button>


                  <button
                    type="button"
                    className="btn btn-outline btn-sm danger"
                    onClick={() =>
                      reject(report)
                    }
                  >
                    Reject
                  </button>

                </div>

              </div>

            )
          )

        )}

      </Card>

    </div>

  );
}



 

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

