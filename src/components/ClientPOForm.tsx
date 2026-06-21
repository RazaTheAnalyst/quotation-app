import { useEffect, useState } from 'react';
import { CLIENT_PO_STATUSES } from '../types';
import type { ClientPO, ClientPOInput } from '../types';

interface ClientPOFormProps {
  clientPO?: ClientPO | null;
  onSave: (data: ClientPOInput) => void;
  onClose: () => void;
}

export default function ClientPOForm({ clientPO, onSave, onClose }: ClientPOFormProps) {
  const [form, setForm] = useState<ClientPOInput>({
    customerName: '',
    customerPO: '',
    customerPOAmount: 0,
    poAmountAED: 0,
    supplierPO: '',
    supplierName: '',
    orderNo: '',
    status: 'PO Received',
    remarks: '',
  });

  useEffect(() => {
    if (clientPO) {
      setForm({
        customerName: clientPO.customerName,
        customerPO: clientPO.customerPO,
        customerPOAmount: clientPO.customerPOAmount,
        poAmountAED: clientPO.poAmountAED,
        supplierPO: clientPO.supplierPO,
        supplierName: clientPO.supplierName,
        orderNo: clientPO.orderNo,
        status: clientPO.status,
        remarks: clientPO.remarks,
      });
    }
  }, [clientPO]);

  const handleChange = (field: keyof ClientPOInput, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerPO.trim()) return;
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-icon">{'\uD83D\uDCCB'}</span>
            <h2>{clientPO ? 'Edit Client PO' : 'New Client PO'}</h2>
          </div>
          <button className="btn-close" onClick={onClose}>{'\u2715'}</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-section-header">
              <span className="section-icon">{'\uD83D\uDC64'}</span>
              Customer Details
            </div>
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label htmlFor="cpo-customer">Customer Name *</label>
                <input
                  id="cpo-customer"
                  type="text"
                  placeholder="e.g. Atlas Telecommunications"
                  value={form.customerName}
                  onChange={e => handleChange('customerName', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="cpo-po">Customer PO *</label>
                <input
                  id="cpo-po"
                  type="text"
                  placeholder="e.g. 4500042990"
                  value={form.customerPO}
                  onChange={e => handleChange('customerPO', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="cpo-cust-amt">Customer PO Amount</label>
                <input
                  id="cpo-cust-amt"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.customerPOAmount || ''}
                  onChange={e => handleChange('customerPOAmount', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-header">
              <span className="section-icon">{'\uD83D\uDCB0'}</span>
              PO Value
            </div>
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label htmlFor="cpo-aed">PO Amount AED</label>
                <input
                  id="cpo-aed"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.poAmountAED || ''}
                  onChange={e => handleChange('poAmountAED', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="cpo-order">Order No</label>
                <input
                  id="cpo-order"
                  type="text"
                  placeholder="e.g. 0768"
                  value={form.orderNo}
                  onChange={e => handleChange('orderNo', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="cpo-status">Status</label>
                <select
                  id="cpo-status"
                  value={form.status}
                  onChange={e => handleChange('status', e.target.value)}
                >
                  {CLIENT_PO_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-header">
              <span className="section-icon">{'\uD83D\uDCE6'}</span>
              Supplier Details
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label htmlFor="cpo-supplier">Supplier Name</label>
                <input
                  id="cpo-supplier"
                  type="text"
                  placeholder="e.g. Rittal, CommScope"
                  value={form.supplierName}
                  onChange={e => handleChange('supplierName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="cpo-sup-po">Supplier PO</label>
                <input
                  id="cpo-sup-po"
                  type="text"
                  placeholder="e.g. P228024"
                  value={form.supplierPO}
                  onChange={e => handleChange('supplierPO', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-header">
              <span className="section-icon">{'\uD83D\uDCCB'}</span>
              Remarks
            </div>
            <div className="form-group">
              <label htmlFor="cpo-remarks">Remarks</label>
              <input
                id="cpo-remarks"
                type="text"
                placeholder="e.g. Partially Delivered & Invoiced"
                value={form.remarks}
                onChange={e => handleChange('remarks', e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-submit">
              {clientPO ? 'Update Client PO' : 'Add Client PO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
