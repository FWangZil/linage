import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TeaDetail from './TeaDetail';

const paymentAssets = [
  { label: 'SUI', coinType: '0x2::sui::SUI', decimals: 9 },
  { label: 'USDC', coinType: '0xaaa::usdc::USDC', decimals: 6 },
];

function openFirstTeaRegion(container: HTMLElement) {
  const firstRegion = container.querySelector('svg g');
  if (!firstRegion) {
    throw new Error('Tea region marker not found');
  }
  fireEvent.click(firstRegion);
}

afterEach(() => {
  cleanup();
});

describe('TeaDetail', () => {
  it('uses selected payment input when buying a tea listing', async () => {
    const onBuyTea = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <TeaDetail
        collectedTeaIds={[]}
        onUpdateCollection={() => {}}
        paymentAssets={paymentAssets}
        onBuyTea={onBuyTea}
      />,
    );

    openFirstTeaRegion(container);
    await userEvent.selectOptions(screen.getByTestId('payment-asset-select'), '0xaaa::usdc::USDC');
    const amountInput = screen.getByTestId('payment-amount-input');
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '2');
    await userEvent.click(screen.getByTestId('tea-buy-button'));

    expect(onBuyTea).toHaveBeenCalledTimes(1);
    expect(onBuyTea).toHaveBeenCalledWith({
      regionId: 'bi-luo-chun',
      inputCoinType: '0xaaa::usdc::USDC',
      inputAmount: 2000000n,
    });
  });

  it('uses selected payment input when minting tea collectible', async () => {
    const onMintTea = vi.fn().mockResolvedValue(undefined);
    const onUpdateCollection = vi.fn();
    const { container } = render(
      <TeaDetail
        collectedTeaIds={[]}
        onUpdateCollection={onUpdateCollection}
        paymentAssets={paymentAssets}
        onMintTea={onMintTea}
      />,
    );

    openFirstTeaRegion(container);
    const amountInput = screen.getByTestId('payment-amount-input');
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '0.5');
    await userEvent.click(screen.getByTestId('tea-mint-button'));
    await userEvent.click(screen.getByTestId('tea-direct-mint-button'));

    expect(onMintTea).toHaveBeenCalledTimes(1);
    expect(onMintTea).toHaveBeenCalledWith({
      regionId: 'bi-luo-chun',
      tributeMessage: '',
      inputCoinType: '0x2::sui::SUI',
      inputAmount: 500000000n,
    });
    expect(onUpdateCollection).toHaveBeenCalledWith(['bi-luo-chun']);
  });
});
