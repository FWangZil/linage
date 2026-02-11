export const SUI_COIN_TYPE = '0x2::sui::SUI';

export type LinageRuntimeConfig = {
  suiNetwork: 'testnet' | 'mainnet';
  packageId: string;
  platformConfigId: string;
  marketplaceId: string;
  collectibleRegistryId: string;
  usdcCoinType: string;
  cetusAggregatorEndpoint?: string;
  defaultInputCoinType: string;
  defaultMintInputAmount: bigint;
  defaultSwapSlippage: number;
  defaultTxGasBudget: bigint;
};

function requireEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseSlippage(value: string | undefined): number {
  const parsed = Number(value ?? '0.01');
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed >= 1) {
    return 0.01;
  }
  return parsed;
}

function parseAmount(value: string | undefined, fallback: bigint): bigint {
  try {
    const parsed = BigInt(value ?? fallback.toString());
    if (parsed <= 0n) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

export function getLinageRuntimeConfig(): LinageRuntimeConfig {
  const network = import.meta.env.VITE_SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
  return {
    suiNetwork: network,
    packageId: requireEnv('VITE_LINAGE_PACKAGE_ID'),
    platformConfigId: requireEnv('VITE_LINAGE_PLATFORM_CONFIG_ID'),
    marketplaceId: requireEnv('VITE_LINAGE_MARKETPLACE_ID'),
    collectibleRegistryId: requireEnv('VITE_LINAGE_COLLECTIBLE_REGISTRY_ID'),
    usdcCoinType: requireEnv('VITE_LINAGE_USDC_COIN_TYPE'),
    cetusAggregatorEndpoint: import.meta.env.VITE_CETUS_AGGREGATOR_ENDPOINT,
    defaultInputCoinType: import.meta.env.VITE_LINAGE_DEFAULT_INPUT_COIN_TYPE || SUI_COIN_TYPE,
    defaultMintInputAmount: parseAmount(import.meta.env.VITE_LINAGE_DEFAULT_MINT_INPUT_AMOUNT, 100000000n),
    defaultSwapSlippage: parseSlippage(import.meta.env.VITE_LINAGE_DEFAULT_SWAP_SLIPPAGE),
    defaultTxGasBudget: parseAmount(import.meta.env.VITE_LINAGE_DEFAULT_TX_GAS_BUDGET, 100000000n),
  };
}
