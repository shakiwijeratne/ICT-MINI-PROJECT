
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  BarChart3,
  Users,
  UserPlus,
  Building2,
  Bell,
  Settings,
  LogOut,
  ClipboardCheck,
  Award,
} from 'lucide-react';

import { useAuth } from '../../contexts/useAuth';
import type { UserRole } from '../../types';


const navItems: Record<
  UserRole,
  {
    to: string;
    label: string;
    icon: typeof LayoutDashboard;
  }[]
> = {
 
  student: [
    {
      to: '/student',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/student/diary',
      label: 'Daily Diary',
      icon: BookOpen,
    },
    {
      to: '/student/reports',
      label: 'Weekly Reports',
      icon: FileText,
    },
    {
      to: '/student/progress',
      label: 'Progress',
      icon: BarChart3,
    },
    {
      to: '/student/notifications',
      label: 'Notifications',
      icon: Bell,
    },
  ],


  // =========================
  // COMPANY
  // =========================
  company: [
    {
      to: '/company',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/company/verify',
      label: 'Verify Reports',
      icon: ClipboardCheck,
    },
    {
      to: '/company/evaluations',
      label: 'Evaluations',
      icon: Award,
    },
    {
      to: '/company/notifications',
      label: 'Notifications',
      icon: Bell,
    },
  ],


  // =========================
  // ADMIN
  // =========================
  admin: [
    {
      to: '/admin',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/admin/users',
      label: 'Users',
      icon: Users,
    },
    {
      to: '/admin/internships',
      label: 'Internships',
      icon: Building2,
    },
    {
      to: '/admin/assignments',
      label: 'Assign Students',
      icon: UserPlus,
    },
    {
      to: '/admin/notifications',
      label: 'Notifications',
      icon: Bell,
    },
    {
      to: '/admin/settings',
      label: 'Settings',
      icon: Settings,
    },
  ],


  // =========================
  // UNIVERSITY SUPERVISOR
  // =========================
  supervisor: [
    {
      to: '/supervisor',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/supervisor/students',
      label: 'Students',
      icon: Users,
    },
    {
      to: '/supervisor/reports',
      label: 'Reports',
      icon: ClipboardCheck,
    },
    {
      to: '/supervisor/diary-review',
      label: 'Diary Review',
      icon: BookOpen,
    },
    {
      to: '/supervisor/evaluations',
      label: 'Evaluations',
      icon: Award,
    },
    {
      to: '/supervisor/analytics',
      label: 'Analytics',
      icon: BarChart3,
    },
    {
      to: '/supervisor/notifications',
      label: 'Notifications',
      icon: Bell,
    },
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


  const handleProfileClick = () => {
    navigate(`/${user.role}/profile`);
  };


  return (
    <aside className="sidebar">

      {/* =========================
          BRAND
      ========================== */}

      <div className="sidebar-brand">
        <div className="brand-icon">IMS</div>

        <div>
          <h1>CareerLink</h1>
          <p>Smart Internship Monitoring System</p>
        </div>
      </div>


      {/* =========================
          NAVIGATION
      ========================== */}

      <nav className="sidebar-nav">

        {items.map(({ to, label, icon: Icon }) => (

          <NavLink
            key={to}
            to={to}
            end={to === `/${user.role}`}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={18} />

            <span>{label}</span>
          </NavLink>

        ))}

      </nav>


      {/* =========================
          USER / PROFILE / LOGOUT
      ========================== */}

      <div className="sidebar-footer">

        <div
          className="user-info"
          onClick={handleProfileClick}
          style={{
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.opacity = '0.8')
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.opacity = '1')
          }
          title="View Profile"
        >

          <div
            className="avatar"
            style={{
              overflow: 'hidden',
              padding: user.photoURL ? 0 : undefined,
            }}
          >

            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              user.displayName.charAt(0)
            )}

          </div>


          <div>

            <strong>{user.displayName}</strong>

            <span className="role-badge">
              {user.role}
            </span>

          </div>

        </div>


        <button
          type="button"
          className="logout-btn"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Logout
        </button>

      </div>

    </aside>
  );
}

