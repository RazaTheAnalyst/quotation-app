import { useCallback } from 'react';
import { ENTITIES, STATUS_LIST } from '../types';
import type { Filters } from '../types';

interface SearchFilterProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  resultCount?: number;
  totalCount?: number;
}

export default function SearchFilter({ filters, onFilterChange, resultCount, totalCount }: SearchFilterProps) {
  const handleChange = useCallback((key: keyof Filters, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  }, [filters, onFilterChange]);

  const hasActiveFilters = filters.search || filters.entity || filters.status;

  const visibleStatuses = STATUS_LIST;

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
          🔍
        </span>
        <input
          type="text"
          placeholder="Search supplier, PO, forwarder, mode, origin..."
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
          className="w-full pl-10 pr-10 py-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-3 focus:ring-[var(--primary-bg)] transition-colors"
        />
        {filters.search && (
          <button
            onClick={() => handleChange('search', '')}
            title="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer transition-colors"
          >
            ✕
          </button>
        )}
      </div>
      <select
        value={filters.entity}
        onChange={(e) => handleChange('entity', e.target.value)}
        className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)] focus:ring-3 focus:ring-[var(--primary-bg)] transition-colors cursor-pointer"
      >
        <option value="">All Entities</option>
        {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
      </select>
      <select
        value={filters.status}
        onChange={(e) => handleChange('status', e.target.value)}
        className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)] focus:ring-3 focus:ring-[var(--primary-bg)] transition-colors cursor-pointer"
      >
        <option value="">All Status</option>
        {visibleStatuses.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      {hasActiveFilters && resultCount !== undefined && totalCount !== undefined && (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-[var(--primary-bg)] text-[var(--primary)]">
          {resultCount === totalCount ? `${totalCount} total` : `${resultCount} of ${totalCount} found`}
        </span>
      )}
    </div>
  );
}
