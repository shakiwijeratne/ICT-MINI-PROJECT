import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/useAuth';
import { useIdleTimer } from '../../hooks/useIdleTimer';
import { TimeoutModal } from '../../components/ui/TimeoutModal';

export function AppLayout() {
  const { user, logout } = useAuth();

  const { showWarning, secondsRemaining, extendSession } = useIdleTimer({
    isLoggedIn: !!user,
    onTimeout: () => logout(),
  });

  return (
    <div className="app-layout">
      <Sidebar />
      
      <main className="main-content">
        <Outlet />
      </main>

      {/* Renders fixed on top of the layout when active */}
      <TimeoutModal 
        isOpen={showWarning}
        secondsRemaining={secondsRemaining}
        onExtend={extendSession}
        onLogout={logout}
      />
    </div>
  );
}