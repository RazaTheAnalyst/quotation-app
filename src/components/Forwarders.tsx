import { useState } from 'react';
import type { Forwarder } from '../types';

interface ForwardersProps {
  forwarders: Forwarder[];
  onAdd: (data: Omit<Forwarder, 'id'>) => void;
  onDelete: (id: number) => void;
}

export default function Forwarders({ forwarders, onAdd, onDelete }: ForwardersProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), contactPerson: contactPerson.trim(), email: email.trim(), phone: phone.trim() });
    setName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setShowForm(false);
  };

  return (
    <div className="forwarders-page">
      <div className="forwarders-header">
        <div>
          <h2>Forwarders</h2>
          <p className="forwarders-subtitle">Manage your logistics forwarder partners</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '\u274C Cancel' : '+ Add Forwarder'}
        </button>
      </div>

      {showForm && (
        <div className="forwarders-form-card">
          <form onSubmit={handleSubmit} className="forwarders-form">
            <div className="form-grid-4">
              <div className="form-group">
                <label htmlFor="fwd-name">{'\uD83C\uDFED'} Company Name *</label>
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
                <label htmlFor="fwd-contact">{'\uD83D\uDC64'} Contact Person</label>
                <input
                  id="fwd-contact"
                  type="text"
                  placeholder="e.g. John Smith"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="fwd-email">{'\uD83D\uDCE7'} Email</label>
                <input
                  id="fwd-email"
                  type="email"
                  placeholder="e.g. john@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="fwd-phone">{'\uD83D\uDCDE'} Phone</label>
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
              <button type="submit" className="btn btn-primary">{'\u2795'} Add Forwarder</button>
            </div>
          </form>
        </div>
      )}

      <div className="forwarders-table-container">
        {forwarders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{'\uD83D\uDE9B'}</div>
            <div className="empty-state-text">No forwarders yet. Add your first forwarder to get started.</div>
          </div>
        ) : (
          <table className="forwarders-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {forwarders.map((f, i) => (
                <tr key={f.id} className="animate-row" style={{ animationDelay: `${i * 0.03}s` }}>
                  <td className="td-name">{f.name}</td>
                  <td>{f.contactPerson || '\u2014'}</td>
                  <td className="td-mono">{f.email || '\u2014'}</td>
                  <td className="td-mono">{f.phone || '\u2014'}</td>
                  <td>
                    <button
                      className="btn-icon btn-delete-icon"
                      title="Delete"
                      onClick={() => onDelete(f.id)}
                    >
                      {'\uD83D\uDDD1\uFE0F'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="forwarders-mobile-cards mobile-only">
        {forwarders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{'\uD83D\uDE9B'}</div>
            <div className="empty-state-text">No forwarders yet.</div>
          </div>
        ) : (
          forwarders.map((f, i) => (
            <div key={f.id} className="forwarder-card animate-row" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="forwarder-card-header">
                <span className="forwarder-card-name">{f.name}</span>
                <button className="btn-icon btn-delete-icon" title="Delete" onClick={() => onDelete(f.id)}>
                  {'\uD83D\uDDD1\uFE0F'}
                </button>
              </div>
              {f.contactPerson && <div className="forwarder-card-detail">{'\uD83D\uDC64'} {f.contactPerson}</div>}
              {f.email && <div className="forwarder-card-detail">{'\uD83D\uDCE7'} {f.email}</div>}
              {f.phone && <div className="forwarder-card-detail">{'\uD83D\uDCDE'} {f.phone}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
