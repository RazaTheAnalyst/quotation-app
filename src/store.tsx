import { useState, useEffect, useCallback } from 'react';
import type { Quotation, QuotationInput, Forwarder, ClientPO, ClientPOInput } from './types';
import {
  fetchQuotations,
  createQuotation,
  updateQuotationAPI,
  deleteQuotationAPI,
  fetchForwarders,
  createForwarderAPI,
  deleteForwarderAPI,
  fetchClientPOs,
  createClientPO,
  updateClientPOAPI,
  deleteClientPOAPI,
} from './api';

export function useStore() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [forwarders, setForwarders] = useState<Forwarder[]>([]);
  const [clientPOs, setClientPOs] = useState<ClientPO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [qData, fData, cData] = await Promise.all([
          fetchQuotations(),
          fetchForwarders(),
          fetchClientPOs(),
        ]);
        setQuotations(qData);
        setForwarders(fData);
        setClientPOs(cData);
      } catch (err) {
        console.error('Failed to load from Supabase:', err);
      }
      setLoading(false);
    })();
  }, []);

  const addQuotation = useCallback(async (input: QuotationInput) => {
    const saved = await createQuotation(input);
    setQuotations(prev => [...prev, saved]);
  }, []);

  const updateQuotation = useCallback(async (id: number, updated: Partial<QuotationInput>) => {
    const percentage = calculatePercentage(updated as Partial<QuotationInput>);
    const saved = await updateQuotationAPI(id, { ...updated, percentage });
    setQuotations(prev => prev.map(q => q.id === id ? saved : q));
  }, []);

  const deleteQuotation = useCallback(async (id: number) => {
    await deleteQuotationAPI(id);
    setQuotations(prev => prev.filter(q => q.id !== id));
  }, []);

  const addForwarder = useCallback(async (data: Omit<Forwarder, 'id'>) => {
    const saved = await createForwarderAPI(data);
    setForwarders(prev => [...prev, saved]);
  }, []);

  const deleteForwarder = useCallback(async (id: number) => {
    await deleteForwarderAPI(id);
    setForwarders(prev => prev.filter(f => f.id !== id));
  }, []);

  const addClientPO = useCallback(async (input: ClientPOInput) => {
    const saved = await createClientPO(input);
    setClientPOs(prev => [...prev, saved]);
  }, []);

  const updateClientPO = useCallback(async (id: number, updated: Partial<ClientPOInput>) => {
    const saved = await updateClientPOAPI(id, updated);
    setClientPOs(prev => prev.map(c => c.id === id ? saved : c));
  }, []);

  const deleteClientPO = useCallback(async (id: number) => {
    await deleteClientPOAPI(id);
    setClientPOs(prev => prev.filter(c => c.id !== id));
  }, []);

  return {
    quotations,
    forwarders,
    clientPOs,
    addQuotation,
    updateQuotation,
    deleteQuotation,
    addForwarder,
    deleteForwarder,
    addClientPO,
    updateClientPO,
    deleteClientPO,
    loading,
  };
}

function calculatePercentage(data: Partial<QuotationInput>): number {
  const poValue = data.poValue ?? 0;
  if (poValue <= 0) return 0;
  const awardedQuote = data.quotes?.find(q => q.forwarder === data.awardedTo);
  const awardedAmount = awardedQuote?.quotedAmount ?? 0;
  return Math.round((awardedAmount / poValue) * 10000) / 100;
}
