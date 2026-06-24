import { useState } from 'react';
import type { Forwarder } from '../types';

interface ForwardersProps {
  forwarders: Forwarder[];
  onAdd: (data: Omit<Forwarder, 'id'>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function Forwarders({ forwarders, onAdd, onDelete }: ForwardersProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const duplicate = forwarders.some(f => f.name.toLowerCase() === name.trim().toLowerCase());
    if (duplicate) {
      window.confirm(`A forwarder named "${name.trim()}" already exists.`);
      return;
    }
    setSubmitting(true);
    try {
      await onAdd({ name: name.trim(), contactPerson: contactPerson.trim(), email: email.trim(), phone: phone.trim() });
      setName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setShowForm(false);
    } catch (err) {
      console.error('Failed to add forwarder:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="forwarders-page">
      <div className="forwarders-hero">
        <div className="forwarders-hero-content">
          <h2>{'\uD83D\uDE9B'} Forwarders</h2>
          <p>Manage your logistics forwarder partners</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '\u274C Cancel' : '+ Add Forwarder'}
        </button>
      </div>

      {showForm && (
        <div className="forwarders-form-card">
          <div className="forwarders-form-header">
            <span>{'\u2795'} New Forwarder</span>
          </div>
          <form onSubmit={handleSubmit} className="forwarders-form">
            <div className="forwarders-form-grid">
              <div className="form-group">
                <label htmlFor="fwd-name">Company Name *</label>
                <input
                  id="fwd-name"
                  type="text"
                  placeholder="e.g. DHL, Agility"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="fwd-contact">Contact Person</label>
                <input
                  id="fwd-contact"
                  type="text"
                  placeholder="e.g. John Smith"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="fwd-email">Email</label>
                <input
                  id="fwd-email"
                  type="email"
                  placeholder="e.g. john@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="fwd-phone">Phone</label>
                <input
                  id="fwd-phone"
                  type="text"
                  placeholder="e.g. +971 50 123 4567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="forwarders-form-actions">
              <button type="button" className="btn btn-cancel-sm" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Adding...' : 'Add Forwarder'}</button>
            </div>
          </form>
        </div>
      )}

      {forwarders.length === 0 ? (
        <div className="forwarders-empty">
          <div className="forwarders-empty-icon">{'\uD83D\uDE9B'}</div>
          <h3>No forwarders yet</h3>
          <p>Add your first forwarder to get started.</p>
        </div>
      ) : (
        <div className="forwarders-grid">
          {forwarders.map((f, i) => (
            <div key={f.id} className="fwd-card animate-row" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="fwd-card-top">
                <div className="fwd-card-avatar">{f.name.charAt(0)}</div>
                <div className="fwd-card-info">
                  <h3 className="fwd-card-name">{f.name}</h3>
                  {f.contactPerson && <p className="fwd-card-contact">{f.contactPerson}</p>}
                </div>
                <button
                  className="fwd-card-delete"
                  title="Delete forwarder"
                  onClick={async () => {
                    if (window.confirm(`Delete "${f.name}"?`)) {
                      try {
                        await onDelete(f.id);
                      } catch (err) {
                        console.error('Delete failed:', err);
                      }
                    }
                  }}
                >
                  {'\u2715'}
                </button>
              </div>

              <div className="fwd-card-details">
                {f.email && (
                  <div className="fwd-card-detail">
                    <span className="fwd-detail-icon">{'\uD83D\uDCE7'}</span>
                    <span className="fwd-detail-text">{f.email}</span>
                  </div>
                )}
                {f.phone && (
                  <div className="fwd-card-detail">
                    <span className="fwd-detail-icon">{'\uD83D\uDCDE'}</span>
                    <span className="fwd-detail-text">{f.phone}</span>
                  </div>
                )}
                {!f.email && !f.phone && (
                  <div className="fwd-card-detail fwd-card-detail-empty">
                    No contact details
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="forwarders-summary">
        {forwarders.length} forwarder{forwarders.length !== 1 ? 's' : ''} registered
      </div>
    </div>
  );
}
