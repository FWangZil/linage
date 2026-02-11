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
});
