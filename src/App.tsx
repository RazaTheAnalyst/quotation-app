import { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useStore } from './store';
import type { Quotation, QuotationInput, Filters } from './types';
import Dashboard from './components/Dashboard';
import QuotationTable from './components/QuotationTable';
import QuotationForm from './components/QuotationForm';
import SearchFilter from './components/SearchFilter';
import Forwarders from './components/Forwarders';
import './App.css';

function AppContent() {
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

      let statusMatch = true;
      if (filters.awardedTo === 'awarded') statusMatch = !!q.awardedTo;
      else if (filters.awardedTo === 'pending') statusMatch = !q.awardedTo;
      else if (filters.awardedTo) statusMatch = q.awardedTo === filters.awardedTo;

      return searchMatch && entityMatch && statusMatch;
    });
  }, [quotations, filters]);

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
        <h1>Quotation Manager</h1>
        <nav className="header-actions">
          <NavLink to="/" end className={({ isActive }) => `btn btn-tab ${isActive ? 'active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/quotations" className={({ isActive }) => `btn btn-tab ${isActive ? 'active' : ''}`}>
            Quotations
          </NavLink>
          <NavLink to="/forwarders" className={({ isActive }) => `btn btn-tab ${isActive ? 'active' : ''}`}>
            Forwarders
          </NavLink>
          <button className="btn btn-primary" onClick={handleAdd}>
            + Add Quotation
          </button>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard quotations={quotations} />} />
          <Route
            path="/quotations"
            element={
              <>
                <SearchFilter filters={filters} onFilterChange={setFilters} />
                <QuotationTable
                  quotations={filteredQuotations}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAward={handleAward}
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
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
