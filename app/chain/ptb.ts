import BN from 'bn.js';
import { AggregatorClient, buildInputCoin, Env, type CoinAsset } from '@cetusprotocol/aggregator-sdk';
import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { Transaction, type TransactionObjectArgument } from '@mysten/sui/transactions';
import { getLinageRuntimeConfig } from './runtimeConfig';
import { ensureSufficientInputBalance } from './swapPrecheck';

type MintCollectibleUsdcParams = {
  owner: string;
  itemCode: string;
  tribute: string;
  inputCoinType?: string;
  inputAmount?: bigint;
  slippage?: number;
};

type BuyListingUsdcParams = {
  owner: string;
  listingId: string;
  inputCoinType?: string;
  inputAmount: bigint;
  slippage?: number;
};

type PlatformConfigObjectResponse = {
  data?: {
    content?: {
      dataType?: string;
      fields?: {
        usdc_type?: {
          fields?: {
            name?: string;
          };
        } | null;
      };
    };
  };
};

function canonicalizeAddress(address: string): string {
  const trimmed = address.trim().toLowerCase();
  if (!trimmed) {
    return '0x0';
  }
  const withoutPrefix = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed;
  if (!/^[0-9a-f]+$/.test(withoutPrefix)) {
    return trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
  }
  const significant = withoutPrefix.replace(/^0+/, '');
  return `0x${significant || '0'}`;
}

function canonicalizeCoinType(coinType: string): string {
  const trimmed = coinType.trim();
  const separatorIndex = trimmed.indexOf('::');
  if (separatorIndex < 0) {
    return trimmed;
  }
  const address = trimmed.slice(0, separatorIndex);
  const rest = trimmed.slice(separatorIndex + 2);
  return `${canonicalizeAddress(address)}::${rest}`;
}

function normalizeCoinType(coinType: string): string {
  return canonicalizeCoinType(coinType).toLowerCase();
}

export function shouldBypassAggregatorSwap(inputCoinType: string, targetCoinType: string): boolean {
  return normalizeCoinType(inputCoinType) === normalizeCoinType(targetCoinType);
}

function createAggregatorClient(suiClient: SuiJsonRpcClient) {
  const cfg = getLinageRuntimeConfig();
  return new AggregatorClient({
    client: suiClient as unknown as never,
    env: cfg.suiNetwork === 'mainnet' ? Env.Mainnet : Env.Testnet,
    endpoint: cfg.cetusAggregatorEndpoint,
  });
}

async function loadAllCoinsOfType(
  suiClient: SuiJsonRpcClient,
  owner: string,
  coinType: string,
): Promise<CoinAsset[]> {
  let cursor: string | null | undefined = null;
  const coins: CoinAsset[] = [];

  do {
    const page = await suiClient.getCoins({
      owner,
      coinType,
      cursor: cursor ?? undefined,
    });

    coins.push(
      ...page.data.map((coin) => ({
        coinAddress: coin.coinType,
        coinObjectId: coin.coinObjectId,
        balance: BigInt(coin.balance),
      })),
    );

    cursor = page.nextCursor;
  } while (cursor);

  return coins;
}

async function resolveUsdcCoinType(
  suiClient: SuiJsonRpcClient,
  fallbackCoinType: string,
  platformConfigId: string,
): Promise<string> {
  const fallback = canonicalizeCoinType(fallbackCoinType);
  try {
    const platformConfig = (await suiClient.getObject({
      id: platformConfigId,
      options: { showContent: true },
    })) as PlatformConfigObjectResponse;

    if (platformConfig.data?.content?.dataType !== 'moveObject') {
      return fallback;
    }

    const onChainTypeName = platformConfig.data.content.fields?.usdc_type?.fields?.name;
    if (!onChainTypeName) {
      return fallback;
    }
    return canonicalizeCoinType(onChainTypeName);
  } catch {
    return fallback;
  }
}

