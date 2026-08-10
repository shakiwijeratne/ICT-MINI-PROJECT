import React from 'react';
import { AlertTriangle } from 'lucide-react';

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
    <div 
      className="modal-overlay" 
      role="dialog" 
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
    >
      <div 
        className="modal" 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '420px',
          width: '100%',
          padding: '32px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '50%' }}>
            <AlertTriangle size={36} color="#dc2626" />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#111827', fontWeight: 600 }}>
            Session Expiring Soon
          </h3>
        </div>

        <p style={{ margin: 0, color: '#4b5563', fontSize: '1rem', lineHeight: '1.5' }}>
          For your security, you will be automatically logged out in{' '}
          <strong style={{ color: '#dc2626', fontSize: '1.1rem' }}>{secondsRemaining}</strong>{' '}
          {secondsRemaining === 1 ? 'second' : 'seconds'} due to inactivity.
        </p>

        <div className="modal-actions" style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onLogout}
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: '0.95rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Logout Now
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={onExtend}
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: '0.95rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
};