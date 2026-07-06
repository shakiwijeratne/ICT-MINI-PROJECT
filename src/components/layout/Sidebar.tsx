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
  supervisor: [
    { to: '/supervisor', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/supervisor/students', label: 'Students', icon: Users },
    { to: '/supervisor/reports', label: 'Reports', icon: ClipboardCheck },
    { to: '/supervisor/analytics', label: 'Analytics', icon: BarChart3 },
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
    { to: '/admin/companies', label: 'Companies', icon: Building2 },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ],
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const items = navItems[user.role];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">IMS</div>
        <div>
          <h1>Smart Internship</h1>
          <p>Monitoring System</p>
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
          <div className="avatar">{user.displayName.charAt(0)}</div>
          <div>
            <strong>{user.displayName}</strong>
            <span className="role-badge">{user.role}</span>
          </div>
        </div>
        <button type="button" className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
