
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
import { StudentNotificationsPage } from './pages/student/Notifications';

import { SupervisorDashboard } from './pages/supervisor/Dashboard';
import {
  SupervisorStudentsPage,
  SupervisorAnalyticsPage,
} from './pages/supervisor/Pages';
import { SupervisorDiaryReview } from './pages/supervisor/SupervisorDiaryReview';
import { SupervisorNotificationsPage } from './pages/supervisor/Notifications';
import { SupervisorEvaluationPage } from './pages/supervisor/evaluation';

import { CompanyDashboard } from './pages/company/Pages';
import { CompanyVerifyPage } from './pages/company/Pages';
import { CompanyEvaluationsPage } from './pages/company/Pages';
import { CompanyNotificationsPage } from './pages/company/Notifications';

import {
  AdminDashboard,
  AdminUsersPage,
  AdminInternshipsPage,
  AdminNotificationsPage,
  AdminSettingsPage,
} from './pages/admin/Pages';

import { AdminAssignmentsPage } from './pages/admin/Assignments';

import { InternshipProvider } from './contexts/InternshipContext';
import { ProfilePage } from './pages/Profile/Profile';


function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <Navigate to="/login" replace />;
}


function AppRoutes() {
  return (
    <Routes>

      {/* =========================
          PUBLIC ROUTES
      ========================== */}

      <Route path="/" element={<RootRedirect />} />

      <Route path="/login" element={<LoginPage />} />

      <Route path="/register" element={<RegisterPage />} />


      {/* =========================
          STUDENT ROUTES
      ========================== */}

      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<AppLayout />}>

          <Route
            path="/student"
            element={<StudentDashboard />}
          />

          <Route
            path="/student/diary"
            element={<StudentDiaryPage />}
          />

          <Route
            path="/student/reports"
            element={<StudentReportsPage />}
          />

          <Route
            path="/student/progress"
            element={<StudentProgressPage />}
          />

          <Route
            path="/student/profile"
            element={<ProfilePage />}
          />

          <Route
            path="/student/notifications"
            element={<StudentNotificationsPage />}
          />

        </Route>
      </Route>


      {/* =========================
          SUPERVISOR ROUTES
      ========================== */}

      <Route element={<ProtectedRoute allowedRoles={['supervisor']} />}>
        <Route element={<AppLayout />}>

          <Route
            path="/supervisor"
            element={<SupervisorDashboard />}
          />

          <Route
            path="/supervisor/students"
            element={<SupervisorStudentsPage />}
          />

          <Route
            path="/supervisor/diary-review"
            element={<SupervisorDiaryReview />}
          />

          <Route
            path="/supervisor/analytics"
            element={<SupervisorAnalyticsPage />}
          />

          <Route
            path="/supervisor/evaluations"
            element={<SupervisorEvaluationPage />}
          />

          <Route
            path="/supervisor/profile"
            element={<ProfilePage />}
          />

          <Route
            path="/supervisor/notifications"
            element={<SupervisorNotificationsPage />}
          />

        </Route>
      </Route>


      {/* =========================
          COMPANY ROUTES
      ========================== */}

      <Route element={<ProtectedRoute allowedRoles={['company']} />}>
        <Route element={<AppLayout />}>

          <Route
            path="/company"
            element={<CompanyDashboard />}
          />

          <Route
            path="/company/verify"
            element={<CompanyVerifyPage />}
          />

          <Route
            path="/company/evaluations"
            element={<CompanyEvaluationsPage />}
          />

          <Route
            path="/company/profile"
            element={<ProfilePage />}
          />

          <Route
            path="/company/notifications"
            element={<CompanyNotificationsPage />}
          />

        </Route>
      </Route>


      {/* =========================
          ADMIN ROUTES
      ========================== */}

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AppLayout />}>

          <Route
            path="/admin"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin/users"
            element={<AdminUsersPage />}
          />

          <Route
            path="/admin/internships"
            element={<AdminInternshipsPage />}
          />

          <Route
            path="/admin/notifications"
            element={<AdminNotificationsPage />}
          />

          <Route
            path="/admin/settings"
            element={<AdminSettingsPage />}
          />

          <Route
            path="/admin/assignments"
            element={<AdminAssignmentsPage />}
          />

        </Route>
      </Route>


      {/* =========================
          FALLBACK ROUTE
      ========================== */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}


export default function App() {
  return (
    <BrowserRouter>

      <AuthProvider>

        {/* InternshipProvider must be inside AuthProvider */}
        <InternshipProvider>

          <AppRoutes />

        </InternshipProvider>

      </AuthProvider>

    </BrowserRouter>
  );
}

