import { useState, useMemo, useCallback, Component, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useStore } from './store';
import { useAuth, AuthProvider } from './auth';
import { ThemeProvider, useTheme } from './theme';
import type { Quotation, QuotationInput, Filters } from './types';
import Dashboard from './components/Dashboard';
import QuotationTable from './components/QuotationTable';
import QuotationForm from './components/QuotationForm';
import SearchFilter from './components/SearchFilter';
import Forwarders from './components/Forwarders';
import LoginPage from './components/LoginPage';
import './App.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  state = { hasError: false, error: '' };
  static getDerivedStateFromError(err: Error) {
    return { hasError: true, error: err.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="login-page">
          <div className="login-card">
            <h2>Something went wrong</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '12px 0' }}>{this.state.error}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      className="btn btn-nav btn-theme-toggle"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}
    </button>
  );
}

function AppContent() {
  const { session, user, loading: authLoading, signOut } = useAuth();
  const { quotations, forwarders, addQuotation, updateQuotation, deleteQuotation, addForwarder, deleteForwarder, loading, error: storeError } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [filters, setFilters] = useState<Filters>({ search: '', entity: '', status: '' });

  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const searchLower = filters.search.toLowerCase();
      const searchMatch = !filters.search ||
        q.supplierName.toLowerCase().includes(searchLower) ||
        q.supplierPO.toLowerCase().includes(searchLower) ||
        q.remarks.toLowerCase().includes(searchLower) ||
        q.origin.toLowerCase().includes(searchLower) ||
        q.destination.toLowerCase().includes(searchLower) ||
        q.awardedTo.toLowerCase().includes(searchLower) ||
        q.entity.toLowerCase().includes(searchLower) ||
        q.mode.toLowerCase().includes(searchLower) ||
        q.size.toLowerCase().includes(searchLower) ||
        q.incoterms.toLowerCase().includes(searchLower) ||
        q.transitTime.toLowerCase().includes(searchLower) ||
        q.status.toLowerCase().includes(searchLower) ||
        q.quotes.some(qu => qu.forwarder.toLowerCase().includes(searchLower));

      const entityMatch = !filters.entity || q.entity === filters.entity;
      const statusMatch = !filters.status || q.status === filters.status;

      return searchMatch && entityMatch && statusMatch;
    });
  }, [quotations, filters]);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingQuotation(null);
  }, []);

  if (authLoading) {
    return (
      <div className="login-page">
        <div className="login-bg">
          <div className="login-bg-orb login-bg-orb-1" />
          <div className="login-bg-orb login-bg-orb-2" />
          <div className="login-bg-orb login-bg-orb-3" />
        </div>
        <div className="loading-container">
          <div className="loading-spinner" />
          <div className="loading-text">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  const handleSave = async (data: QuotationInput & { percentage: number }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { percentage: _pct, ...input } = data;
      if (editingQuotation) {
        await updateQuotation(editingQuotation.id, input);
      } else {
        await addQuotation(input);
      }
      setShowForm(false);
      setEditingQuotation(null);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleEdit = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        await deleteQuotation(id);
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  const handleAward = async (id: number, forwarder: string) => {
    try {
      await updateQuotation(id, { awardedTo: forwarder });
    } catch (err) {
      console.error('Award failed:', err);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateQuotation(id, { status });
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleAdd = () => {
    setEditingQuotation(null);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner" />
          <div className="loading-text">Loading quotations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {storeError && (
        <div className="store-error-banner">
          Error loading data: {storeError}
        </div>
      )}
      <header className="app-header">
        <h1>
          <img src="/logo.svg" alt="Logo" className="header-logo" />
          Quotation Manager
        </h1>
        <nav className="header-actions">
          <NavLink to="/" end className={({ isActive }) => `btn btn-nav ${isActive ? 'active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/quotations" className={({ isActive }) => `btn btn-nav ${isActive ? 'active' : ''}`}>
            Quotations
          </NavLink>
          <NavLink to="/forwarders" className={({ isActive }) => `btn btn-nav ${isActive ? 'active' : ''}`}>
            Forwarders
          </NavLink>
          <button className="btn btn-nav btn-nav-add" onClick={handleAdd}>
            Add Quotation
          </button>
          <div className="user-menu">
            <span className="user-email">{user?.email}</span>
            <ThemeToggle />
            <button className="btn btn-signout" onClick={signOut} title="Sign out">
              {'\uD83D\uDEAA'}
            </button>
          </div>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard quotations={quotations} forwarders={forwarders} />} />
          <Route
            path="/quotations"
            element={
              <>
                <SearchFilter filters={filters} onFilterChange={setFilters} resultCount={filteredQuotations.length} totalCount={quotations.length} />
                <QuotationTable
                  quotations={filteredQuotations}
                  forwarders={forwarders}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAward={handleAward}
                  onStatusChange={handleStatusChange}
                />
              </>
            }
          />
          <Route
            path="/forwarders"
            element={
              <Forwarders
                forwarders={forwarders}
                onAdd={addForwarder}
                onDelete={deleteForwarder}
              />
            }
          />
          <Route path="*" element={
            <div className="empty-state">
              <div className="empty-state-icon">{'\uD83D\uDD0D'}</div>
              <div className="empty-state-text">Page not found</div>
            </div>
          } />
        </Routes>
      </main>

      {showForm && (
        <QuotationForm
          quotation={editingQuotation}
          forwarders={forwarders}
          onSave={handleSave}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
