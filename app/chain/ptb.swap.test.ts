import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

const {
  findRoutersMock,
  routerSwapMock,
  buildInputCoinMock,
  runtimeConfig,
} = vi.hoisted(() => {
  const findRoutersMock = vi.fn();
  const routerSwapMock = vi.fn();
  const buildInputCoinMock = vi.fn((tx: any) => ({
    targetCoin: tx.object(`0x${'1'.repeat(64)}`),
  }));

  const runtimeConfig = {
    suiNetwork: 'testnet' as const,
    packageId: `0x${'a'.repeat(64)}`,
    platformConfigId: `0x${'b'.repeat(64)}`,
    marketplaceId: `0x${'c'.repeat(64)}`,
    collectibleRegistryId: `0x${'d'.repeat(64)}`,
    usdcCoinType: `0x${'e'.repeat(64)}::usdc::USDC`,
    cetusAggregatorEndpoint: undefined as string | undefined,
    defaultInputCoinType: '0x2::sui::SUI',
    defaultMintInputAmount: 100000000n,
    defaultSwapSlippage: 0.01,
  };

  return {
    findRoutersMock,
    routerSwapMock,
    buildInputCoinMock,
    runtimeConfig,
  };
});

vi.mock('./runtimeConfig', () => ({
  SUI_COIN_TYPE: '0x2::sui::SUI',
  getLinageRuntimeConfig: () => runtimeConfig,
}));

vi.mock('@cetusprotocol/aggregator-sdk', async () => {
  const actual = await vi.importActual<any>('@cetusprotocol/aggregator-sdk');
  class MockAggregatorClient {
    findRouters = findRoutersMock;
    routerSwap = routerSwapMock;
  }
  return {
    ...actual,
    AggregatorClient: MockAggregatorClient,
    buildInputCoin: buildInputCoinMock,
  };
});

import { buildBuyListingUsdcTx } from './ptb';

function mockSuiClient(
  balance: string,
  coinType = '0x2::sui::SUI',
  platformConfigObject: Record<string, unknown> | null = null,
): SuiJsonRpcClient {
  return {
    getCoins: vi.fn().mockResolvedValue({
      data: [{ coinType, coinObjectId: `0x${'2'.repeat(64)}`, balance }],
      nextCursor: null,
    }),
    getObject: vi.fn().mockResolvedValue(platformConfigObject),
  } as unknown as SuiJsonRpcClient;
}

describe('buildBuyListingUsdcTx Cetus routing', () => {
  beforeEach(() => {
    findRoutersMock.mockReset();
    routerSwapMock.mockReset();
    buildInputCoinMock.mockClear();
    runtimeConfig.usdcCoinType = `0x${'e'.repeat(64)}::usdc::USDC`;
    routerSwapMock.mockImplementation(({ txb }: { txb: any }) => txb.object(`0x${'3'.repeat(64)}`));
  });

  it('builds tx with Cetus route in normal case', async () => {
    const suiClient = mockSuiClient('200000000');
    findRoutersMock.mockResolvedValue({ paths: [] });

    const tx = await buildBuyListingUsdcTx(suiClient, {
      owner: `0x${'4'.repeat(64)}`,
      listingId: `0x${'5'.repeat(64)}`,
      inputCoinType: '0x2::sui::SUI',
      inputAmount: 100000000n,
    });

    expect(tx).toBeDefined();
    expect(findRoutersMock).toHaveBeenCalledTimes(1);
    expect(routerSwapMock).toHaveBeenCalledTimes(1);
  });

  it('throws no-route error when Cetus returns null route', async () => {
    const suiClient = mockSuiClient('200000000');
    findRoutersMock.mockResolvedValue(null);

    await expect(
      buildBuyListingUsdcTx(suiClient, {
        owner: `0x${'4'.repeat(64)}`,
        listingId: `0x${'5'.repeat(64)}`,
        inputCoinType: '0x2::sui::SUI',
        inputAmount: 100000000n,
      }),
    ).rejects.toThrow('Cetus aggregator returned no route.');
  });

  it('throws insufficient-liquidity error when route is illiquid', async () => {
    const suiClient = mockSuiClient('200000000');
    findRoutersMock.mockResolvedValue({ insufficientLiquidity: true });

    await expect(
      buildBuyListingUsdcTx(suiClient, {
        owner: `0x${'4'.repeat(64)}`,
        listingId: `0x${'5'.repeat(64)}`,
        inputCoinType: '0x2::sui::SUI',
        inputAmount: 100000000n,
      }),
    ).rejects.toThrow('Insufficient liquidity for selected swap path.');
  });

  it('throws explicit router error (e.g. slippage exceeded)', async () => {
    const suiClient = mockSuiClient('200000000');
    findRoutersMock.mockResolvedValue({
      error: { code: 1203, msg: 'Slippage tolerance exceeded' },
    });

    await expect(
      buildBuyListingUsdcTx(suiClient, {
        owner: `0x${'4'.repeat(64)}`,
        listingId: `0x${'5'.repeat(64)}`,
        inputCoinType: '0x2::sui::SUI',
        inputAmount: 100000000n,
      }),
    ).rejects.toThrow('Cetus router error 1203: Slippage tolerance exceeded');
  });

  it('bypasses Cetus router when input coin is already settlement coin', async () => {
    runtimeConfig.usdcCoinType = '0x2::sui::SUI';
    const suiClient = mockSuiClient('200000000');

    const tx = await buildBuyListingUsdcTx(suiClient, {
      owner: `0x${'4'.repeat(64)}`,
      listingId: `0x${'5'.repeat(64)}`,
      inputCoinType: '0x2::sui::SUI',
      inputAmount: 100000000n,
    });

    expect(tx).toBeDefined();
    expect(findRoutersMock).not.toHaveBeenCalled();
    expect(routerSwapMock).not.toHaveBeenCalled();
  });

  it('prefers on-chain settlement coin type when env setting is stale', async () => {
    runtimeConfig.usdcCoinType = `0x${'e'.repeat(64)}::usdc::USDC`;
    const suiClient = mockSuiClient('200000000', '0x2::sui::SUI', {
      data: {
        content: {
          dataType: 'moveObject',
          fields: {
            usdc_type: {
              fields: {
                name: '0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
              },
            },
          },
        },
      },
    });

    const tx = await buildBuyListingUsdcTx(suiClient, {
      owner: `0x${'4'.repeat(64)}`,
      listingId: `0x${'5'.repeat(64)}`,
      inputCoinType: '0x2::sui::SUI',
      inputAmount: 100000000n,
    });

    expect(findRoutersMock).not.toHaveBeenCalled();
    expect(routerSwapMock).not.toHaveBeenCalled();

    const buyCall = tx
      .getData()
      .commands.find((command) => 'MoveCall' in command && command.MoveCall.function === 'buy_listing_usdc');
    expect(buyCall && 'MoveCall' in buyCall ? buyCall.MoveCall.typeArguments : []).toEqual(['0x2::sui::SUI']);
  });
});
