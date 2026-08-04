import { useEffect, useState } from 'react';
import { Users, Building2, Bell, Activity } from 'lucide-react';
import { getAllUsers, deleteUser } from '../../services/authService';
import {
  getInternships,
  createInternship,
  createNotification,
} from '../../services/dataService';
import { PageHeader, Card, StatCard, EmptyState } from '../../components/ui';
import type { UserProfile, Internship, AppNotification } from '../../types';

export function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);

  useEffect(() => {
    Promise.all([getAllUsers(), getInternships()]).then(([u, i]) => {
      setUsers(u);
      setInternships(i);
    });
  }, []);

  const roleCounts = users.reduce(
    (acc, u) => ({ ...acc, [u.role]: (acc[u.role] ?? 0) + 1 }),
    {} as Record<string, number>,
  );

  return (
    <div className="page">
      <PageHeader title="Admin Dashboard" subtitle="System overview and management" />
      <div className="stats-grid">
        <StatCard label="Total Users" value={users.length} icon={<Users size={24} />} />
        <StatCard label="Students" value={roleCounts.student ?? 0} icon={<Users size={24} />} />
        <StatCard label="Active Internships" value={internships.filter((i) => i.status === 'active').length} icon={<Building2 size={24} />} />
        <StatCard label="System Status" value="Online" icon={<Activity size={24} />} trend="All services operational" />
      </div>
    </div>
  );
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);

  const load = () => { void getAllUsers().then(setUsers); };
  useEffect(load, []);

  const handleDelete = async (uid: string) => {
    if (!confirm('Delete this user?')) return;
    await deleteUser(uid);
    load();
  };

  return (
    <div className="page">
      <PageHeader title="User Management" subtitle="Manage system users and roles" />
      <Card>
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid}>
                <td>{u.displayName}</td>
                <td>{u.email}</td>
                <td><span className="role-badge">{u.role}</span></td>
                <td>{u.department ?? '—'}</td>
                <td>
                  {!u.uid.startsWith('demo-') && (
                    <button type="button" className="btn btn-outline btn-sm danger" onClick={() => handleDelete(u.uid)}>
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

export function AdminInternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [form, setForm] = useState({
    studentId: 'demo-student',
    studentName: 'Imasha Sayakkara',
    companyName: '',
    companySupervisor: '',
    universitySupervisorId: 'demo-supervisor',
    startDate: '',
    endDate: '',
  });

  const load = () => { void getInternships().then(setInternships); };
  useEffect(load, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createInternship({ ...form, status: 'active', progress: 0 });
    setForm({ ...form, companyName: '', companySupervisor: '', startDate: '', endDate: '' });
    load();
  };

  return (
    <div className="page">
      <PageHeader title="Internship Management" subtitle="Register and manage internship placements" />
      <div className="grid-2">
        <Card>
          <h3>New Internship</h3>
          <form onSubmit={submit} className="form-stack">
            <label>Student Name<input value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} required /></label>
            <label>Company<input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required /></label>
            <label>Company Supervisor<input value={form.companySupervisor} onChange={(e) => setForm({ ...form, companySupervisor: e.target.value })} required /></label>
            <label>Start Date<input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required /></label>
            <label>End Date<input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required /></label>
            <button type="submit" className="btn btn-primary">Create Internship</button>
          </form>
        </Card>
        <Card>
          <h3>Active Internships</h3>
          {internships.length === 0 ? (
            <EmptyState message="No internships registered" />
          ) : (
            <ul className="item-list">
              {internships.map((i) => (
                <li key={i.id}>
                  <strong>{i.studentName}</strong>
                  <span>{i.companyName} · {i.startDate} to {i.endDate}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

export function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [form, setForm] = useState({ userId: 'demo-student', title: '', message: '', type: 'info' as AppNotification['type'] });

  useEffect(() => {
    import('../../services/localStore').then(({ localStore }) => {
      setNotifications(localStore.getNotifications());
    });
  }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    await createNotification(form);
    const all = await import('../../services/dataService').then((m) =>
      Promise.all(['demo-student', 'demo-supervisor', 'demo-company', 'demo-admin'].map((id) => m.getNotifications(id))),
    );
    setNotifications(all.flat());
    setForm({ ...form, title: '', message: '' });
  };

  return (
    <div className="page">
      <PageHeader title="Notifications" subtitle="Send system-wide alerts and reminders" />
      <div className="grid-2">
        <Card>
          <h3>Send Notification</h3>
          <form onSubmit={send} className="form-stack">
            <label>
              Recipient
              <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                <option value="demo-student">Student</option>
                <option value="demo-supervisor">Supervisor</option>
                <option value="demo-company">Company</option>
                <option value="demo-admin">Admin</option>
              </select>
            </label>
            <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
            <label>Message<textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required /></label>
            <label>
              Type
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AppNotification['type'] })}>
                <option value="info">Info</option>
                <option value="reminder">Reminder</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
              </select>
            </label>
            <button type="submit" className="btn btn-primary"><Bell size={16} /> Send</button>
          </form>
        </Card>
        <Card>
          <h3>Recent Notifications</h3>
          {notifications.length === 0 ? (
            <EmptyState message="No notifications sent yet" />
          ) : (
            <ul className="item-list">
              {notifications.slice(0, 10).map((n) => (
                <li key={n.id}>
                  <strong>{n.title}</strong>
                  <span>{n.message}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

export function AdminSettingsPage() {
  return (
    <div className="page">
      <PageHeader title="System Settings" subtitle="Configure system parameters and integrations" />
      <Card>
        <h3>Integration Settings</h3>
        <ul className="settings-list">
          <li><strong>Firebase:</strong> Configure via <code>.env</code> file (see README)</li>
          <li><strong>Gemini API:</strong> Set <code>VITE_GEMINI_API_KEY</code> for AI features</li>
          <li><strong>Demo Mode:</strong> Active when Firebase is not configured — uses localStorage</li>
        </ul>
      </Card>
    </div>
  );
}
