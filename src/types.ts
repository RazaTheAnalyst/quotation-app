export interface Quote {
  forwarder: string;
  quotedAmount: number;
}

export interface Forwarder {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
}

export interface Quotation {
  id: number;
  entity: string;
  supplierName: string;
  supplierPO: string;
  poValue: number;
  origin: string;
  destination: string;
  mode: string;
  size: string;
  transitTime: string;
  incoterms: string;
  quotes: Quote[];
  awardedTo: string;
  remarks: string;
  percentage: number;
}

export type QuotationInput = Omit<Quotation, 'id' | 'percentage'>;

export interface Filters {
  search: string;
  entity: string;
  awardedTo: string;
}

export const FORWARDERS = ['BDP', 'ECU', 'Expeditors'] as const;

export const ENTITIES = ['UAE', 'Qatar'] as const;

export const MODES = ['SEA FCL', 'SEA LCL', 'Air', 'Road'] as const;

export const INCOTERMS = ['Exworks', 'FOB', 'CIF', 'DDP'] as const;
