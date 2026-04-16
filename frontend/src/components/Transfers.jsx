import { useState, useEffect } from 'react';
import { getTransfers, createTransfer, getBases, getAssets } from '../api';
import { useAuth } from '../AuthContext';

export default function Transfers() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [bases, setBases] = useState([]);
  const [assets, setAssets] = useState([]);
  const [filters, setFilters] = useState({ base_id: '', asset_type: '', start_date: '', end_date: '' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ asset_name: '', asset_type: 'vehicle', from_base_id: '', to_base_id: '', quantity: '', notes: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBases().then((r) => setBases(r.data));
    getAssets().then((r) => setAssets(r.data));
  }, []);

  const fetchTransfers = () => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    getTransfers(params).then((r) => setTransfers(r.data));
  };

  useEffect(() => { fetchTransfers(); }, [filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createTransfer({ ...form, quantity: Number(form.quantity), from_base_id: Number(form.from_base_id), to_base_id: Number(form.to_base_id) });
      setShowForm(false);
      setForm({ asset_name: '', asset_type: 'vehicle', from_base_id: '', to_base_id: '', quantity: '', notes: '' });
      fetchTransfers();
    } catch (err) {
      setError(err.response?.data?.error || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const assetNames = [...new Set(assets.map((a) => a.name))];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Transfers</h2>
        <div style={styles.actions}>
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
          </div>
          <button style={styles.addBtn} onClick={() => setShowForm(true)}>+ New Transfer</button>
        </div>
      </div>

      <div style={styles.section}>
        <table style={styles.table}>
          <thead>
            <tr>{['Asset', 'Type', 'From', 'To', 'Quantity', 'By', 'Date', 'Notes'].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {transfers.length === 0 ? (
              <tr><td colSpan={8} style={{ ...styles.td, textAlign: 'center', color: '#8899bb' }}>No transfers found</td></tr>
            ) : transfers.map((t) => (
              <tr key={t.id} style={styles.tr}>
                <td style={styles.td}>{t.asset_name}</td>
                <td style={styles.td}><span style={{ ...styles.badge, background: typeColor(t.asset_type) }}>{t.asset_type}</span></td>
                <td style={{ ...styles.td, color: '#ef4444' }}>{t.from_base_name}</td>
                <td style={{ ...styles.td, color: '#10b981' }}>{t.to_base_name}</td>
                <td style={{ ...styles.td, fontWeight: 600, color: '#8b5cf6' }}>{t.quantity.toLocaleString()}</td>
                <td style={styles.td}>{t.transferred_by_name}</td>
                <td style={styles.td}>{new Date(t.transfer_date).toLocaleDateString()}</td>
                <td style={{ ...styles.td, color: '#8899bb' }}>{t.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={styles.overlay} onClick={() => setShowForm(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>New Transfer</h3>
            <form onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.label}>Asset Name</label>
              <input style={styles.formInput} list="asset-names-t" value={form.asset_name}
                onChange={(e) => setForm({ ...form, asset_name: e.target.value })} required />
              <datalist id="asset-names-t">{assetNames.map((n) => <option key={n} value={n} />)}</datalist>

              <label style={styles.label}>Asset Type</label>
              <select style={styles.formInput} value={form.asset_type} onChange={(e) => setForm({ ...form, asset_type: e.target.value })}>
                <option value="vehicle">Vehicle</option>
                <option value="weapon">Weapon</option>
                <option value="ammunition">Ammunition</option>
              </select>

              <label style={styles.label}>From Base</label>
              <select style={styles.formInput} value={form.from_base_id} onChange={(e) => setForm({ ...form, from_base_id: e.target.value })} required>
                <option value="">Select source base</option>
                {bases.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>

              <label style={styles.label}>To Base</label>
              <select style={styles.formInput} value={form.to_base_id} onChange={(e) => setForm({ ...form, to_base_id: e.target.value })} required>
                <option value="">Select destination base</option>
                {bases.filter((b) => String(b.id) !== String(form.from_base_id)).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>

              <label style={styles.label}>Quantity</label>
              <input style={styles.formInput} type="number" min="1" value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />

              <label style={styles.label}>Notes (optional)</label>
              <input style={styles.formInput} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

              {error && <div style={styles.error}>{error}</div>}
              <div style={styles.formActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" style={styles.submitBtn} disabled={loading}>{loading ? 'Transferring...' : 'Transfer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const typeColor = (t) => ({ vehicle: '#3b82f6', weapon: '#ef4444', ammunition: '#f59e0b' }[t] || '#6677aa');

const styles = {
  page: { padding: 24, color: '#e8f0fe' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  title: { margin: 0, fontSize: 22, fontWeight: 700 },
  actions: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  filters: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  select: { background: '#1a2744', border: '1px solid #2a3f6f', borderRadius: 6, padding: '6px 10px', color: '#e8f0fe', fontSize: 13 },
  input: { background: '#1a2744', border: '1px solid #2a3f6f', borderRadius: 6, padding: '6px 10px', color: '#e8f0fe', fontSize: 13 },
  addBtn: { background: '#8b5cf6', border: 'none', borderRadius: 6, padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' },
  section: { background: '#1a2744', borderRadius: 10, padding: 20, overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', color: '#8899bb', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid #2a3f6f' },
  tr: { borderBottom: '1px solid #0d1f3c' },
  td: { padding: '10px 12px', fontSize: 14 },
  badge: { padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#fff', textTransform: 'capitalize' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#1a2744', borderRadius: 12, padding: 32, width: 420, border: '1px solid #2a3f6f', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { margin: '0 0 20px', fontSize: 18, fontWeight: 700 },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { color: '#8899bb', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' },
  formInput: { background: '#0d1f3c', border: '1px solid #2a3f6f', borderRadius: 6, padding: '8px 12px', color: '#e8f0fe', fontSize: 14 },
  error: { background: '#3d1515', border: '1px solid #c0392b', borderRadius: 6, padding: '8px 12px', color: '#e74c3c', fontSize: 13 },
  formActions: { display: 'flex', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, background: '#2a3f6f', border: 'none', borderRadius: 6, padding: 10, color: '#8899bb', cursor: 'pointer' },
  submitBtn: { flex: 1, background: '#8b5cf6', border: 'none', borderRadius: 6, padding: 10, color: '#fff', cursor: 'pointer', fontWeight: 600 },
};
