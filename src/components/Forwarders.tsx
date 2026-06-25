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
    <div className="flex flex-col gap-5">
      {/* Hero Banner */}
      <div className="relative flex justify-between items-center rounded-[var(--radius-xl)] px-8 py-7 text-white overflow-hidden bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca]">
        <div className="absolute -top-1/2 -right-[10%] w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.2)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">{'\uD83D\uDE9B'} Forwarders</h2>
          <p className="text-sm text-[var(--text-secondary)]">Manage your logistics forwarder partners</p>
        </div>
        <button
          className="bg-[var(--add-btn-bg)] text-[var(--add-btn-text)] px-[18px] py-[9px] text-[13px] font-semibold rounded-lg min-h-[38px] cursor-pointer border-none transition-all duration-200 hover:bg-[var(--add-btn-hover-bg)]"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '\u274C Cancel' : '+ Add Forwarder'}
        </button>
      </div>

      {/* Add Forwarder Form */}
      {showForm && (
        <div className="bg-[var(--card-bg)] rounded-[var(--radius-lg)] border border-[var(--border-light)] shadow-[var(--card-shadow)] overflow-hidden animate-[slideUp_0.3s_ease]">
          <div className="px-6 py-4 bg-[var(--card-bg)] border-b border-[var(--border)] text-[15px] font-semibold text-[var(--text)]">
            <span>{'\u2795'} New Forwarder</span>
          </div>
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-4 gap-4 max-[1200px]:grid-cols-2 max-[900px]:grid-cols-1">
              <div className="form-group">
                <label htmlFor="fwd-name" className="block text-[12px] font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide">Company Name *</label>
                <input
                  id="fwd-name"
                  type="text"
                  placeholder="e.g. DHL, Agility"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)] text-[14px] font-[inherit] transition-all duration-200 focus:outline-none focus:border-[var(--primary)] focus:ring-3 focus:ring-[var(--primary-bg)] placeholder:text-[var(--text-muted)]"
                />
              </div>
              <div className="form-group">
                <label htmlFor="fwd-contact" className="block text-[12px] font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide">Contact Person</label>
                <input
                  id="fwd-contact"
                  type="text"
                  placeholder="e.g. John Smith"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)] text-[14px] font-[inherit] transition-all duration-200 focus:outline-none focus:border-[var(--primary)] focus:ring-3 focus:ring-[var(--primary-bg)] placeholder:text-[var(--text-muted)]"
                />
              </div>
              <div className="form-group">
                <label htmlFor="fwd-email" className="block text-[12px] font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide">Email</label>
                <input
                  id="fwd-email"
                  type="email"
                  placeholder="e.g. john@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)] text-[14px] font-[inherit] transition-all duration-200 focus:outline-none focus:border-[var(--primary)] focus:ring-3 focus:ring-[var(--primary-bg)] placeholder:text-[var(--text-muted)]"
                />
              </div>
              <div className="form-group">
                <label htmlFor="fwd-phone" className="block text-[12px] font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide">Phone</label>
                <input
                  id="fwd-phone"
                  type="text"
                  placeholder="e.g. +971 50 123 4567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)] text-[14px] font-[inherit] transition-all duration-200 focus:outline-none focus:border-[var(--primary)] focus:ring-3 focus:ring-[var(--primary-bg)] placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2.5 pt-4 border-t border-[var(--border-light)]">
              <button type="button" className="px-[18px] py-[9px] rounded-[var(--radius-sm)] text-[13px] font-semibold cursor-pointer border-[1.5px] border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--bg)] hover:text-[var(--text)]" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="bg-[var(--add-btn-bg)] text-[var(--add-btn-text)] px-[18px] py-[9px] text-[13px] font-semibold rounded-lg min-h-[38px] cursor-pointer border-none transition-all duration-200 hover:bg-[var(--add-btn-hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed" disabled={submitting}>{submitting ? 'Adding...' : 'Add Forwarder'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Forwarders Grid / Empty State */}
      {forwarders.length === 0 ? (
        <div className="bg-[var(--card-bg)] rounded-[var(--radius-lg)] border border-[var(--border-light)] shadow-[var(--card-shadow)] p-[60px_20px] text-center">
          <div className="text-[56px] mb-4">{'\uD83D\uDE9B'}</div>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">No forwarders yet</h3>
          <p className="text-sm text-[var(--text-muted)]">Add your first forwarder to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 max-[1200px]:grid-cols-2 max-[900px]:grid-cols-1 max-[600px]:grid-cols-1">
          {forwarders.map((f, i) => (
            <div
              key={f.id}
              className="animate-row bg-[var(--card-bg)] rounded-[var(--radius-lg)] border border-[var(--border-light)] shadow-[var(--card-shadow)] p-5 transition-[all_0.3s_cubic-bezier(0.4,0,0.2,1)] relative overflow-hidden hover:-translate-y-0.5 hover:shadow-[var(--card-shadow-hover)] max-[900px]:flex-col max-[900px]:items-start"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start gap-3.5 mb-4">
                <div className="w-12 h-12 min-w-[48px] rounded-[14px] bg-gradient-to-br from-[var(--primary)] to-[var(--cyan)] text-white text-xl font-bold flex items-center justify-center tracking-tight">
                  {f.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[17px] font-bold text-[var(--text)] tracking-tight mb-0.5">{f.name}</h3>
                  {f.contactPerson && <p className="text-[13px] text-[var(--text-secondary)]">{f.contactPerson}</p>}
                </div>
                <button
                  className="w-8 h-8 min-w-[32px] border-none bg-transparent text-[var(--text-muted)] text-base rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center hover:bg-[var(--danger-bg)] hover:text-[var(--danger)] hover:scale-110"
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

              <div className="flex flex-col gap-2 pt-3.5 border-t border-[var(--border-light)]">
                {f.email && (
                  <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
                    <span className="text-sm w-5 text-center">{'\uD83D\uDCE7'}</span>
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">{f.email}</span>
                  </div>
                )}
                {f.phone && (
                  <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
                    <span className="text-sm w-5 text-center">{'\uD83D\uDCDE'}</span>
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">{f.phone}</span>
                  </div>
                )}
                {!f.email && !f.phone && (
                  <div className="flex items-center gap-2 text-[13px] text-[var(--text-muted)] italic">
                    No contact details
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="text-center text-xs text-[var(--text-muted)] py-2">
        {forwarders.length} forwarder{forwarders.length !== 1 ? 's' : ''} registered
      </div>
    </div>
  );
}
