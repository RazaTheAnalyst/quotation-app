import { useState, useEffect, useCallback } from 'react';
import type { Quotation, QuotationInput, Forwarder } from './types';
import {
  fetchQuotations,
  createQuotation,
  updateQuotationAPI,
  deleteQuotationAPI,
  fetchForwarders,
  createForwarderAPI,
  deleteForwarderAPI,
} from './api';

export function useStore() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [forwarders, setForwarders] = useState<Forwarder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [qData, fData] = await Promise.all([
          fetchQuotations(),
          fetchForwarders(),
        ]);
        setQuotations(qData);
        setForwarders(fData);
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
    const saved = await updateQuotationAPI(id, updated);
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

  return {
    quotations,
    forwarders,
    addQuotation,
    updateQuotation,
    deleteQuotation,
    addForwarder,
    deleteForwarder,
    loading,
  };
}
