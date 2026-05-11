import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '../../api/hooks';
import { useSessionStore } from '../../store';
import type { User } from '../../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useSessionStore();
  const { data: users = [], isLoading } = useUsers();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!Array.isArray(users)) {
      setError('System error: User data is not available.');
      return;
    }
    const user = users.find(u => u.email === email);
    if (user) {
      setCurrentUser(user);
      navigate('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0f4f8', padding: 20 }}>
      <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--g300)', height: 520, width: '100%', maxWidth: 800, background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ width: 260, background: 'var(--navy)', flexShrink: 0, padding: '32px 28px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: 'rgba(10,132,208,.15)', top: -60, right: -60 }}></div>
          <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', background: 'rgba(10,132,208,.1)', bottom: 40, left: -60 }}></div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', position: 'relative' }}>BLueprint</div>
          <div style={{ fontSize: 11, color: '#7CA8D4', marginTop: 2, position: 'relative' }}>Fellowship Intelligence Platform</div>
          <div style={{ marginTop: 36, position: 'relative' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>Architect your<br />fellowship future.</div>
            <div style={{ fontSize: 11, color: '#7CA8D4', marginTop: 10, lineHeight: 1.6 }}>AI-powered candidate mapping across 50+ partner COEs for 500+ corporate mandates.</div>
          </div>
          <div style={{ marginTop: 28, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)' }}></div><span style={{ fontSize: 11, color: '#A8C8E8' }}>Smart AI mapping engine</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)' }}></div><span style={{ fontSize: 11, color: '#A8C8E8' }}>5 role-based portals</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)' }}></div><span style={{ fontSize: 11, color: '#A8C8E8' }}>Digital LOI &amp; DocuSign</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)' }}></div><span style={{ fontSize: 11, color: '#A8C8E8' }}>Real-time MIS analytics</span></div>
          </div>
          <div style={{ marginTop: 'auto', fontSize: 10, color: '#4A6FA5', position: 'relative' }}>© 2025 BridgeLabz Solutions LLP</div>
        </div>
        <div style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ width: '100%', maxWidth: 320 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--g900)', marginBottom: 4 }}>Sign in</div>
            <div style={{ fontSize: 12, color: 'var(--g500)', marginBottom: 24 }}>Enter your BridgeLabz credentials to continue</div>
            
            {error && <div style={{ marginBottom: 16, padding: '8px 12px', background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: 6, fontSize: 11 }}>{error}</div>}
            
            <form onSubmit={handleSignIn}>
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input 
                  className="form-input" 
                  placeholder="you@bridgelabz.com" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  className="form-input" 
                  placeholder="••••••••••" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div style={{ textAlign: 'right', marginBottom: 16, marginTop: -6 }}>
                <span style={{ fontSize: 11, color: 'var(--blue)', cursor: 'pointer' }}>Forgot password?</span>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 9 }} disabled={isLoading}>
                <i className="ti ti-login" aria-hidden="true"></i> Sign In
              </button>
            </form>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--g300)' }}></div>
              <span style={{ fontSize: 10, color: 'var(--g500)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--g300)' }}></div>
            </div>
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
              <i className="ti ti-brand-aws" aria-hidden="true"></i> Continue with AWS Cognito SSO
            </button>
            
            <div style={{ marginTop: 16, background: 'var(--blue-light)', borderRadius: 6, padding: '8px 10px', fontSize: 10, color: 'var(--navy)' }}>
              <strong>Demo accounts:</strong> am@bl.com · clh@bl.com · hoe@bl.com · mis@bl.com · coord@bl.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