async function swapToUsdc(
  suiClient: SuiJsonRpcClient,
  tx: Transaction,
  owner: string,
  inputCoinType: string,
  settlementCoinType: string,
  inputAmount: bigint,
  slippage: number,
): Promise<TransactionObjectArgument> {
  const buildInputCoinCompat = buildInputCoin as unknown as (
    txb: Transaction,
    coins: CoinAsset[],
    amount: bigint,
    coinType: string,
  ) => { targetCoin: TransactionObjectArgument };

  const coins = await loadAllCoinsOfType(suiClient, owner, inputCoinType);
  const available = coins.reduce((sum, coin) => sum + coin.balance, 0n);
  ensureSufficientInputBalance(inputCoinType, available, inputAmount, owner);

  if (shouldBypassAggregatorSwap(inputCoinType, settlementCoinType)) {
    if (shouldBypassAggregatorSwap(inputCoinType, '0x2::sui::SUI')) {
      const [suiCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(inputAmount.toString())]);
      return suiCoin;
    }

    return buildInputCoinCompat(tx, coins, inputAmount, inputCoinType).targetCoin;
  }

  const aggregator = createAggregatorClient(suiClient);
  const inputCoin = buildInputCoinCompat(tx, coins, inputAmount, inputCoinType).targetCoin;
  const router = await aggregator.findRouters({
    from: inputCoinType,
    target: settlementCoinType,
    amount: new BN(inputAmount.toString()),
    byAmountIn: true,
  });

  if (!router) {
    throw new Error('Cetus aggregator returned no route.');
  }
  if (router.error) {
    throw new Error(`Cetus router error ${router.error.code}: ${router.error.msg}`);
  }
  if (router.insufficientLiquidity) {
    throw new Error('Insufficient liquidity for selected swap path.');
  }

  const routerSwapCompat = aggregator.routerSwap as unknown as (args: {
    router: unknown;
    txb: Transaction;
    inputCoin: TransactionObjectArgument;
    slippage: number;
  }) => TransactionObjectArgument;

  return routerSwapCompat({
    router,
    txb: tx,
    inputCoin,
    slippage,
  });
}

export async function buildMintCollectibleUsdcTx(
  suiClient: SuiJsonRpcClient,
  params: MintCollectibleUsdcParams,
): Promise<Transaction> {
  const cfg = getLinageRuntimeConfig();
  const settlementCoinType = await resolveUsdcCoinType(suiClient, cfg.usdcCoinType, cfg.platformConfigId);
  const tx = new Transaction();

  const inputCoinType = params.inputCoinType ?? cfg.defaultInputCoinType;
  const inputAmount = params.inputAmount ?? cfg.defaultMintInputAmount;
  const slippage = params.slippage ?? cfg.defaultSwapSlippage;

  const usdcCoin = await swapToUsdc(
    suiClient,
    tx,
    params.owner,
    inputCoinType,
    settlementCoinType,
    inputAmount,
    slippage,
  );

  tx.moveCall({
    target: `${cfg.packageId}::collectible::mint_collectible_usdc`,
    typeArguments: [settlementCoinType],
    arguments: [
      tx.object(cfg.platformConfigId),
      tx.object(cfg.collectibleRegistryId),
      tx.pure.string(params.itemCode),
      tx.pure.string(params.tribute),
      usdcCoin,
    ],
  });

  return tx;
}

export async function buildBuyListingUsdcTx(
  suiClient: SuiJsonRpcClient,
  params: BuyListingUsdcParams,
): Promise<Transaction> {
  const cfg = getLinageRuntimeConfig();
  const settlementCoinType = await resolveUsdcCoinType(suiClient, cfg.usdcCoinType, cfg.platformConfigId);
  const tx = new Transaction();

  const inputCoinType = params.inputCoinType ?? cfg.defaultInputCoinType;
  const slippage = params.slippage ?? cfg.defaultSwapSlippage;

  const usdcCoin = await swapToUsdc(
    suiClient,
    tx,
    params.owner,
    inputCoinType,
    settlementCoinType,
    params.inputAmount,
    slippage,
  );

  tx.moveCall({
    target: `${cfg.packageId}::market::buy_listing_usdc`,
    typeArguments: [settlementCoinType],
    arguments: [
      tx.object(cfg.platformConfigId),
      tx.object(cfg.marketplaceId),
      tx.object(params.listingId),
      usdcCoin,
    ],
  });

  return tx;
}
