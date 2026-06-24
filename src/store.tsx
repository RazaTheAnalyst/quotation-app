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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const [qData, fData] = await Promise.all([
          fetchQuotations(),
          fetchForwarders(),
        ]);
        if (!controller.signal.aborted) {
          setQuotations(qData);
          setForwarders(fData);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          const msg = err instanceof Error ? err.message : 'Failed to load data';
          setError(msg);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();
    return () => controller.abort();
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
    error,
  };
}
