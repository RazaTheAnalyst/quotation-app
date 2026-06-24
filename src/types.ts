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
  etd: string;
  eta: string;
  status: string;
  savings: number;
}

export type QuotationInput = Omit<Quotation, 'id' | 'percentage'>;

export interface Filters {
  search: string;
  entity: string;
  status: string;
}

export const ENTITIES = ['UAE', 'Qatar', 'Oman', 'KSA'] as const;

export const STATUS_LIST = [
  'Pending',
  'Sent for quotation',
  'Assign to forwarder',
  'In Transit',
  'Arrived Awaiting clearence',
  'Under Clearence',
  'Delivered',
] as const;

export type StatusType = typeof STATUS_LIST[number];
