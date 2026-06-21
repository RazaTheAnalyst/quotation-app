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
}

export type QuotationInput = Omit<Quotation, 'id' | 'percentage'>;

export interface Filters {
  search: string;
  entity: string;
  awardedTo: string;
}

export const FORWARDERS = ['BDP', 'ECU', 'Expeditors'] as const;

export const ENTITIES = ['UAE', 'Qatar', 'Oman', 'KSA'] as const;

export const MODES = ['SEA FCL', 'SEA LCL', 'Air', 'Road'] as const;

export const INCOTERMS = ['Exworks', 'FOB', 'CIF', 'DDP'] as const;

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

export interface ClientPO {
  id: number;
  customerName: string;
  customerPO: string;
  customerPOAmount: number;
  customerPOCurrency: string;
  poAmountAED: number;
  supplierPO: string;
  supplierName: string;
  orderNo: string;
  status: string;
  remarks: string;
}

export type ClientPOInput = Omit<ClientPO, 'id'>;

export const CURRENCIES = [
  { code: 'AED', name: 'UAE Dirham', rate: 1 },
  { code: 'USD', name: 'US Dollar', rate: 3.6725 },
  { code: 'EUR', name: 'Euro', rate: 4.015 },
  { code: 'GBP', name: 'British Pound', rate: 4.672 },
  { code: 'SAR', name: 'Saudi Riyal', rate: 0.9793 },
  { code: 'QAR', name: 'Qatari Riyal', rate: 1.009 },
  { code: 'OMR', name: 'Omani Rial', rate: 9.543 },
  { code: 'KWD', name: 'Kuwaiti Dinar', rate: 12.034 },
  { code: 'INR', name: 'Indian Rupee', rate: 0.04398 },
  { code: 'PKR', name: 'Pakistani Rupee', rate: 0.01314 },
  { code: 'CNY', name: 'Chinese Yuan', rate: 0.5055 },
  { code: 'JPY', name: 'Japanese Yen', rate: 0.02463 },
  { code: 'CAD', name: 'Canadian Dollar', rate: 2.698 },
  { code: 'AUD', name: 'Australian Dollar', rate: 2.426 },
  { code: 'CHF', name: 'Swiss Franc', rate: 4.312 },
  { code: 'SGD', name: 'Singapore Dollar', rate: 2.775 },
  { code: 'HKD', name: 'Hong Kong Dollar', rate: 0.4708 },
  { code: 'MYR', name: 'Malaysian Ringgit', rate: 0.841 },
  { code: 'THB', name: 'Thai Baht', rate: 0.1112 },
  { code: 'PHP', name: 'Philippine Peso', rate: 0.0655 },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]['code'];

export function convertToAED(amount: number, currency: string): number {
  const c = CURRENCIES.find(cur => cur.code === currency);
  if (!c) return amount;
  return Math.round(amount * c.rate * 100) / 100;
}

export const CLIENT_PO_STATUSES = [
  'PO Received',
  'Order Placed to Supplier',
  'Order Ready Pick Up Scheduled',
  'In Transit',
  'Delivered',
] as const;

export type ClientPOStatus = typeof CLIENT_PO_STATUSES[number];

export interface ClientPOFilters {
  search: string;
  status: string;
}
