import { ENTITIES, STATUS_LIST } from '../types';
import type { Filters } from '../types';

interface SearchFilterProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  resultCount?: number;
  totalCount?: number;
}

export default function SearchFilter({ filters, onFilterChange, resultCount, totalCount }: SearchFilterProps) {
  const handleChange = (key: keyof Filters, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = filters.search || filters.entity || filters.status;

  return (
    <div className="search-filter">
      <div className="search-input-wrapper">
        <span className="search-input-icon">{'\uD83D\uDD0D'}</span>
        <input
          type="text"
          placeholder="Search supplier, PO, forwarder, mode, origin..."
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
        />
        {filters.search && (
          <button className="search-input-clear" onClick={() => handleChange('search', '')} title="Clear search">
            {'\u2715'}
          </button>
        )}
      </div>
      <select value={filters.entity} onChange={(e) => handleChange('entity', e.target.value)}>
        <option value="">All Entities</option>
        {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
      </select>
      <select value={filters.status} onChange={(e) => handleChange('status', e.target.value)}>
        <option value="">All Status</option>
        {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      {hasActiveFilters && resultCount !== undefined && totalCount !== undefined && (
        <span className="search-result-count">
          {resultCount === totalCount ? `${totalCount} total` : `${resultCount} of ${totalCount} found`}
        </span>
      )}
    </div>
  );
}
