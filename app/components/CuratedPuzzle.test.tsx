import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

  it('reveals details and mint/purchase actions when puzzle is unified', async () => {
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

    expect(screen.queryByText('工艺细节')).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId('puzzle-fragment-4'));

    expect(await screen.findByText(/工艺细节/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'MINT NFT' })).toBeInTheDocument();
    expect(screen.getByText('Mint & Purchase')).toBeInTheDocument();
  });

  it('emits mint seal events, renders stamp, and notifies mint success', () => {
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

    fireEvent.click(screen.getByRole('button', { name: 'MINT NFT' }));

    expect(mintStartSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('mint-stamp-overlay')).toBeInTheDocument();

    vi.advanceTimersByTime(1600);
    expect(onMintSuccess).toHaveBeenCalledTimes(1);
    expect(mintEndSpy).toHaveBeenCalledTimes(1);

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

    await userEvent.click(screen.getByRole('button', { name: 'EMBROIDERY TRADE / 绣品交易' }));
    await userEvent.click(screen.getByRole('button', { name: 'TEA SWAP / 茶礼兑换' }));

    expect(onOpenEmbroidery).toHaveBeenCalledTimes(1);
    expect(onOpenTea).toHaveBeenCalledTimes(1);
  });
});
