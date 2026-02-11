import BN from 'bn.js';
import { AggregatorClient, Env } from '@cetusprotocol/aggregator-sdk';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function parseAmount(value) {
  try {
    return new BN(requiredEnv(value));
  } catch {
    throw new Error(`Invalid amount env: ${value}`);
  }
}

async function main() {
  const rpc = process.env.SUI_RPC_URL || getFullnodeUrl('testnet');
  const endpoint = process.env.CETUS_AGGREGATOR_ENDPOINT;
  const fromCoinType = requiredEnv('FROM_COIN_TYPE');
  const targetCoinType = requiredEnv('TARGET_COIN_TYPE');
  const amount = parseAmount('AMOUNT_IN');

  if (fromCoinType === targetCoinType) {
    throw new Error('FROM_COIN_TYPE and TARGET_COIN_TYPE must be different for Cetus route smoke test.');
  }

  const suiClient = new SuiClient({ url: rpc });
  const aggregator = new AggregatorClient({
    client: suiClient,
    env: Env.Testnet,
    endpoint,
  });

  console.log('[cetus-smoke] Requesting route...');
  const route = await aggregator.findRouters({
    from: fromCoinType,
    target: targetCoinType,
    amount,
    byAmountIn: true,
  });

  if (!route) {
    throw new Error('[cetus-smoke] No route returned.');
  }
  if (route.error) {
    throw new Error(`[cetus-smoke] Router error ${route.error.code}: ${route.error.msg}`);
  }
  if (route.insufficientLiquidity) {
    throw new Error('[cetus-smoke] Route exists but insufficient liquidity.');
  }

  console.log('[cetus-smoke] Route OK.');
  const amountOut = route.amountOut?.toString?.() ?? 'unknown';
  console.log(`[cetus-smoke] from=${fromCoinType}`);
  console.log(`[cetus-smoke] target=${targetCoinType}`);
  console.log(`[cetus-smoke] amountIn=${amount.toString()}`);
  console.log(`[cetus-smoke] amountOut=${amountOut}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
