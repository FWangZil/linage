import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CuratedPuzzle, { buildInitialCraftGrid } from './CuratedPuzzle';

describe('buildInitialCraftGrid', () => {
  it('creates a mixed craft grid with requested size', () => {
    const fragments = buildInitialCraftGrid(9, () => 0.25);

    expect(fragments).toHaveLength(9);
    expect(new Set(fragments).size).toBeGreaterThan(1);
  });
});

describe('CuratedPuzzle', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('reveals craft details and mint action when puzzle is unified', async () => {
    render(
      <CuratedPuzzle
        initialCraftIds={[
          'suzhou',
          'suzhou',
          'suzhou',
          'suzhou',
          'qiang',
          'suzhou',
          'suzhou',
          'suzhou',
          'suzhou',
        ]}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '羌绣' }));

    expect(screen.getByText('Masterpiece Revealed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mint Your Legacy' })).toBeInTheDocument();
  });

  it('emits mint seal events and transitions to minted state', () => {
    vi.useFakeTimers();
    const onMintSuccess = vi.fn();
    const mintStartSpy = vi.fn();
    const mintEndSpy = vi.fn();

    window.addEventListener('linage-mint-start', mintStartSpy);
    window.addEventListener('linage-mint-end', mintEndSpy);

    render(
      <CuratedPuzzle
        onMintSuccess={onMintSuccess}
        initialCraftIds={[
          'shu',
          'shu',
          'shu',
          'shu',
          'shu',
          'shu',
          'shu',
          'shu',
          'shu',
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mint Your Legacy' }));
    expect(mintStartSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Inscribing on Chain...')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(onMintSuccess).toHaveBeenCalledTimes(1);
    expect(mintEndSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Request Physical / 实物 申领' })).toBeInTheDocument();

    window.removeEventListener('linage-mint-start', mintStartSpy);
    window.removeEventListener('linage-mint-end', mintEndSpy);
  });

  it('keeps trade and swap entry buttons accessible', async () => {
    const onOpenEmbroidery = vi.fn();
    const onOpenTea = vi.fn();

    render(
      <CuratedPuzzle
        onOpenEmbroidery={onOpenEmbroidery}
        onOpenTea={onOpenTea}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Embroidery Trade' }));
    await userEvent.click(screen.getByRole('button', { name: 'Tea Swap' }));

    expect(onOpenEmbroidery).toHaveBeenCalledTimes(1);
    expect(onOpenTea).toHaveBeenCalledTimes(1);
  });

  it('uses existing payment module to submit real checkout params in order flow', () => {
    vi.useFakeTimers();
    const onBuyEmbroidery = vi.fn().mockResolvedValue(undefined);

    render(
      <CuratedPuzzle
        initialCraftIds={[
          'suzhou',
          'suzhou',
          'suzhou',
          'suzhou',
          'suzhou',
          'suzhou',
          'suzhou',
          'suzhou',
          'suzhou',
        ]}
        paymentAssets={[
          { label: 'SUI', coinType: '0x2::sui::SUI', decimals: 9 },
          { label: 'USDC', coinType: '0xaaa::usdc::USDC', decimals: 6 },
        ]}
        onBuyEmbroidery={onBuyEmbroidery}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mint Your Legacy' }));
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Request Physical / 实物 申领' }));

    fireEvent.change(screen.getByTestId('payment-asset-select'), {
      target: { value: '0xaaa::usdc::USDC' },
    });
    fireEvent.change(screen.getByTestId('payment-amount-input'), {
      target: { value: '1.25' },
    });
    fireEvent.click(screen.getByTestId('curated-checkout-button'));

    expect(onBuyEmbroidery).toHaveBeenCalledTimes(1);
    expect(onBuyEmbroidery).toHaveBeenCalledWith({
      inputCoinType: '0xaaa::usdc::USDC',
      inputAmount: 1250000n,
    });
  });

  it('falls back to first available asset when default input coin type is invalid', () => {
    vi.useFakeTimers();
    const onBuyEmbroidery = vi.fn().mockResolvedValue(undefined);

    render(
      <CuratedPuzzle
        initialCraftIds={[
          'suzhou',
          'suzhou',
          'suzhou',
          'suzhou',
          'suzhou',
          'suzhou',
          'suzhou',
          'suzhou',
          'suzhou',
        ]}
        defaultInputCoinType="0xdead::coin::NOT_EXISTS"
        paymentAssets={[
          { label: 'SUI', coinType: '0x2::sui::SUI', decimals: 9 },
          { label: 'USDC', coinType: '0xaaa::usdc::USDC', decimals: 6 },
        ]}
        onBuyEmbroidery={onBuyEmbroidery}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mint Your Legacy' }));
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Request Physical / 实物 申领' }));
    fireEvent.click(screen.getByTestId('curated-checkout-button'));

    expect(onBuyEmbroidery).toHaveBeenCalledTimes(1);
    expect(onBuyEmbroidery).toHaveBeenCalledWith({
      inputCoinType: '0x2::sui::SUI',
      inputAmount: 100000000n,
    });
  });
});
