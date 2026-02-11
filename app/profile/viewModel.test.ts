import { describe, expect, it } from 'vitest';
import { buildProfileViewModel } from './viewModel';
import type { LinageProfileSnapshot } from '../chain/profile';

function sampleSnapshot(): LinageProfileSnapshot {
  return {
    teaItemCodes: ['bi-luo-chun', 'long-jing'],
    collectibleCount: 2,
    productCount: 1,
    collectibles: [
      {
        objectId: `0x${'1'.repeat(64)}`,
        collectibleId: '11',
        itemCode: 'bi-luo-chun',
        tribute: 'From Suzhou',
      },
      {
        objectId: `0x${'2'.repeat(64)}`,
        collectibleId: '12',
        itemCode: 'long-jing',
        tribute: '',
      },
    ],
    products: [
      {
        objectId: `0x${'3'.repeat(64)}`,
        sku: '3001',
        title: 'Suzhou Embroidery Crane',
        category: 0,
      },
    ],
  };
}

describe('buildProfileViewModel', () => {
  it('builds dynamic stamps and entitlements from on-chain snapshot', () => {
    const viewModel = buildProfileViewModel({
      isConnected: true,
      isProfileSyncing: false,
      snapshot: sampleSnapshot(),
    });

    expect(viewModel.statusLabel).toBe('Synchronized on Chain');
    expect(viewModel.stamps).toHaveLength(3);
    expect(viewModel.stamps[0]).toMatchObject({
      label: 'Collectible #11',
      hint: 'Tea code: bi-luo-chun',
    });
    expect(viewModel.stamps[2]).toMatchObject({
      label: 'Product #3001',
      hint: 'Suzhou Embroidery Crane',
    });
    expect(viewModel.entitlements).toEqual([
      { title: 'Tea Passport', detail: '2 tea regions unlocked' },
      { title: 'Collector Tier', detail: '2 collectible certificates on chain' },
      { title: 'Artifact Allocation', detail: '1 product NFT in vault' },
    ]);
  });

  it('returns syncing status while profile is loading', () => {
    const viewModel = buildProfileViewModel({
      isConnected: true,
      isProfileSyncing: true,
      snapshot: null,
    });
    expect(viewModel.statusLabel).toBe('Synchronizing on Chain');
  });

  it('returns disconnected defaults for wallets that are not connected', () => {
    const viewModel = buildProfileViewModel({
      isConnected: false,
      isProfileSyncing: false,
      snapshot: null,
    });

    expect(viewModel.statusLabel).toBe('Wallet Not Connected');
    expect(viewModel.stamps).toEqual([]);
    expect(viewModel.entitlements).toEqual([
      { title: 'Entitlements', detail: 'Connect wallet to load on-chain rights.' },
    ]);
  });
});
