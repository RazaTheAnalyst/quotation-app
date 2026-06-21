import { ENTITIES, STATUS_LIST } from '../types';
import type { Filters } from '../types';

interface SearchFilterProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

export default function SearchFilter({ filters, onFilterChange }: SearchFilterProps) {
  const handleChange = (key: keyof Filters, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="search-filter">
      <input
        type="text"
        placeholder="&#x1F50D;  Search supplier, PO, remarks..."
        value={filters.search}
        onChange={(e) => handleChange('search', e.target.value)}
      />
      <select value={filters.entity} onChange={(e) => handleChange('entity', e.target.value)}>
        <option value="">All Entities</option>
        {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
      </select>
      <select value={filters.awardedTo} onChange={(e) => handleChange('awardedTo', e.target.value)}>
        <option value="">All Status</option>
        {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}
