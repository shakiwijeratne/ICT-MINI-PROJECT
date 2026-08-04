import { useEffect, useState } from 'react';
import { Users, Building2, Bell, Send} from 'lucide-react';
import { getAllUsers, deleteUser } from '../../services/authService';
import {
  getInternships,
  createInternship,
  createNotification,
  getAllNotifications,
} from '../../services/dataService';
import { PageHeader, Card, StatCard, EmptyState } from '../../components/ui';
import type { UserProfile, Internship, AppNotification } from '../../types';


export function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]); // New state

  useEffect(() => {
    // Fetch all three data sets concurrently
    Promise.all([
      getAllUsers(), 
      getInternships(),
      getAllNotifications() 
    ]).then(([u, i, n]) => {
      setUsers(u);
      setInternships(i);
      setNotifications(n); // Save notifications to state
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
        <StatCard label="System Alerts" value={notifications.length} icon={<Bell size={24} />} trend="Total system events" />
      </div>

      <div className="grid-2">
        {/* You can add other admin cards here */}
        
        <Card>
          <h3>Recent System Notifications</h3>
          {notifications.length === 0 ? (
            <EmptyState message="No system notifications found." />
          ) : (
            <ul className="item-list">
              {/* Sort by newest and show the top 5 */}
              {notifications
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((notif) => (
                <li key={notif.id}>
                  <strong>{notif.title}</strong>
                  <span>{notif.message} • Sent to: {notif.userId}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
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

  // Helper function to map roles to specific minimalist color palettes
  const getRoleBadgeStyle = (role?: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: '4px 12px',
      borderRadius: '9999px', // Pill shape
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      display: 'inline-block'
    };

    switch (role?.toLowerCase()) {
      case 'student':
        return { ...baseStyle, backgroundColor: '#e0f2fe', color: '#0369a1' }; // Soft Blue
      case 'admin':
        return { ...baseStyle, backgroundColor: '#f3e8ff', color: '#7e22ce' }; // Soft Purple
      case 'company_supervisor':
        return { ...baseStyle, backgroundColor: '#dcfce7', color: '#15803d' }; // Soft Green
      case 'university_supervisor':
        return { ...baseStyle, backgroundColor: '#ffedd5', color: '#c2410c' }; // Soft Orange
      default:
        return { ...baseStyle, backgroundColor: '#f1f5f9', color: '#475569' }; // Soft Gray fallback
    }
  };

  return (
    <div className="page">
      <PageHeader title="User Management" subtitle="Manage system users and roles" />
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
                  {/* Dynamic badge styling applied here, with a fallback for empty roles */}
                  <span style={getRoleBadgeStyle(u.role)}>
                    {u.role || 'Unassigned'}
                  </span>
                </td>
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
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 'recipient' will hold either a specific UID or a group string (e.g., 'all_students')
  const [form, setForm] = useState({ 
    recipient: '', 
    title: '', 
    message: '', 
    type: 'info' as AppNotification['type'] 
  });

  const loadData = () => {
    Promise.all([getAllUsers(), getAllNotifications()]).then(([u, n]) => {
      setUsers(u);
      setNotifications(n);
    });
  };

  useEffect(loadData, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recipient) {
      setMessage("Please select a recipient.");
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      let targetUids: string[] = [];

      // 1. Determine who gets the notification based on the selection
      switch (form.recipient) {
        case 'all_users':
          targetUids = users.map(u => u.uid);
          break;
        case 'all_students':
          targetUids = users.filter(u => u.role === 'student').map(u => u.uid);
          break;
        case 'all_company_supervisors':
          targetUids = users.filter(u => u.role === 'company').map(u => u.uid);
          break;
        case 'all_uni_supervisors':
          targetUids = users.filter(u => u.role === 'supervisor').map(u => u.uid); // Adjust role name to match your DB
          break;
        default:
          // If it doesn't match a group, it must be a specific user's UID
          targetUids = [form.recipient];
      }

      if (targetUids.length === 0) {
        setMessage("No users found in the selected category.");
        setLoading(false);
        return;
      }

      // 2. Generate payloads and dispatch all concurrently
      const notificationPromises = targetUids.map(uid => 
        createNotification({
          userId: uid,
          title: form.title,
          message: form.message,
          type: form.type,
          read: false,
        })
      );

      await Promise.all(notificationPromises);

      setMessage(`Success! Notification sent to ${targetUids.length} user(s).`);
      setForm({ recipient: '', title: '', message: '', type: 'info' });
      loadData(); // Refresh history

    } catch (error) {
      console.error("Error sending notification:", error);
      setMessage("Failed to send notification(s).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <PageHeader title="Notification Center" subtitle="Send personalized alerts or system-wide broadcasts" />

      <div className="grid-2">
        <Card>
          <h3>Compose Message</h3>
          {message && (
            <div className={`alert ${message.includes('Success') ? 'alert-success' : 'alert-danger'}`}>
              {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="form-stack">
            <label>
              Recipient(s)
              <select 
                value={form.recipient} 
                onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                required
              >
                <option value="" disabled>Select a recipient...</option>
                
                <optgroup label="Broadcast Groups">
                  <option value="all_users">All System Users</option>
                  <option value="all_students">All Students</option>
                  <option value="all_company_supervisors">All Company Supervisors</option>
                  <option value="all_uni_supervisors">All University Supervisors</option>
                </optgroup>

                <optgroup label="Individual Students">
                  {users.filter(u => u.role === 'student').map(u => (
                    <option key={u.uid} value={u.uid}>{u.displayName} ({u.email})</option>
                  ))}
                </optgroup>

                <optgroup label="Individual Supervisors">
                  {users.filter(u => u.role === 'company' || u.role === 'supervisor').map(u => (
                    <option key={u.uid} value={u.uid}>{u.displayName} ({u.role})</option>
                  ))}
                </optgroup>
              </select>
            </label>

            <label>
              Title
              <input 
                value={form.title} 
                onChange={(e) => setForm({ ...form, title: e.target.value })} 
                required 
                placeholder="e.g., System Maintenance"
              />
            </label>

            <label>
              Message
              <textarea 
                rows={4} 
                value={form.message} 
                onChange={(e) => setForm({ ...form, message: e.target.value })} 
                required 
                placeholder="Enter notification details..."
              />
            </label>

            <label>
              Type
              <select 
                value={form.type} 
                onChange={(e) => setForm({ ...form, type: e.target.value as AppNotification['type'] })}
              >
                <option value="info">Information</option>
                <option value="error">Reminder</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Urgent / Error</option>
                
              </select>
            </label>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Send size={16} />
              {loading ? 'Sending...' : 'Dispatch Notification'}
            </button>
          </form>
        </Card>

        <Card>
          <h3>Recent Dispatches</h3>
          {notifications.length === 0 ? (
            <EmptyState message="No notifications have been sent yet." />
          ) : (
            <ul className="item-list">
              {notifications
                .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                .slice(0, 10)
                .map((notif) => {
                  // Find the user to show their name instead of UID in the history
                  const user = users.find(u => u.uid === notif.userId);
                  const recipientName = user ? user.displayName : notif.userId;
                  
                  return (
                    <li key={notif.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{notif.title}</strong>
                        <span className={`role-badge ${notif.type}`}>{notif.type}</span>
                      </div>
                      <span>{notif.message}</span>
                      <small style={{ color: '#888' }}>Sent to: {recipientName}</small>
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
