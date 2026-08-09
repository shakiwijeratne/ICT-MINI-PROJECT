import { useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  BarChart3,
  Users,
  Building2,
  Bell,
  Settings,
  LogOut,
  ClipboardCheck,
  Award,
  User,
  X,
  Edit2,
  Check,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import type { UserRole } from '../../types';

const navItems: Record<UserRole, { to: string; label: string; icon: typeof LayoutDashboard }[]> = {
  student: [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/diary', label: 'Daily Diary', icon: BookOpen },
    { to: '/student/reports', label: 'Weekly Reports', icon: FileText },
    { to: '/student/progress', label: 'Progress', icon: BarChart3 },
  ],
  company: [
    { to: '/company', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/company/verify', label: 'Verify Reports', icon: ClipboardCheck },
    { to: '/company/evaluations', label: 'Evaluations', icon: Award },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/internships', label: 'Internships', icon: Building2 },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ],
  supervisor: [
    { to: '/supervisor', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/supervisor/students', label: 'Students', icon: Users },
    { to: '/supervisor/reports', label: 'Reports', icon: ClipboardCheck },
    { to: '/supervisor/diary-review', label: 'Diary Review', icon: BookOpen },
    { to: '/supervisor/evaluations', label: 'Evaluations', icon: Award },
    { to: '/supervisor/analytics', label: 'Analytics', icon: BarChart3 },
  ],
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');

  if (!user) return null;

  const items = navItems[user.role];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleOpenModal = () => {
    setDisplayName(user.displayName || '');
    setPhone(user.phone || '');
    setIsEditing(false);
    setIsOpen(true);
  };

  const handleSave = () => {
    user.displayName = displayName;
    user.phone = phone;
    setIsEditing(false);
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">IMS</div>
          <div>
            <h1>CareerLink</h1>
            <p>Smart Internship Monitoring System</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === `/${user.role}`}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <strong>{user.displayName}</strong>
              <span className="role-badge">{user.role}</span>
            </div>
          </div>

          {/* Profile Clickable Button */}
          <button
            type="button"
            className="logout-btn"
            style={{ marginBottom: '8px', backgroundColor: 'rgba(255, 255, 255, 0.15)', cursor: 'pointer' }}
            onClick={handleOpenModal}
          >
            <User size={16} />
            View Profile
          </button>

          <button type="button" className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Profile Popup Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '420px',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              color: '#1f2937',
              fontFamily: 'sans-serif',
            }}
          >
            {/* Header */}
            <div
              style={{
                backgroundColor: '#2563eb',
                padding: '16px',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={20} /> User Profile
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '20px' }}>
              <div style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 'bold', color: '#2563eb', marginBottom: '16px' }}>
                Role: {user.role}
              </div>

              {/* Form Input fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        boxSizing: 'border-box',
                      }}
                    />
                  ) : (
                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{displayName || user.displayName}</div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Email Address</label>
                  <div style={{ fontWeight: '600', fontSize: '15px', color: '#4b5563' }}>{user.email}</div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Phone Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+94 7X XXX XXXX"
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        boxSizing: 'border-box',
                      }}
                    />
                  ) : (
                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{phone || user.phone || 'Not provided'}</div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div style={{ marginTop: '24px', paddingTop: '12px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Check size={16} /> Save
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Edit2 size={16} /> Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}