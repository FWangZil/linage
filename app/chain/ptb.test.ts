import { describe, expect, it } from 'vitest';
import { shouldBypassAggregatorSwap } from './ptb';

describe('shouldBypassAggregatorSwap', () => {
  it('returns true for same coin type', () => {
    expect(shouldBypassAggregatorSwap('0x2::sui::SUI', '0x2::sui::SUI')).toBe(true);
  });

  it('normalizes case before comparing', () => {
    expect(shouldBypassAggregatorSwap('0x2::sui::SUI', '0x2::SUI::sui')).toBe(true);
  });

  it('returns false for different coin type', () => {
    expect(shouldBypassAggregatorSwap('0x2::sui::SUI', '0x5d4b...::coin::COIN')).toBe(false);
  });
});
