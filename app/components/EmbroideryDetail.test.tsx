import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import EmbroideryDetail from './EmbroideryDetail';

describe('EmbroideryDetail', () => {
  it('passes selected payment asset and parsed amount to buy callback', async () => {
    const onBuyEmbroidery = vi.fn().mockResolvedValue(undefined);
    render(
      <EmbroideryDetail
        paymentAssets={[
          { label: 'SUI', coinType: '0x2::sui::SUI', decimals: 9 },
          { label: 'USDC', coinType: '0xaaa::usdc::USDC', decimals: 6 },
        ]}
        onBuyEmbroidery={onBuyEmbroidery}
      />,
    );

    const assetSelect = screen.getByTestId('payment-asset-select');
    const amountInput = screen.getByTestId('payment-amount-input');

    await userEvent.selectOptions(assetSelect, '0xaaa::usdc::USDC');
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '1.25');
    await userEvent.click(screen.getByTestId('embroidery-buy-button'));

    expect(onBuyEmbroidery).toHaveBeenCalledTimes(1);
    expect(onBuyEmbroidery).toHaveBeenCalledWith({
      inputCoinType: '0xaaa::usdc::USDC',
      inputAmount: 1250000n,
    });
  });
});
