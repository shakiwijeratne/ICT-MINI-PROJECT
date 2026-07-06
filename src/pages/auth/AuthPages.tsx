import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Building2, UserCheck, Shield } from 'lucide-react';
import { registerUser, loginUser } from '../../services/authService';
import { useAuth } from '../../contexts/useAuth';
import { isFirebaseConfigured } from '../../services/firebase';
import type { UserRole } from '../../types';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { refreshUser, demoLogin } = useAuth();
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
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = (role: UserRole) => {
    demoLogin(role);
    navigate(`/${role}`);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-hero">
          <GraduationCap size={48} />
          <h1>Smart Internship Monitoring System</h1>
          <p>
            Web-based platform for internship tracking, reporting, evaluation, and progress
            monitoring — University of Sri Jayewardenepura
          </p>
          {!isFirebaseConfigured && (
            <div className="demo-banner">
              Demo mode active — use quick login below or register a local account
            </div>
          )}
        </div>

        <div className="auth-form-panel">
          <h2>Sign In</h2>
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error">{error}</div>}
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@fot.sjp.ac.lk"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-switch">
            No account? <Link to="/register">Register here</Link>
          </p>

          {!isFirebaseConfigured && (
            <div className="demo-logins">
              <p>Quick demo login:</p>
              <div className="demo-buttons">
                <button type="button" className="btn btn-outline" onClick={() => handleDemo('student')}>
                  <GraduationCap size={16} /> Student
                </button>
                <button type="button" className="btn btn-outline" onClick={() => handleDemo('supervisor')}>
                  <UserCheck size={16} /> Supervisor
                </button>
                <button type="button" className="btn btn-outline" onClick={() => handleDemo('company')}>
                  <Building2 size={16} /> Company
                </button>
                <button type="button" className="btn btn-outline" onClick={() => handleDemo('admin')}>
                  <Shield size={16} /> Admin
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    role: 'student' as UserRole,
    indexNumber: '',
    department: '',
    companyName: '',
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
      const user = await registerUser(form.email, form.password, form.displayName, form.role, {
        indexNumber: form.indexNumber || undefined,
        department: form.department || undefined,
        companyName: form.companyName || undefined,
      });
      await refreshUser();
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
                <label className="full-width">
                  Company Name
                  <input
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  />
                </label>
              )}
            </div>

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
