import { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Purchases from './components/Purchases';
import Transfers from './components/Transfers';
import Assignments from './components/Assignments';

function AppContent() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  if (!user) return <Login />;

  const pages = {
    dashboard: <Dashboard />,
    purchases: <Purchases />,
    transfers: <Transfers />,
    assignments: <Assignments />,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a1628' }}>
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      <main>{pages[activePage]}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
