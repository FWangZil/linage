import { describe, expect, it } from 'vitest';
import { selectCoinsForPayment, shouldBypassAggregatorSwap } from './ptb';

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

  it('treats short and zero-padded addresses as the same coin type', () => {
    expect(
      shouldBypassAggregatorSwap(
        '0x2::sui::SUI',
        '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
      ),
    ).toBe(true);
  });
});

describe('selectCoinsForPayment', () => {
  it('picks one coin when a single coin can cover required amount', () => {
    const selected = selectCoinsForPayment(
      [
        { coinAddress: '0x2::sui::SUI', coinObjectId: '0x1', balance: 300n },
        { coinAddress: '0x2::sui::SUI', coinObjectId: '0x2', balance: 700n },
      ],
      500n,
    );

    expect(selected).toHaveLength(1);
    expect(selected[0].coinObjectId).toBe('0x2');
  });

  it('picks the fewest coins needed by using larger balances first', () => {
    const selected = selectCoinsForPayment(
      [
        { coinAddress: '0x2::sui::SUI', coinObjectId: '0x1', balance: 300n },
        { coinAddress: '0x2::sui::SUI', coinObjectId: '0x2', balance: 300n },
        { coinAddress: '0x2::sui::SUI', coinObjectId: '0x3', balance: 300n },
      ],
      600n,
    );

    expect(selected.map((coin) => coin.coinObjectId)).toEqual(['0x1', '0x2']);
  });

  it('skips zero-balance coins', () => {
    const selected = selectCoinsForPayment(
      [
        { coinAddress: '0xaaa::usdc::USDC', coinObjectId: '0x0', balance: 0n },
        { coinAddress: '0xaaa::usdc::USDC', coinObjectId: '0x1', balance: 100000n },
      ],
      100000n,
    );

    expect(selected).toHaveLength(1);
    expect(selected[0].coinObjectId).toBe('0x1');
  });
});
