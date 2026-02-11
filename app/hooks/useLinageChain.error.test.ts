import { describe, expect, it } from 'vitest';
import { formatLinageChainError } from './useLinageChain';

describe('formatLinageChainError', () => {
  it('maps buy_listing_internal abort(4) into friendly payment hint', () => {
    const err = new Error(
      'MoveAbort(MoveLocation { module: ModuleId { address: x, name: Identifier("market") }, function: 9, instruction: 38, function_name: Some("buy_listing_internal") }, 4) in command 1',
    );

    expect(formatLinageChainError(err)).toBe(
      'Payment amount is below listing price. Please increase amount and try again.',
    );
  });

  it('keeps regular error messages unchanged', () => {
    expect(formatLinageChainError(new Error('Cetus aggregator returned no route.'))).toBe(
      'Cetus aggregator returned no route.',
    );
  });

  it('maps admin assert_usdc_token abort(7) to config mismatch hint', () => {
    const err = new Error(
      'Dry run failed: MoveAbort(MoveLocation { module: ModuleId { address: x, name: Identifier("admin") }, function: 10, instruction: 18, function_name: Some("assert_usdc_token") }, 7) in command 1',
    );

    expect(formatLinageChainError(err)).toBe(
      'Settlement coin configuration mismatch between frontend and on-chain PlatformConfig. Check VITE_LINAGE_USDC_COIN_TYPE or re-register USDC type on-chain.',
    );
  });

  it('maps Cetus router 1007 to a route/liquidity hint', () => {
    expect(
      formatLinageChainError(
        new Error('Cetus router error 1007: Not found route: liquidity is not enough, path_graph id is none.'),
      ),
    ).toBe('No Cetus route for this pair/amount right now. Try a larger amount or pay with the settlement coin directly.');
  });
});
