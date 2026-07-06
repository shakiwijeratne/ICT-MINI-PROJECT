import { useEffect, useState } from 'react';
import { Users, Building2, Bell, Activity, UserPlus, Trash2, Edit2 } from 'lucide-react';
import { getAllUsers, deleteUser, createUserByAdmin } from '../../services/authService';
import {
  getInternships,
  createInternship,
  createNotification,
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from '../../services/dataService';
import { PageHeader, Card, StatCard, EmptyState } from '../../components/ui';
import type { UserProfile, Internship, AppNotification, UserRole, Company } from '../../types';

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
        <StatCard label="Supervisors" value={roleCounts.supervisor ?? 0} icon={<Users size={24} />} />
        <StatCard label="Companies" value={roleCounts.company ?? 0} icon={<Building2 size={24} />} />
        <StatCard label="Active Internships" value={internships.filter((i) => i.status === 'active').length} icon={<Building2 size={24} />} />
        <StatCard label="System Status" value="Online" icon={<Activity size={24} />} trend="All services operational" />
      </div>
    </div>
  );
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    role: 'supervisor' as UserRole,
    department: '',
    companyName: '',
    indexNumber: '',
    phone: '',
  });

  const load = () => {
    void getAllUsers().then(setUsers);
  };

  useEffect(load, []);

  const handleDelete = async (uid: string) => {
    if (!confirm('Delete this user?')) return;
    await deleteUser(uid);
    load();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      await createUserByAdmin({
        displayName: form.displayName,
        email: form.email,
        password: form.password,
        role: form.role,
        department: form.department || undefined,
        companyName: form.role === 'company' ? form.companyName : undefined,
        indexNumber: form.role === 'student' ? form.indexNumber : undefined,
        phone: form.phone || undefined,
      });

      setMessage(`${form.displayName} added as ${form.role}`);
      setForm({
        displayName: '',
        email: '',
        password: '',
        role: 'supervisor',
        department: '',
        companyName: '',
        indexNumber: '',
        phone: '',
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <PageHeader title="User Management" subtitle="Add supervisors, companies, students, and admins" />
      <div className="grid-2">
        <Card>
          <h3>Add User</h3>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleCreate} className="form-stack">
            <label>
              Role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
                <option value="supervisor">University Supervisor</option>
                <option value="company">Company Supervisor</option>
                <option value="student">Student</option>
                <option value="admin">Administrator</option>
              </select>
            </label>
            <label>
              Full Name
              <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required />
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </label>
            <label>
              Temporary Password
              <input
                type="password"
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </label>
            {(form.role === 'supervisor' || form.role === 'student') && (
              <label>
                Department
                <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </label>
            )}
            {form.role === 'company' && (
              <label>
                Company Name
                <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
              </label>
            )}
            {form.role === 'student' && (
              <label>
                Index Number
                <input value={form.indexNumber} onChange={(e) => setForm({ ...form, indexNumber: e.target.value })} />
              </label>
            )}
            <label>
              Phone
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <UserPlus size={16} /> {saving ? 'Adding...' : 'Add User'}
            </button>
          </form>
        </Card>

        <Card>
          <h3>All Users</h3>
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Department / Company</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid}>
                  <td>{u.displayName}</td>
                  <td>{u.email}</td>
                  <td><span className="role-badge">{u.role}</span></td>
                  <td>{u.companyName ?? u.department ?? '-'}</td>
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
    </div>
  );
}

export function AdminInternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState({
    studentId: 'demo-student',
    studentName: 'Imasha Sayakkara',
    companyName: '',
    companySupervisor: '',
    universitySupervisorId: 'demo-supervisor',
    startDate: '',
    endDate: '',
  });

  const load = () => {
    void getInternships().then(setInternships);
  };

  useEffect(load, []);

  useEffect(() => {
    void getCompanies().then((list) => setCompanies(list.filter((c) => c.status === 'active')));
  }, []);

  const handleCompanyChange = (companyName: string) => {
    const selected = companies.find((c) => c.name === companyName);
    setForm({
      ...form,
      companyName,
      companySupervisor: selected?.supervisorName ?? '',
    });
  };

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
            <label>
              Company
              <select value={form.companyName} onChange={(e) => handleCompanyChange(e.target.value)} required>
                <option value="">-- Select Company --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </label>
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
                  <span>{i.companyName} - {i.startDate} to {i.endDate}</span>
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

export function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    industry: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    supervisorName: '',
    status: 'active' as Company['status'],
  });

  const load = () => {
    void getCompanies().then(setCompanies);
  };

  useEffect(load, []);

  const resetForm = () => {
    setForm({
      name: '',
      industry: '',
      address: '',
      contactEmail: '',
      contactPhone: '',
      website: '',
      supervisorName: '',
      status: 'active',
    });
    setEditingId(null);
  };

  const handleEdit = (company: Company) => {
    setForm({
      name: company.name,
      industry: company.industry,
      address: company.address,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      website: company.website ?? '',
      supervisorName: company.supervisorName,
      status: company.status,
    });
    setEditingId(company.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      if (editingId) {
        await updateCompany(editingId, form);
        setMessage(`Company "${form.name}" updated successfully`);
      } else {
        await createCompany(form);
        setMessage(`Company "${form.name}" added successfully`);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save company');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (companyId: string, name: string) => {
    if (!confirm(`Delete company "${name}"? This action cannot be undone.`)) return;
    await deleteCompany(companyId);
    setMessage(`Company "${name}" deleted`);
    load();
  };

  return (
    <div className="page">
      <PageHeader title="Company Management" subtitle="Register and manage partner companies" />
      <div className="grid-2">
        <Card>
          <h3>{editingId ? 'Edit Company' : 'Add Company'}</h3>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="form-stack">
            <label>
              Company Name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Industry
              <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} required />
            </label>
            <label>
              Address
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            </label>
            <label>
              Contact Email
              <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} required />
            </label>
            <label>
              Contact Phone
              <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} required />
            </label>
            <label>
              Website
              <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </label>
            <label>
              Company Supervisor Name
              <input value={form.supervisorName} onChange={(e) => setForm({ ...form, supervisorName: e.target.value })} required />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Company['status'] })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {editingId ? <Edit2 size={16} /> : <Building2 size={16} />}
                {saving ? 'Saving...' : editingId ? 'Update Company' : 'Add Company'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-outline" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Card>

        <Card>
          <h3>Registered Companies</h3>
          {companies.length === 0 ? (
            <EmptyState message="No companies registered yet" />
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Industry</th><th>Supervisor</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.industry}</td>
                    <td>{c.supervisorName}</td>
                    <td>
                      <span className={`role-badge ${c.status === 'active' ? '' : 'danger'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => handleEdit(c)}>
                          <Edit2 size={14} />
                        </button>
                        <button type="button" className="btn btn-outline btn-sm danger" onClick={() => handleDelete(c.id, c.name)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <li><strong>REST API:</strong> Set <code>VITE_API_BASE_URL</code> when the API is hosted separately</li>
          <li><strong>Gemini API:</strong> Set <code>VITE_GEMINI_API_KEY</code> for AI features</li>
          <li><strong>Demo Mode:</strong> Active when Firebase is not configured - uses localStorage</li>
        </ul>
      </Card>
    </div>
  );
}
