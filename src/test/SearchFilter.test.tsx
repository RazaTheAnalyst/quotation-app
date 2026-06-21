import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchFilter from '../components/SearchFilter';
import type { Filters } from '../types';

describe('SearchFilter', () => {
  const mockOnChange = vi.fn();
  const defaultFilters: Filters = { search: '', entity: '', awardedTo: '' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input', () => {
    render(<SearchFilter filters={defaultFilters} onFilterChange={mockOnChange} />);
    expect(screen.getByPlaceholderText(/\u{1F50D}.*Search supplier, PO, remarks\.\.\./u)).toBeInTheDocument();
  });

  it('renders entity dropdown with options', () => {
    render(<SearchFilter filters={defaultFilters} onFilterChange={mockOnChange} />);
    const select = screen.getAllByRole('combobox')[0];
    expect(select).toBeInTheDocument();
    expect(screen.getByText('All Entities')).toBeInTheDocument();
    expect(screen.getByText('UAE')).toBeInTheDocument();
    expect(screen.getByText('Qatar')).toBeInTheDocument();
  });

  it('renders status dropdown with options', () => {
    render(<SearchFilter filters={defaultFilters} onFilterChange={mockOnChange} />);
    expect(screen.getByText('All Status')).toBeInTheDocument();
    expect(screen.getByText('Sent for quotation')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
  });

  it('calls onFilterChange when search input changes', async () => {
    const user = userEvent.setup();
    render(<SearchFilter filters={defaultFilters} onFilterChange={mockOnChange} />);
    await user.type(screen.getByPlaceholderText(/\u{1F50D}.*Search supplier, PO, remarks\.\.\./u), 'test');
    expect(mockOnChange).toHaveBeenCalled();
  });
});
