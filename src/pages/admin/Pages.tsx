import { useEffect, useState } from 'react';

import type {
  ChangeEvent,
  CSSProperties,
  FormEvent,
} from 'react';

import {
  Users,
  Building2,
  Bell,
  Send,
} from 'lucide-react';

import {
  getAllUsers,
  deleteUser,
} from '../../services/authService';

import {
  getInternships,
  createInternship,
  createNotification,
  getAllNotifications,
} from '../../services/dataService';

import {
  PageHeader,
  Card,
  StatCard,
  EmptyState,
} from '../../components/ui';

import type {
  UserProfile,
  Internship,
  AppNotification,
} from '../../types';

/* =========================================================
   ADMIN DASHBOARD
   ========================================================= */

export function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [internships, setInternships] =
    useState<Internship[]>([]);
  const [notifications, setNotifications] =
    useState<AppNotification[]>([]);

  useEffect(() => {
    Promise.all([
      getAllUsers(),
      getInternships(),
      getAllNotifications(),
    ]).then(([u, i, n]) => {
      setUsers(u);
      setInternships(i);
      setNotifications(n);
    });
  }, []);

  const roleCounts = users.reduce(
    (acc, u) => ({
      ...acc,
      [u.role]: (acc[u.role] ?? 0) + 1,
    }),
    {} as Record<string, number>,
  );

  return (
    <div className="page">
      <PageHeader
        title="Admin Dashboard"
        subtitle="System overview and management"
      />

      <div className="stats-grid">
        <StatCard
          label="Total Users"
          value={users.length}
          icon={<Users size={24} />}
        />

        <StatCard
          label="Students"
          value={roleCounts.student ?? 0}
          icon={<Users size={24} />}
        />

        <StatCard
          label="Active Internships"
          value={
            internships.filter(
              (i) => i.status === 'active',
            ).length
          }
          icon={<Building2 size={24} />}
        />

        <StatCard
          label="System Alerts"
          value={notifications.length}
          icon={<Bell size={24} />}
          trend="Total system events"
        />
      </div>

      <div className="grid-2">
        <Card>
          <h3>Recent System Notifications</h3>

          {notifications.length === 0 ? (
            <EmptyState message="No system notifications found." />
          ) : (
            <ul className="item-list">
              {[...notifications]
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .slice(0, 5)
                .map((notif) => (
                  <li key={notif.id}>
                    <strong>{notif.title}</strong>
                    <span>
                      {notif.message} • Sent to:{' '}
                      {notif.userId}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

/* =========================================================
   USER MANAGEMENT
   ========================================================= */

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);

  const load = () => {
    void getAllUsers().then(setUsers);
  };

  useEffect(load, []);

  const handleDelete = async (uid: string) => {
    if (!confirm('Delete this user?')) return;

    await deleteUser(uid);
    load();
  };

  const getRoleBadgeStyle = (
    role?: string,
  ): CSSProperties => {
    const baseStyle: CSSProperties = {
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      display: 'inline-block',
    };

    switch (role?.toLowerCase()) {
      case 'student':
        return {
          ...baseStyle,
          backgroundColor: '#e0f2fe',
          color: '#0369a1',
        };

      case 'admin':
        return {
          ...baseStyle,
          backgroundColor: '#f3e8ff',
          color: '#7e22ce',
        };

      case 'company':
        return {
          ...baseStyle,
          backgroundColor: '#dcfce7',
          color: '#15803d',
        };

      case 'supervisor':
        return {
          ...baseStyle,
          backgroundColor: '#ffedd5',
          color: '#c2410c',
        };

      default:
        return {
          ...baseStyle,
          backgroundColor: '#f1f5f9',
          color: '#475569',
        };
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="User Management"
        subtitle="Manage system users and roles"
      />

      <Card>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.uid}>
                <td>{u.displayName}</td>

                <td>{u.email}</td>

                <td>
                  <span style={getRoleBadgeStyle(u.role)}>
                    {u.role || 'Unassigned'}
                  </span>
                </td>

                <td>{u.department ?? '—'}</td>

                <td>
                  {!u.uid.startsWith('demo-') && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm danger"
                      onClick={() => handleDelete(u.uid)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* =========================================================
   INTERNSHIP MANAGEMENT
   ========================================================= */

export function AdminInternshipsPage() {
  const [internships, setInternships] =
    useState<Internship[]>([]);

  const [users, setUsers] =
    useState<UserProfile[]>([]);

  const [selectedSupervisorUid, setSelectedSupervisorUid] =
    useState('');

  const [form, setForm] = useState({
    studentId: '',
    studentName: '',
    position: '',

    companyName: '',
    companySupervisor: '',
    companySupervisorEmail: '',
    companySupervisorDesignation: '',

    universitySupervisorId: '',
    universitySupervisorName: '',

    startDate: '',
    endDate: '',
  });

  /* ---------------------------------------------------------
     LOAD INTERNSHIPS + USERS
     --------------------------------------------------------- */

  const load = () => {
    Promise.all([
      getInternships(),
      getAllUsers(),
    ]).then(([i, u]) => {
      setInternships(i);
      setUsers(u);
    });
  };

  useEffect(() => {
    load();
  }, []);

  /* ---------------------------------------------------------
     USERS BY ROLE
     --------------------------------------------------------- */

  /*
   * Students whose UID already exists in an internship
   * are excluded from the available student list.
   */
  const assignedStudentIds = new Set(
    internships.map(
      (internship) => internship.studentId,
    ),
  );

  const availableStudents = users.filter(
    (user) =>
      user.role === 'student' &&
      !assignedStudentIds.has(user.uid),
  );

  const universitySupervisors = users.filter(
    (u) => u.role === 'supervisor',
  );

  const companySupervisors = users.filter(
    (u) => u.role === 'company',
  );

  /* ---------------------------------------------------------
     HANDLE STUDENT SELECTION
     --------------------------------------------------------- */

  const handleStudentChange = (
    e: ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedUid = e.target.value;

    const selectedUser = availableStudents.find(
      (student) => student.uid === selectedUid,
    );

    setForm((previous) => ({
      ...previous,
      studentId: selectedUid,
      studentName: selectedUser
        ? selectedUser.displayName
        : '',
    }));
  };

  /* ---------------------------------------------------------
     HANDLE UNIVERSITY SUPERVISOR SELECTION
     --------------------------------------------------------- */

  const handleUniversitySupervisorChange = (
    e: ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedUid = e.target.value;

    const selectedUser =
      universitySupervisors.find(
        (supervisor) =>
          supervisor.uid === selectedUid,
      );

    setForm((previous) => ({
      ...previous,
      universitySupervisorId: selectedUid,
      universitySupervisorName: selectedUser
        ? selectedUser.displayName
        : '',
    }));
  };

  /* ---------------------------------------------------------
     HANDLE COMPANY SUPERVISOR SELECTION
     --------------------------------------------------------- */

  const handleCompanySupervisorSelect = (
    e: ChangeEvent<HTMLSelectElement>,
  ) => {
    const uid = e.target.value;

    setSelectedSupervisorUid(uid);

    const supervisor =
      companySupervisors.find(
        (sup) => sup.uid === uid,
      );

    if (!supervisor) {
      setForm((previous) => ({
        ...previous,
        companyName: '',
        companySupervisor: '',
        companySupervisorEmail: '',
        companySupervisorDesignation: '',
      }));

      return;
    }

    setForm((previous) => ({
      ...previous,

      companyName:
        supervisor.companyName ?? '',

      companySupervisor:
        supervisor.displayName,

      companySupervisorEmail:
        supervisor.email,

      companySupervisorDesignation:
        supervisor.designation ?? '',
    }));
  };

  /* ---------------------------------------------------------
     HANDLE START DATE
     Automatically calculates 6 months after start date.
     --------------------------------------------------------- */

  const handleStartDateChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const startVal = e.target.value;

    let calculatedEndDate = form.endDate;

    if (startVal) {
      const startDateObj = new Date(startVal);

      if (!isNaN(startDateObj.getTime())) {
        startDateObj.setMonth(
          startDateObj.getMonth() + 6,
        );

        calculatedEndDate =
          startDateObj
            .toISOString()
            .split('T')[0];
      }
    }

    setForm((previous) => ({
      ...previous,
      startDate: startVal,
      endDate: calculatedEndDate,
    }));
  };

  /* =========================================================
     SUBMIT INTERNSHIP
     ========================================================= */

  const submit = async (
    e: FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    /* ---------------------------------------------------------
       VALIDATE STUDENT
       --------------------------------------------------------- */

    if (!form.studentId) {
      alert('Please select a student.');
      return;
    }

    /* ---------------------------------------------------------
       EXTRA PROTECTION:
       Prevent duplicate internship assignments.
       --------------------------------------------------------- */

    const alreadyAssigned =
      internships.some(
        (internship) =>
          internship.studentId ===
          form.studentId,
      );

    if (alreadyAssigned) {
      alert(
        'This student already has an internship assigned.',
      );

      load();
      return;
    }

    /* ---------------------------------------------------------
       VALIDATE POSITION
       --------------------------------------------------------- */

    if (!form.position.trim()) {
      alert(
        'Please enter the internship position.',
      );
      return;
    }

    /* ---------------------------------------------------------
       VALIDATE UNIVERSITY SUPERVISOR
       --------------------------------------------------------- */

    if (!form.universitySupervisorId) {
      alert(
        'Please select a university supervisor.',
      );
      return;
    }

    /* ---------------------------------------------------------
       VALIDATE COMPANY NAME
       --------------------------------------------------------- */

    if (!form.companyName.trim()) {
      alert(
        'Please enter the company name.',
      );
      return;
    }

    /* ---------------------------------------------------------
       VALIDATE COMPANY SUPERVISOR
       --------------------------------------------------------- */

    if (!form.companySupervisor.trim()) {
      alert(
        'Please enter the company supervisor name.',
      );
      return;
    }

    /* ---------------------------------------------------------
       VALIDATE DATES
       --------------------------------------------------------- */

    if (!form.startDate || !form.endDate) {
      alert(
        'Please select the internship start and end dates.',
      );
      return;
    }

    /* ---------------------------------------------------------
       FIND REGISTERED COMPANY SUPERVISOR
       --------------------------------------------------------- */

    const selectedCompanySupervisor =
      companySupervisors.find(
        (sup) =>
          sup.uid === selectedSupervisorUid,
      );

    try {
      await createInternship({
        studentId: form.studentId,
        studentName: form.studentName,

        /* Internship position */
        position: form.position.trim(),

        /* Registered company supervisor's company ID */
        companyId:
          selectedCompanySupervisor?.companyId ?? '',

        /* University supervisor */
        supervisorId:
          form.universitySupervisorId,

        companyName:
          form.companyName.trim(),

        companySupervisor:
          form.companySupervisor.trim(),

        companySupervisorEmail:
          form.companySupervisorEmail.trim(),

        companySupervisorDesignation:
          form.companySupervisorDesignation.trim(),

        universitySupervisorId:
          form.universitySupervisorId,

        startDate: form.startDate,
        endDate: form.endDate,

        status: 'active',
        progress: 0,
      });

      alert(
        'Internship created successfully.',
      );

      /* -------------------------------------------------------
         RESET FORM
         ------------------------------------------------------- */

      setForm({
        studentId: '',
        studentName: '',
        position: '',

        companyName: '',
        companySupervisor: '',
        companySupervisorEmail: '',
        companySupervisorDesignation: '',

        universitySupervisorId: '',
        universitySupervisorName: '',

        startDate: '',
        endDate: '',
      });

      setSelectedSupervisorUid('');

      /* -------------------------------------------------------
         RELOAD INTERNSHIPS
         ------------------------------------------------------- */

      load();
    } catch (error) {
      console.error(
        'Error creating internship:',
        error,
      );

      alert(
        error instanceof Error &&
        error.message ===
          'This student already has an internship assigned.'
          ? error.message
          : 'Failed to create internship.',
      );
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Internship Management"
        subtitle="Register and manage internship placements"
      />

      <div className="grid-2">

        {/* =================================================
            NEW INTERNSHIP FORM
            ================================================= */}

        <Card>
          <h3>New Internship</h3>

          <form
            onSubmit={submit}
            className="form-stack"
          >

            {/* STUDENT */}

            <label>
              Select Student

              <select
                value={form.studentId}
                onChange={handleStudentChange}
                required
              >
                <option value="" disabled>
                  -- Select a Student --
                </option>

                {availableStudents.length === 0 ? (
                  <option value="" disabled>
                    No unassigned students available
                  </option>
                ) : (
                  availableStudents.map(
                    (student) => (
                      <option
                        key={student.uid}
                        value={student.uid}
                      >
                        {student.displayName} (
                        {student.email})
                      </option>
                    ),
                  )
                )}
              </select>
            </label>

            {/* POSITION */}

            <label>
              Internship Position

              <input
                type="text"
                value={form.position}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    position: e.target.value,
                  }))
                }
                placeholder="e.g., Software Engineering Intern"
                required
              />
            </label>

            {/* COMPANY SUPERVISOR */}

            <label>
              Company Supervisor

              <select
                value={selectedSupervisorUid}
                onChange={
                  handleCompanySupervisorSelect
                }
                required
              >
                <option value="" disabled>
                  -- Select a Registered Company Supervisor --
                </option>

                {companySupervisors.length === 0 ? (
                  <option value="" disabled>
                    No registered company supervisors
                  </option>
                ) : (
                  companySupervisors.map(
                    (supervisor) => (
                      <option
                        key={supervisor.uid}
                        value={supervisor.uid}
                      >
                        {supervisor.displayName}
                        {' — '}
                        {supervisor.email}
                        {supervisor.companyName
                          ? ` (${supervisor.companyName})`
                          : ''}
                      </option>
                    ),
                  )
                )}
              </select>

              <small
                style={{
                  display: 'block',
                  marginTop: '5px',
                  color: '#6b7280',
                }}
              >
                Only registered company supervisors
                can be assigned to an internship.
              </small>
            </label>

            {/* COMPANY NAME */}

            <label>
              Company Name

              <input
                type="text"
                value={form.companyName}
                readOnly
                placeholder="Automatically filled from company supervisor"
                required
              />
            </label>

            {/* COMPANY SUPERVISOR NAME */}

            <label>
              Company Supervisor Name

              <input
                type="text"
                value={form.companySupervisor}
                readOnly
                placeholder="Automatically filled"
                required
              />
            </label>

            {/* SUPERVISOR EMAIL + DESIGNATION */}

            <div className="form-grid">

              <label>
                Supervisor Email

                <input
                  type="email"
                  value={
                    form.companySupervisorEmail
                  }
                  readOnly
                  placeholder="Automatically filled"
                  required
                />
              </label>

              <label>
                Designation

                <input
                  type="text"
                  value={
                    form.companySupervisorDesignation
                  }
                  readOnly
                  placeholder="Automatically filled"
                  required
                />
              </label>

            </div>

            {/* UNIVERSITY SUPERVISOR */}

            <label>
              University Supervisor

              <select
                value={
                  form.universitySupervisorId
                }
                onChange={
                  handleUniversitySupervisorChange
                }
                required
              >
                <option value="" disabled>
                  -- Select a University Supervisor --
                </option>

                {universitySupervisors.map(
                  (supervisor) => (
                    <option
                      key={supervisor.uid}
                      value={supervisor.uid}
                    >
                      {supervisor.displayName} (
                      {supervisor.email})
                    </option>
                  ),
                )}
              </select>
            </label>

            {/* DATES */}

            <div className="form-grid">

              <label>
                Start Date

                <input
                  type="date"
                  value={form.startDate}
                  onChange={
                    handleStartDateChange
                  }
                  required
                />
              </label>

              <label>
                End Date

                <span
                  style={{
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    marginLeft: '5px',
                  }}
                >
                  (6 months / Editable)
                </span>

                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((previous) => ({
                      ...previous,
                      endDate: e.target.value,
                    }))
                  }
                  required
                />
              </label>

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                availableStudents.length === 0
              }
            >
              Create Internship
            </button>

          </form>
        </Card>

        {/* =================================================
            INTERNSHIP LIST
            ================================================= */}

        <Card>
          <h3>Registered Internships</h3>

          {internships.length === 0 ? (
            <EmptyState message="No internships registered" />
          ) : (
            <ul className="item-list">

              {internships.map((internship) => (
                <li key={internship.id}>

                  <strong>
                    {internship.studentName}
                  </strong>

                  <span>
                    {internship.position}
                    {' · '}
                    {internship.companyName}
                    {' · '}
                    {internship.companySupervisor}
                  </span>

                  <span>
                    {internship.startDate}
                    {' to '}
                    {internship.endDate}
                  </span>

                </li>
              ))}

            </ul>
          )}
        </Card>

      </div>
    </div>
  );
}

/* =========================================================
   NOTIFICATION CENTER
   ========================================================= */

export function AdminNotificationsPage() {
  const [notifications, setNotifications] =
    useState<AppNotification[]>([]);

  const [users, setUsers] =
    useState<UserProfile[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [form, setForm] = useState({
    recipient: '',
    title: '',
    message: '',
    type: 'info' as AppNotification['type'],
  });

  const loadData = () => {
    Promise.all([
      getAllUsers(),
      getAllNotifications(),
    ]).then(([u, n]) => {
      setUsers(u);
      setNotifications(n);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (!form.recipient) {
      setMessage(
        'Please select a recipient.',
      );
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      let targetUids: string[] = [];

      switch (form.recipient) {
        case 'all_users':
          targetUids = users.map(
            (u) => u.uid,
          );
          break;

        case 'all_students':
          targetUids = users
            .filter(
              (u) => u.role === 'student',
            )
            .map((u) => u.uid);
          break;

        case 'all_company_supervisors':
          targetUids = users
            .filter(
              (u) => u.role === 'company',
            )
            .map((u) => u.uid);
          break;

        case 'all_uni_supervisors':
          targetUids = users
            .filter(
              (u) => u.role === 'supervisor',
            )
            .map((u) => u.uid);
          break;

        default:
          targetUids = [form.recipient];
      }

      if (targetUids.length === 0) {
        setMessage(
          'No users found in the selected category.',
        );

        setLoading(false);
        return;
      }

      const notificationPromises =
        targetUids.map((uid) =>
          createNotification({
            userId: uid,
            title: form.title,
            message: form.message,
            type: form.type,
            read: false,
          }),
        );

      await Promise.all(
        notificationPromises,
      );

      setMessage(
        `Success! Notification sent to ${targetUids.length} user(s).`,
      );

      setForm({
        recipient: '',
        title: '',
        message: '',
        type: 'info',
      });

      loadData();

    } catch (error) {
      console.error(
        'Error sending notification:',
        error,
      );

      setMessage(
        'Failed to send notification(s).',
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">

      <PageHeader
        title="Notification Center"
        subtitle="Send personalized alerts or system-wide broadcasts"
      />

      <div className="grid-2">

        <Card>

          <h3>Compose Message</h3>

          {message && (
            <div
              className={`alert ${
                message.includes('Success')
                  ? 'alert-success'
                  : 'alert-danger'
              }`}
            >
              {message}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="form-stack"
          >

            <label>
              Recipient(s)

              <select
                value={form.recipient}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    recipient:
                      e.target.value,
                  }))
                }
                required
              >

                <option
                  value=""
                  disabled
                >
                  Select a recipient...
                </option>

                <optgroup label="Broadcast Groups">

                  <option value="all_users">
                    All System Users
                  </option>

                  <option value="all_students">
                    All Students
                  </option>

                  <option value="all_company_supervisors">
                    All Company Supervisors
                  </option>

                  <option value="all_uni_supervisors">
                    All University Supervisors
                  </option>

                </optgroup>

                <optgroup label="Individual Students">

                  {users
                    .filter(
                      (u) =>
                        u.role === 'student',
                    )
                    .map((u) => (
                      <option
                        key={u.uid}
                        value={u.uid}
                      >
                        {u.displayName} (
                        {u.email})
                      </option>
                    ))}

                </optgroup>

                <optgroup label="Individual Supervisors">

                  {users
                    .filter(
                      (u) =>
                        u.role === 'company' ||
                        u.role === 'supervisor',
                    )
                    .map((u) => (
                      <option
                        key={u.uid}
                        value={u.uid}
                      >
                        {u.displayName} (
                        {u.role})
                      </option>
                    ))}

                </optgroup>

              </select>
            </label>

            <label>
              Title

              <input
                value={form.title}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    title: e.target.value,
                  }))
                }
                required
                placeholder="e.g., System Maintenance"
              />
            </label>

            <label>
              Message

              <textarea
                rows={4}
                value={form.message}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    message:
                      e.target.value,
                  }))
                }
                required
                placeholder="Enter notification details..."
              />
            </label>

            <label>
              Type

              <select
                value={form.type}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    type:
                      e.target.value as AppNotification['type'],
                  }))
                }
              >

                <option value="info">
                  Information
                </option>

                <option value="reminder">
                  Reminder
                </option>

                <option value="success">
                  Success
                </option>

                <option value="warning">
                  Warning
                </option>

                <option value="error">
                  Urgent / Error
                </option>

              </select>
            </label>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <Send size={16} />

              {loading
                ? 'Sending...'
                : 'Dispatch Notification'}
            </button>

          </form>

        </Card>

        <Card>

          <h3>Recent Dispatches</h3>

          {notifications.length === 0 ? (
            <EmptyState message="No notifications have been sent yet." />
          ) : (
            <ul
              className="item-list"
              style={{
                listStyle: 'none',
                padding: 0,
              }}
            >

              {[...notifications]
                .sort(
                  (a, b) =>
                    new Date(
                      b.createdAt || 0,
                    ).getTime() -
                    new Date(
                      a.createdAt || 0,
                    ).getTime(),
                )
                .slice(0, 10)
                .map((notif) => {

                  const user =
                    users.find(
                      (u) =>
                        u.uid ===
                        notif.userId,
                    );

                  const recipientName =
                    user
                      ? user.displayName
                      : notif.userId;

                  const isError =
                    notif.type === 'error';

                  const badgeBg =
                    isError
                      ? '#fee2e2'
                      : '#e0f2fe';

                  const badgeColor =
                    isError
                      ? '#991b1b'
                      : '#075985';

                  return (
                    <li
                      key={notif.id}
                      style={{
                        textAlign: 'left',
                        padding:
                          '12px 16px',
                        marginBottom: '8px',
                        border:
                          '1px solid #e5e7eb',
                        borderRadius: '8px',
                        backgroundColor:
                          '#ffffff',
                        display: 'flex',
                        flexDirection:
                          'column',
                        gap: '8px',
                      }}
                    >

                      <div
                        style={{
                          display: 'flex',
                          justifyContent:
                            'space-between',
                          alignItems:
                            'center',
                        }}
                      >

                        <strong
                          style={{
                            fontSize:
                              '0.95rem',
                            color:
                              '#111827',
                          }}
                        >
                          {notif.title}
                        </strong>

                        <span
                          style={{
                            fontSize:
                              '0.7rem',
                            fontWeight:
                              'bold',
                            padding:
                              '2px 8px',
                            borderRadius:
                              '9999px',
                            textTransform:
                              'uppercase',
                            backgroundColor:
                              badgeBg,
                            color:
                              badgeColor,
                          }}
                        >
                          {notif.type}
                        </span>

                      </div>

                      <p
                        style={{
                          margin: 0,
                          fontSize:
                            '0.875rem',
                          color:
                            '#4b5563',
                          lineHeight:
                            '1.5',
                        }}
                      >
                        {notif.message}
                      </p>

                      <small
                        style={{
                          color:
                            '#6b7280',
                          fontSize:
                            '0.775rem',
                        }}
                      >
                        Sent to:{' '}
                        <strong>
                          {recipientName}
                        </strong>
                      </small>

                    </li>
                  );
                })}

            </ul>
          )}

        </Card>

      </div>
    </div>
  );
}

/* =========================================================
   SYSTEM SETTINGS
   ========================================================= */

export function AdminSettingsPage() {
  return (
    <div className="page">

      <PageHeader
        title="System Settings"
        subtitle="Configure system parameters and integrations"
      />

      <Card>

        <h3>Integration Settings</h3>

        <ul className="settings-list">

          <li>
            <strong>Firebase:</strong>{' '}
            Configure via{' '}
            <code>.env</code> file
            (see README)
          </li>

          <li>
            <strong>Gemini API:</strong>{' '}
            Set{' '}
            <code>
              VITE_GEMINI_API_KEY
            </code>{' '}
            for AI features
          </li>

          <li>
            <strong>Demo Mode:</strong>{' '}
            Active when Firebase is not
            configured — uses localStorage
          </li>

        </ul>

      </Card>

    </div>
  );
}