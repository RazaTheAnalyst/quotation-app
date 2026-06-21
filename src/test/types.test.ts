import { describe, it, expect } from 'vitest';
import { FORWARDERS, ENTITIES, MODES, INCOTERMS } from '../types';

describe('Types constants', () => {
  it('has correct forwarders', () => {
    expect(FORWARDERS).toEqual(['BDP', 'ECU', 'Expeditors']);
  });

  it('has correct entities', () => {
    expect(ENTITIES).toEqual(['UAE', 'Qatar', 'Oman', 'KSA']);
  });

  it('has correct modes', () => {
    expect(MODES).toEqual(['SEA FCL', 'SEA LCL', 'Air', 'Road']);
  });

  it('has correct incoterms', () => {
    expect(INCOTERMS).toEqual(['Exworks', 'FOB', 'CIF', 'DDP']);
  });
});
