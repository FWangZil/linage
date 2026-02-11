import { describe, expect, it } from 'vitest';
import { ensureSufficientInputBalance, formatForDisplay } from './swapPrecheck';

describe('swapPrecheck', () => {
  it('formats SUI amount in human-readable units', () => {
    expect(formatForDisplay('0x2::sui::SUI', 100000000n)).toBe('0.1 SUI');
    expect(formatForDisplay('0x2::sui::SUI', 1200000000n)).toBe('1.2 SUI');
  });

  it('throws a friendly error when balance is insufficient', () => {
    expect(() => ensureSufficientInputBalance('0x2::sui::SUI', 90000000n, 100000000n)).toThrow(
      'Insufficient balance for 0x2::sui::SUI. Required: 0.1 SUI, available: 0.09 SUI.',
    );
  });
});
