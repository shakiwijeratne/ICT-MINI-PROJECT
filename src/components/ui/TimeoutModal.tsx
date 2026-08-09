import React from 'react';

interface TimeoutModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
}

export const TimeoutModal: React.FC<TimeoutModalProps> = ({
  isOpen,
  secondsRemaining,
  onExtend,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Session Timeout Warning</h3>
        <p>
          You will be logged out in{' '}
          <strong style={{ color: '#dc2626' }}>{secondsRemaining}</strong>{' '}
          {secondsRemaining === 1 ? 'second' : 'seconds'} due to inactivity.
        </p>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onLogout}>
            Logout
          </button>
          <button type="button" className="btn-primary" onClick={onExtend}>
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
};