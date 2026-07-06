import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage, RegisterPage } from './pages/auth/AuthPages';
import { StudentDashboard } from './pages/student/Dashboard';
import { StudentDiaryPage } from './pages/student/Diary';
import { StudentReportsPage } from './pages/student/Reports';
import { StudentProgressPage } from './pages/student/Progress';
import { SupervisorDashboard } from './pages/supervisor/Dashboard';
import {
  SupervisorStudentsPage,
  SupervisorReportsPage,
  SupervisorAnalyticsPage,
} from './pages/supervisor/Pages';
import {
  CompanyDashboard,
  CompanyVerifyPage,
  CompanyEvaluationsPage,
} from './pages/company/Pages';
import {
  AdminDashboard,
  AdminUsersPage,
  AdminInternshipsPage,
  AdminCompaniesPage,
  AdminNotificationsPage,
  AdminSettingsPage,
} from './pages/admin/Pages';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={`/${user.role}`} replace />;
  return <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<AppLayout />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/diary" element={<StudentDiaryPage />} />
          <Route path="/student/reports" element={<StudentReportsPage />} />
          <Route path="/student/progress" element={<StudentProgressPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['supervisor']} />}>
        <Route element={<AppLayout />}>
          <Route path="/supervisor" element={<SupervisorDashboard />} />
          <Route path="/supervisor/students" element={<SupervisorStudentsPage />} />
          <Route path="/supervisor/reports" element={<SupervisorReportsPage />} />
          <Route path="/supervisor/analytics" element={<SupervisorAnalyticsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['company']} />}>
        <Route element={<AppLayout />}>
          <Route path="/company" element={<CompanyDashboard />} />
          <Route path="/company/verify" element={<CompanyVerifyPage />} />
          <Route path="/company/evaluations" element={<CompanyEvaluationsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/internships" element={<AdminInternshipsPage />} />
          <Route path="/admin/companies" element={<AdminCompaniesPage />} />
          <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
