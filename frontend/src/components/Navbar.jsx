import { useAuth } from '../AuthContext';

const ROLE_LABELS = {
  admin: 'Administrator',
  base_commander: 'Base Commander',
  logistics_officer: 'Logistics Officer',
};

const ROLE_COLORS = {
  admin: '#e74c3c',
  base_commander: '#f39c12',
  logistics_officer: '#27ae60',
};

export default function Navbar({ activePage, setActivePage }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'purchases', label: '🛒 Purchases' },
    { id: 'transfers', label: '🔄 Transfers' },
    { id: 'assignments', label: '📋 Assignments' },
  ];

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>
        <span style={styles.brandIcon}>🎖️</span>
        <span style={styles.brandText}>MilAsset</span>
      </div>
      <div style={styles.navItems}>
        {navItems.map((item) => (
          <button
            key={item.id}
            style={{ ...styles.navBtn, ...(activePage === item.id ? styles.navBtnActive : {}) }}
            onClick={() => setActivePage(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div style={styles.userInfo}>
        <div>
          <div style={styles.username}>{user?.username}</div>
          <div style={{ ...styles.role, color: ROLE_COLORS[user?.role] }}>
            {ROLE_LABELS[user?.role]}
          </div>
          {user?.base && <div style={styles.base}>{user.base}</div>}
        </div>
        <button style={styles.logoutBtn} onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: { display: 'flex', alignItems: 'center', background: '#1a2744', padding: '0 24px', height: 60, borderBottom: '1px solid #2a3f6f', gap: 24 },
  brand: { display: 'flex', alignItems: 'center', gap: 8, marginRight: 16 },
  brandIcon: { fontSize: 24 },
  brandText: { color: '#e8f0fe', fontWeight: 700, fontSize: 18, letterSpacing: 1 },
  navItems: { display: 'flex', gap: 4, flex: 1 },
  navBtn: { background: 'transparent', border: 'none', color: '#8899bb', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  navBtnActive: { background: '#2563eb', color: '#fff' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 16 },
  username: { color: '#e8f0fe', fontSize: 14, fontWeight: 600 },
  role: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
  base: { color: '#6677aa', fontSize: 11 },
  logoutBtn: { background: '#2a3f6f', border: 'none', color: '#8899bb', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
};
