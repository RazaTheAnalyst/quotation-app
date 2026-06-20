import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuotationTable from '../components/QuotationTable';
import type { Quotation } from '../types';

const mockQuotations: Quotation[] = [
  {
    id: 1,
    entity: 'UAE',
    supplierName: 'Test Supplier',
    supplierPO: 'P001',
    poValue: 100000,
    origin: 'Dubai',
    destination: 'Abu Dhabi',
    mode: 'Road',
    size: '1 Truck',
    transitTime: '2 days',
    incoterms: 'FOB',
    quotes: [{ forwarder: 'BDP', quotedAmount: 15000 }],
    awardedTo: 'BDP',
    remarks: 'Test remark',
    percentage: 15,
  },
];

const pendingQuotation: Quotation = {
  id: 2,
  entity: 'UAE',
  supplierName: 'Test Supplier',
  supplierPO: 'P001',
  poValue: 100000,
  origin: 'Dubai',
  destination: 'Abu Dhabi',
  mode: 'Road',
  size: '1 Truck',
  transitTime: '2 days',
  incoterms: 'FOB',
  quotes: [{ forwarder: 'BDP', quotedAmount: 15000 }],
  awardedTo: '',
  remarks: 'Test remark',
  percentage: 15,
};

describe('QuotationTable', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnAward = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table headers', () => {
    render(
      <QuotationTable
        quotations={mockQuotations}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAward={mockOnAward}
      />
    );
    expect(screen.getByText('Entity')).toBeInTheDocument();
    expect(screen.getByText('Supplier')).toBeInTheDocument();
    expect(screen.getByText('PO Value')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders quotation data in desktop table', () => {
    render(
      <QuotationTable
        quotations={mockQuotations}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAward={mockOnAward}
      />
    );
    const desktopTable = document.querySelector('.table-container.desktop-only');
    expect(desktopTable).toBeTruthy();
    expect(screen.getAllByText('Test Supplier').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('P001').length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no quotations', () => {
    render(
      <QuotationTable
        quotations={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAward={mockOnAward}
      />
    );
    expect(screen.getAllByText('No quotations found').length).toBe(2);
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <QuotationTable
        quotations={mockQuotations}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAward={mockOnAward}
      />
    );
    const editButton = screen.getAllByTitle('Edit')[0]!;
    await user.click(editButton);
    expect(mockOnEdit).toHaveBeenCalledWith(mockQuotations[0]);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <QuotationTable
        quotations={mockQuotations}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAward={mockOnAward}
      />
    );
    const deleteButton = screen.getAllByTitle('Delete')[0]!;
    await user.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledWith(1);
  });

  it('shows awarded badge for awarded quotations', () => {
    render(
      <QuotationTable
        quotations={mockQuotations}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAward={mockOnAward}
      />
    );
    expect(screen.getAllByText('BDP').length).toBeGreaterThanOrEqual(1);
  });

  it('shows pending badge for non-awarded quotations', () => {
    render(
      <QuotationTable
        quotations={[pendingQuotation]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAward={mockOnAward}
      />
    );
    expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(1);
  });
});
