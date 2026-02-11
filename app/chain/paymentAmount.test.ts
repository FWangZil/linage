import { describe, expect, it } from 'vitest';
import { parseDisplayAmountToMinorUnits } from './paymentAmount';

describe('parseDisplayAmountToMinorUnits', () => {
  it('parses decimal display amount into minor units', () => {
    expect(parseDisplayAmountToMinorUnits('1.25', 6)).toBe(1250000n);
    expect(parseDisplayAmountToMinorUnits('0.5', 9)).toBe(500000000n);
  });

  it('throws on too many decimal places', () => {
    expect(() => parseDisplayAmountToMinorUnits('0.1234567', 6)).toThrow(
      'Amount supports at most 6 decimal places.',
    );
  });
});
