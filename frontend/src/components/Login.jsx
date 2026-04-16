import { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.icon}>🎖️</span>
          <h1 style={styles.title}>Military Asset Management</h1>
          <p style={styles.subtitle}>Secure Command Portal</p>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Enter username"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter password"
              required
            />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>
        <div style={styles.credentials}>
          <p style={styles.credTitle}>Demo Credentials:</p>
          <p>admin / admin123 (Admin)</p>
          <p>commander_alpha / commander123 (Base Commander)</p>
          <p>logistics1 / logistics123 (Logistics Officer)</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a1628' },
  card: { background: '#1a2744', borderRadius: 12, padding: 40, width: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', border: '1px solid #2a3f6f' },
  header: { textAlign: 'center', marginBottom: 32 },
  icon: { fontSize: 48 },
  title: { color: '#e8f0fe', fontSize: 22, margin: '8px 0 4px', fontWeight: 700 },
  subtitle: { color: '#8899bb', fontSize: 14, margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { color: '#8899bb', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 },
  input: { background: '#0d1f3c', border: '1px solid #2a3f6f', borderRadius: 6, padding: '10px 14px', color: '#e8f0fe', fontSize: 15, outline: 'none' },
  error: { background: '#3d1515', border: '1px solid #c0392b', borderRadius: 6, padding: '10px 14px', color: '#e74c3c', fontSize: 14 },
  button: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
  credentials: { marginTop: 24, padding: 16, background: '#0d1f3c', borderRadius: 8, fontSize: 12, color: '#6677aa', lineHeight: 1.8 },
  credTitle: { color: '#8899bb', fontWeight: 600, marginBottom: 4 },
};
