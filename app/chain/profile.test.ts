import { describe, expect, it, vi } from 'vitest';
import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { fetchLinageProfileSnapshot } from './profile';

vi.mock('./runtimeConfig', () => ({
  getLinageRuntimeConfig: () => ({
    suiNetwork: 'testnet',
    packageId: `0x${'a'.repeat(64)}`,
    platformConfigId: `0x${'b'.repeat(64)}`,
    marketplaceId: `0x${'c'.repeat(64)}`,
    collectibleRegistryId: `0x${'d'.repeat(64)}`,
    usdcCoinType: `0x${'e'.repeat(64)}::usdc::USDC`,
    defaultInputCoinType: '0x2::sui::SUI',
    defaultMintInputAmount: 100000000n,
    defaultSwapSlippage: 0.01,
  }),
}));

function mockOwnedObjectsClient(): SuiJsonRpcClient {
  const pkg = `0x${'a'.repeat(64)}`;
  const collectibleType = `${pkg}::collectible::HeritageCollectible`;
  const productType = `${pkg}::merchant::ProductNFT`;
  const getOwnedObjects = vi
    .fn()
    .mockImplementationOnce(async () => ({
      data: [
        {
          data: {
            objectId: `0x${'1'.repeat(64)}`,
            type: collectibleType,
            content: {
              dataType: 'moveObject',
              fields: {
                collectible_id: '11',
                item_code: 'bi-luo-chun',
                tribute: 'For master',
              },
            },
          },
        },
        {
          data: {
            objectId: `0x${'2'.repeat(64)}`,
            type: collectibleType,
            content: {
              dataType: 'moveObject',
              fields: {
                collectible_id: '12',
                item_code: 'long-jing',
                tribute: '',
              },
            },
          },
        },
      ],
      nextCursor: null,
      hasNextPage: false,
    }))
    .mockImplementationOnce(async () => ({
      data: [
        {
          data: {
            objectId: `0x${'3'.repeat(64)}`,
            type: productType,
            content: {
              dataType: 'moveObject',
              fields: {
                sku: '1003',
                title: 'Suzhou Embroidery Crane',
                category: 0,
              },
            },
          },
        },
      ],
      nextCursor: null,
      hasNextPage: false,
    }));

  return { getOwnedObjects } as unknown as SuiJsonRpcClient;
}

describe('fetchLinageProfileSnapshot', () => {
  it('aggregates owned collectibles and products from chain objects', async () => {
    const snapshot = await fetchLinageProfileSnapshot(
      mockOwnedObjectsClient(),
      `0x${'f'.repeat(64)}`,
    );

    expect(snapshot.collectibleCount).toBe(2);
    expect(snapshot.productCount).toBe(1);
    expect(snapshot.teaItemCodes).toEqual(['bi-luo-chun', 'long-jing']);
    expect(snapshot.collectibles[0]).toEqual({
      objectId: `0x${'1'.repeat(64)}`,
      collectibleId: '11',
      itemCode: 'bi-luo-chun',
      tribute: 'For master',
    });
    expect(snapshot.products[0]).toEqual({
      objectId: `0x${'3'.repeat(64)}`,
      sku: '1003',
      title: 'Suzhou Embroidery Crane',
      category: 0,
    });
  });

  it('stops pagination when hasNextPage is false even if nextCursor is non-null', async () => {
    const pkg = `0x${'a'.repeat(64)}`;
    const collectibleType = `${pkg}::collectible::HeritageCollectible`;
    const productType = `${pkg}::merchant::ProductNFT`;
    const stickyCursor = `0x${'c'.repeat(64)}`;

    const getOwnedObjects = vi
      .fn()
      .mockImplementationOnce(async () => ({
        data: [
          {
            data: {
              objectId: `0x${'1'.repeat(64)}`,
              type: collectibleType,
              content: {
                dataType: 'moveObject',
                fields: {
                  collectible_id: '21',
                  item_code: 'an-ji-bai-cha',
                  tribute: '',
                },
              },
            },
          },
        ],
        nextCursor: stickyCursor,
        hasNextPage: false,
      }))
      .mockImplementationOnce(async () => ({
        data: [
          {
            data: {
              objectId: `0x${'2'.repeat(64)}`,
              type: productType,
              content: {
                dataType: 'moveObject',
                fields: {
                  sku: '2001',
                  title: 'Suzhou Embroidery Lotus',
                  category: 0,
                },
              },
            },
          },
        ],
        nextCursor: stickyCursor,
        hasNextPage: false,
      }));

    const snapshot = await fetchLinageProfileSnapshot(
      { getOwnedObjects } as unknown as SuiJsonRpcClient,
      `0x${'f'.repeat(64)}`,
    );

    expect(getOwnedObjects).toHaveBeenCalledTimes(2);
    expect(snapshot.collectibleCount).toBe(1);
    expect(snapshot.productCount).toBe(1);
  });
});
