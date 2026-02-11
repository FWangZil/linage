import BN from 'bn.js';
import { AggregatorClient, buildInputCoin, Env, type CoinAsset } from '@cetusprotocol/aggregator-sdk';
import type { SuiClient } from '@mysten/sui/client';
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

function normalizeCoinType(coinType: string): string {
  return coinType.trim().toLowerCase();
}

export function shouldBypassAggregatorSwap(inputCoinType: string, targetCoinType: string): boolean {
  return normalizeCoinType(inputCoinType) === normalizeCoinType(targetCoinType);
}

function createAggregatorClient(suiClient: SuiJsonRpcClient) {
  const cfg = getLinageRuntimeConfig();
  return new AggregatorClient({
    client: suiClient as unknown as SuiClient,
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

async function swapToUsdc(
  suiClient: SuiJsonRpcClient,
  tx: Transaction,
  owner: string,
  inputCoinType: string,
  inputAmount: bigint,
  slippage: number,
): Promise<TransactionObjectArgument> {
  const cfg = getLinageRuntimeConfig();
  const coins = await loadAllCoinsOfType(suiClient, owner, inputCoinType);
  const available = coins.reduce((sum, coin) => sum + coin.balance, 0n);
  ensureSufficientInputBalance(inputCoinType, available, inputAmount, owner);

  if (shouldBypassAggregatorSwap(inputCoinType, cfg.usdcCoinType)) {
    if (shouldBypassAggregatorSwap(inputCoinType, '0x2::sui::SUI')) {
      const [suiCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(inputAmount.toString())]);
      return suiCoin;
    }

    return buildInputCoin(tx, coins, inputAmount, inputCoinType).targetCoin;
  }

  const aggregator = createAggregatorClient(suiClient);
  const inputCoin = buildInputCoin(tx, coins, inputAmount, inputCoinType).targetCoin;
  const router = await aggregator.findRouters({
    from: inputCoinType,
    target: cfg.usdcCoinType,
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

  return aggregator.routerSwap({
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
  const tx = new Transaction();

  const inputCoinType = params.inputCoinType ?? cfg.defaultInputCoinType;
  const inputAmount = params.inputAmount ?? cfg.defaultMintInputAmount;
  const slippage = params.slippage ?? cfg.defaultSwapSlippage;

  const usdcCoin = await swapToUsdc(
    suiClient,
    tx,
    params.owner,
    inputCoinType,
    inputAmount,
    slippage,
  );

  tx.moveCall({
    target: `${cfg.packageId}::collectible::mint_collectible_usdc`,
    typeArguments: [cfg.usdcCoinType],
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
  const tx = new Transaction();

  const inputCoinType = params.inputCoinType ?? cfg.defaultInputCoinType;
  const slippage = params.slippage ?? cfg.defaultSwapSlippage;

  const usdcCoin = await swapToUsdc(
    suiClient,
    tx,
    params.owner,
    inputCoinType,
    params.inputAmount,
    slippage,
  );

  tx.moveCall({
    target: `${cfg.packageId}::market::buy_listing_usdc`,
    typeArguments: [cfg.usdcCoinType],
    arguments: [
      tx.object(cfg.platformConfigId),
      tx.object(cfg.marketplaceId),
      tx.object(params.listingId),
      usdcCoin,
    ],
  });

  return tx;
}
