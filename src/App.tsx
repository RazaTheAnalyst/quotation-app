import { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useStore } from './store';
import { useAuth, AuthProvider } from './auth';
import type { Quotation, QuotationInput, Filters } from './types';
import Dashboard from './components/Dashboard';
import QuotationTable from './components/QuotationTable';
import QuotationForm from './components/QuotationForm';
import SearchFilter from './components/SearchFilter';
import Forwarders from './components/Forwarders';
import LoginPage from './components/LoginPage';
import './App.css';

function AppContent() {
  const { session, user, loading: authLoading, signOut } = useAuth();
  const { quotations, forwarders, addQuotation, updateQuotation, deleteQuotation, addForwarder, deleteForwarder, loading } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [filters, setFilters] = useState<Filters>({ search: '', entity: '', awardedTo: '' });

  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const searchMatch = !filters.search ||
        q.supplierName.toLowerCase().includes(filters.search.toLowerCase()) ||
        q.supplierPO.toLowerCase().includes(filters.search.toLowerCase()) ||
        q.remarks.toLowerCase().includes(filters.search.toLowerCase()) ||
        q.origin.toLowerCase().includes(filters.search.toLowerCase()) ||
        q.destination.toLowerCase().includes(filters.search.toLowerCase());

      const entityMatch = !filters.entity || q.entity === filters.entity;

      const statusMatch = !filters.awardedTo || q.status === filters.awardedTo;

      return searchMatch && entityMatch && statusMatch;
    });
  }, [quotations, filters]);

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

  const handleSave = (data: QuotationInput & { percentage: number }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { percentage: _pct, ...input } = data;
    if (editingQuotation) {
      updateQuotation(editingQuotation.id, input);
    } else {
      addQuotation(input);
    }
    setShowForm(false);
    setEditingQuotation(null);
  };

  const handleEdit = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      deleteQuotation(id);
    }
  };

  const handleAward = (id: number, forwarder: string) => {
    updateQuotation(id, { awardedTo: forwarder });
  };

  const handleStatusChange = (id: number, status: string) => {
    updateQuotation(id, { status });
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
                <SearchFilter filters={filters} onFilterChange={setFilters} />
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
        </Routes>
      </main>

      {showForm && (
        <QuotationForm
          quotation={editingQuotation}
          forwarders={forwarders}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingQuotation(null); }}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
