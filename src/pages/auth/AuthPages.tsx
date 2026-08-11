import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
} from 'lucide-react';
import { registerUser, loginUser, resetPassword } from '../../services/authService';
import { useAuth } from '../../contexts/useAuth';
import type { UserRole } from '../../types';

// Helper function - translate raw Firebase errors into clean UI messages
const getFriendlyErrorMessage = (err: unknown): string => {
  const msg = err instanceof Error ? err.message : String(err);
  
  if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) {
    return 'Invalid email or password. Please try again.';
  }
  if (msg.includes('auth/network-request-failed')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  if (msg.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists.';
  }
  if (msg.includes('auth/weak-password')) {
    return 'Your password must be at least 6 characters long.';
  }
  if (msg.includes('auth/too-many-requests')) {
    return 'Too many failed attempts. Please try again later or reset your password.';
  }
  
  // Fallback: Strip out the ugly "Firebase: Error (...)" wrapper if it's an unmapped error
  return msg.replace(/Firebase: Error \(.*?\)\.?/g, '').trim() || 'Authentication failed. Please try again.';
};

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // States specifically for Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await loginUser(email, password);
      await refreshUser();
      navigate(`/${user.role}`);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetError('Please enter your email address first.');
      return;
    }
    try {
      setResetError('');
      setResetMessage('');
      setResetLoading(true);
      await resetPassword(resetEmail);
      
      // Message will now display inside the modal
      setResetMessage('Password reset link sent! Check your inbox.');
      
      setTimeout(() => {
        setShowForgotModal(false);
        setResetMessage('');
      }, 3000);
    } catch (err: any) {
      setResetError(getFriendlyErrorMessage(err));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page-wrapper">
        <div className="auth-top-branding">
          <h1>CareerLink</h1>
          <p>Smart Internship Monitoring System</p>
        </div>

        <div className="auth-container">
          <div className="auth-hero auth-illustration-panel">
            <img 
              src='src\assets\images\Intern Students.jpeg'
              alt="Collaboration Illustration" 
              className="auth-illustration-img" 
            />
          </div>

          <div className="auth-form-panel">
            <h2>Welcome!</h2>
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-error">{error}</div>}
              
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""
                  required
                />
              </label>
              <label>
                Password
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />

                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              </label>

              <div className="forgot-password-wrapper" style={{ textAlign: 'right', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    // Reset modal states when opening
                    setResetEmail(email);
                    setResetError('');
                    setResetMessage('');
                    setShowForgotModal(true);
                  }}
                  style={{ fontSize: '12px', color: '#2588ff', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'none' }}
                >
                  Forgot Password?
                </button>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="auth-switch">
              Don't you have an account? <Link to="/register">Register here</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', maxWidth: '400px', width: '100%', padding: '24px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Reset Password</h3>
            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '16px' }}>
              Enter your email address below and we will send you a link to reset your password.
            </p>
            
            {/* Success Message UI rendered inside the modal */}
            {resetMessage && (
              <div style={{ color: '#15803d', backgroundColor: '#dcfce7', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', border: '1px solid #bbf7d0' }}>
                {resetMessage}
              </div>
            )}
            
            {/* Error Message UI rendered inside the modal */}
            {resetError && (
              <div style={{ color: '#b91c1c', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', border: '1px solid #fecaca' }}>
                {resetError}
              </div>
            )}

            <form onSubmit={handlePasswordReset}>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '16px', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#2588ff', color: 'white', cursor: 'pointer' }}
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({
    role: 'student' as UserRole,
    displayName: '',
    email: '',
    password: '',
    indexNumber: '',
    department: '',
    companyName: '',
    designation: '',    
    universityName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await registerUser(form.role, form.email, form.password, form.displayName, {
        indexNumber: form.indexNumber || undefined,
        department: form.department || undefined,
        companyName: form.companyName || undefined,
        designation: form.designation || undefined,       
        universityName: form.universityName || undefined,
      });
      await refreshUser();
      navigate(`/${user.role}`);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container register-container">
        <div className="auth-form-panel wide">
          <h2>Create Account</h2>
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-grid">
              <label>
                Role
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                >
                  <option value="student">Student</option>
                  <option value="supervisor">University Supervisor</option>
                  <option value="company">Company</option>
                  <option value="admin">Administrator</option>
                </select>
              </label>
              <label>
                Full Name
                <input
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={6}
                  required
                />
              </label>
              {form.role === 'student' && (
                <>
                  <label>
                    Index Number
                    <input
                      value={form.indexNumber}
                      onChange={(e) => setForm({ ...form, indexNumber: e.target.value })}
                      placeholder="ICT/23/927"
                    />
                  </label>
                  <label>
                    Department
                    <input
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                    />
                  </label>
                </>
              )}
              {form.role === 'company' && (
               <> 
                <label className="full-width">
                  Company Name
                  <input
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  />
                </label>
                <label className="full-width">
                    Designation
                    <input
                      value={form.designation}
                      onChange={(e) => setForm({ ...form, designation: e.target.value })}
                      required
                    />
                </label>
               </> 
              )}
            </div>

            {form.role === 'supervisor' && (
                <>
                  <label className="full-width">
                    University Name
                    <input
                      value={form.universityName}
                      onChange={(e) => setForm({ ...form, universityName: e.target.value })}
                      required
                    />
                  </label>
                  <label className="full-width">
                    Designation (e.g., Head of Department, Lecturer)
                    <input
                      value={form.designation}
                      onChange={(e) => setForm({ ...form, designation: e.target.value })}
                      required
                    />
                  </label>
                </>
              )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}