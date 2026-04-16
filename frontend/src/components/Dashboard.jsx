import { useState, useEffect } from 'react';
import { getDashboard, getBases, getAssets } from '../api';
import { useAuth } from '../AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [assets, setAssets] = useState([]);
  const [bases, setBases] = useState([]);
  const [filters, setFilters] = useState({ base_id: '', asset_type: '', start_date: '', end_date: '' });
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBases().then((r) => setBases(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    Promise.all([getDashboard(params), getAssets(params)])
      .then(([s, a]) => { setStats(s.data); setAssets(a.data); })
      .finally(() => setLoading(false));
  }, [filters]);

  const statCards = stats ? [
    { label: 'Opening Balance', value: stats.openingBalance, color: '#3b82f6', icon: '📦' },
    { label: 'Purchases', value: stats.purchases, color: '#10b981', icon: '🛒' },
    { label: 'Transfers In', value: stats.transfersIn, color: '#8b5cf6', icon: '📥' },
    { label: 'Transfers Out', value: stats.transfersOut, color: '#f59e0b', icon: '📤' },
    { label: 'Assignments', value: stats.assignments, color: '#ef4444', icon: '📋' },
    { label: 'Expenditures', value: stats.expenditures, color: '#ec4899', icon: '💥' },
    { label: 'Closing Balance', value: stats.closingBalance, color: '#06b6d4', icon: '🏦' },
  ] : [];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Asset Dashboard</h2>
        <div style={styles.filters}>
          {user?.role === 'admin' && (
            <select style={styles.select} value={filters.base_id} onChange={(e) => setFilters({ ...filters, base_id: e.target.value })}>
              <option value="">All Bases</option>
              {bases.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <select style={styles.select} value={filters.asset_type} onChange={(e) => setFilters({ ...filters, asset_type: e.target.value })}>
            <option value="">All Types</option>
            <option value="vehicle">Vehicle</option>
            <option value="weapon">Weapon</option>
            <option value="ammunition">Ammunition</option>
          </select>
          <input style={styles.input} type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
          <input style={styles.input} type="date" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
          <button style={styles.clearBtn} onClick={() => setFilters({ base_id: '', asset_type: '', start_date: '', end_date: '' })}>Clear</button>
        </div>
      </div>

      {loading ? <div style={styles.loading}>Loading...</div> : (
        <>
          <div style={styles.statsGrid}>
            {statCards.map((card) => (
              <div key={card.label} style={{ ...styles.statCard, borderTop: `3px solid ${card.color}` }}
                onClick={() => setModal(card)}>
                <div style={styles.statIcon}>{card.icon}</div>
                <div style={{ ...styles.statValue, color: card.color }}>{card.value.toLocaleString()}</div>
                <div style={styles.statLabel}>{card.label}</div>
              </div>
            ))}
          </div>

          <div style={styles.row}>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>By Asset Type</h3>
              {stats?.byType?.map((t) => (
                <div key={t.type} style={styles.barRow}>
                  <span style={styles.barLabel}>{t.type}</span>
                  <div style={styles.barTrack}>
                    <div style={{ ...styles.barFill, width: `${Math.min(100, (t.total / (stats.openingBalance || 1)) * 100)}%` }} />
                  </div>
                  <span style={styles.barValue}>{t.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>By Base</h3>
              {stats?.byBase?.map((b) => (
                <div key={b.base_name} style={styles.barRow}>
                  <span style={styles.barLabel}>{b.base_name}</span>
                  <div style={styles.barTrack}>
                    <div style={{ ...styles.barFill, width: `${Math.min(100, (b.total / (stats.openingBalance || 1)) * 100)}%`, background: '#8b5cf6' }} />
                  </div>
                  <span style={styles.barValue}>{b.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Current Asset Inventory</h3>
            <table style={styles.table}>
              <thead>
                <tr>{['Asset', 'Type', 'Base', 'Quantity'].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id} style={styles.tr}>
                    <td style={styles.td}>{a.name}</td>
                    <td style={styles.td}><span style={{ ...styles.badge, background: typeColor(a.type) }}>{a.type}</span></td>
                    <td style={styles.td}>{a.base_name}</td>
                    <td style={{ ...styles.td, fontWeight: 600, color: '#3b82f6' }}>{a.quantity.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modal && (
        <div style={styles.overlay} onClick={() => setModal(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 48, textAlign: 'center' }}>{modal.icon}</div>
            <h3 style={{ color: modal.color, textAlign: 'center', margin: '8px 0' }}>{modal.label}</h3>
            <div style={{ fontSize: 48, fontWeight: 700, color: modal.color, textAlign: 'center' }}>{modal.value.toLocaleString()}</div>
            <p style={{ color: '#8899bb', textAlign: 'center', marginTop: 8 }}>Total units across all tracked assets</p>
            <button style={styles.closeBtn} onClick={() => setModal(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const typeColor = (t) => ({ vehicle: '#3b82f6', weapon: '#ef4444', ammunition: '#f59e0b' }[t] || '#6677aa');

const styles = {
  page: { padding: 24, color: '#e8f0fe' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  title: { margin: 0, fontSize: 22, fontWeight: 700 },
  filters: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  select: { background: '#1a2744', border: '1px solid #2a3f6f', borderRadius: 6, padding: '6px 10px', color: '#e8f0fe', fontSize: 13 },
  input: { background: '#1a2744', border: '1px solid #2a3f6f', borderRadius: 6, padding: '6px 10px', color: '#e8f0fe', fontSize: 13 },
  clearBtn: { background: '#2a3f6f', border: 'none', borderRadius: 6, padding: '6px 14px', color: '#8899bb', cursor: 'pointer', fontSize: 13 },
  loading: { textAlign: 'center', color: '#8899bb', padding: 40 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 24 },
  statCard: { background: '#1a2744', borderRadius: 10, padding: 20, cursor: 'pointer', transition: 'transform 0.1s', textAlign: 'center' },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 700 },
  statLabel: { color: '#8899bb', fontSize: 12, marginTop: 4 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 },
  section: { background: '#1a2744', borderRadius: 10, padding: 20, marginBottom: 16 },
  sectionTitle: { margin: '0 0 16px', fontSize: 16, color: '#8899bb', fontWeight: 600 },
  barRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  barLabel: { width: 100, fontSize: 13, color: '#8899bb', textTransform: 'capitalize' },
  barTrack: { flex: 1, height: 8, background: '#0d1f3c', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', background: '#3b82f6', borderRadius: 4, transition: 'width 0.5s' },
  barValue: { width: 60, textAlign: 'right', fontSize: 13, fontWeight: 600 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', color: '#8899bb', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid #2a3f6f' },
  tr: { borderBottom: '1px solid #1a2744' },
  td: { padding: '10px 12px', fontSize: 14 },
  badge: { padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#fff', textTransform: 'capitalize' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#1a2744', borderRadius: 12, padding: 40, width: 320, border: '1px solid #2a3f6f' },
  closeBtn: { display: 'block', width: '100%', marginTop: 24, background: '#2a3f6f', border: 'none', borderRadius: 6, padding: 10, color: '#e8f0fe', cursor: 'pointer', fontSize: 14 },
};
