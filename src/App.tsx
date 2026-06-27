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
import './component-styles.css';

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
      <div className="app min-h-screen min-h-dvh flex flex-col pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <div className="loading-container">
          <div className="loading-spinner" />
          <div className="loading-text">Loading quotations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app min-h-screen min-h-dvh flex flex-col pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      {storeError && (
        <div className="store-error-banner bg-[var(--danger-bg)] text-[var(--danger)] py-3 px-5 text-center text-sm font-medium border-b border-[rgba(248,113,113,0.2)]">
          Error loading data: {storeError}
        </div>
      )}
      <header className="app-header sticky top-0 z-10 flex items-center justify-between bg-[var(--header-bg)] px-3 sm:px-5 border-b border-[var(--header-border)] h-[50px] h-[calc(50px+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)]">
        <h1 className="text-sm font-semibold text-[var(--text)] tracking-tight flex items-center gap-2 whitespace-nowrap flex-shrink-0">
          <img src="/logo.svg" alt="Logo" className="header-logo w-8 h-8 flex-shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
          <span className="hidden sm:inline">Quotation Manager</span>
        </h1>
        <nav className="header-actions flex items-center gap-0 flex-shrink min-w-0 overflow-x-auto scrollbar-none bg-[var(--header-actions-bg)] rounded-[10px] p-[3px] border border-[var(--header-actions-border)]">
          <NavLink to="/" end className={({ isActive }) => `btn btn-nav ${isActive ? 'active' : ''} px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium cursor-pointer border-none text-[var(--btn-text)] transition-all duration-200 tracking-tight whitespace-nowrap inline-flex items-center gap-[5px] bg-transparent min-h-[32px] hover:text-[var(--btn-hover-text)] hover:bg-[var(--btn-hover-bg)]`}>
            Dashboard
          </NavLink>
          <NavLink to="/quotations" className={({ isActive }) => `btn btn-nav ${isActive ? 'active' : ''} px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium cursor-pointer border-none text-[var(--btn-text)] transition-all duration-200 tracking-tight whitespace-nowrap inline-flex items-center gap-[5px] bg-transparent min-h-[32px] hover:text-[var(--btn-hover-text)] hover:bg-[var(--btn-hover-bg)]`}>
            Quotations
          </NavLink>
          <NavLink to="/forwarders" className={({ isActive }) => `btn btn-nav ${isActive ? 'active' : ''} px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium cursor-pointer border-none text-[var(--btn-text)] transition-all duration-200 tracking-tight whitespace-nowrap inline-flex items-center gap-[5px] bg-transparent min-h-[32px] hover:text-[var(--btn-hover-text)] hover:bg-[var(--btn-hover-bg)]`}>
            Forwarders
          </NavLink>
          <button className="btn btn-nav btn-nav-add bg-[var(--add-btn-bg)] text-[var(--add-btn-text)] font-semibold ml-1 sm:ml-1.5 rounded-lg px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs cursor-pointer border-none transition-all duration-200 tracking-tight whitespace-nowrap inline-flex items-center gap-[5px] min-h-[32px] hover:bg-[var(--add-btn-hover-bg)]" onClick={handleAdd}>
            + Add
          </button>
          <div className="user-menu flex items-center gap-1 sm:gap-2 ml-1 pl-1.5 sm:pl-2 border-l border-[var(--header-actions-border)] flex-shrink-0">
            <span className="user-email text-xs text-[var(--btn-text)] whitespace-nowrap hidden md:inline">{user?.email}</span>
            <ThemeToggle />
            <button className="btn btn-signout bg-[var(--signout-bg)] text-[var(--signout-text)] rounded-lg px-2 py-1.5 text-xs cursor-pointer border-none transition-all duration-200 hover:bg-[var(--signout-hover-bg)] hover:text-[var(--signout-hover-text)]" onClick={signOut} title="Sign out">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </nav>
      </header>

      <main className="app-main flex-1 py-4 sm:py-7 px-4 sm:px-8 max-w-full">
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
            <div className="empty-state text-center py-[60px] px-5 text-[var(--text-muted)]">
              <div className="empty-state-icon text-[48px] mb-4">{'\uD83D\uDD0D'}</div>
              <div className="empty-state-text text-[15px] font-medium">Page not found</div>
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
