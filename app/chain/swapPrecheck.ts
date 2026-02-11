import { SUI_COIN_TYPE } from './runtimeConfig';

function coinDecimals(coinType: string): number {
  if (coinType === SUI_COIN_TYPE) {
    return 9;
  }
  return 6;
}

function coinSymbol(coinType: string): string {
  if (coinType === SUI_COIN_TYPE) {
    return 'SUI';
  }
  return coinType.split('::').at(-1) ?? coinType;
}

export function formatForDisplay(coinType: string, amount: bigint): string {
  const decimals = coinDecimals(coinType);
  const scale = 10n ** BigInt(decimals);
  const whole = amount / scale;
  const fraction = amount % scale;
  if (fraction === 0n) {
    return `${whole.toString()} ${coinSymbol(coinType)}`;
  }

  const paddedFraction = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${whole.toString()}.${paddedFraction} ${coinSymbol(coinType)}`;
}

export function ensureSufficientInputBalance(
  coinType: string,
  available: bigint,
  required: bigint,
  owner?: string,
) {
  if (available >= required) {
    return;
  }

  const ownerSuffix = owner ? ` (owner: ${owner})` : '';
  throw new Error(
    `Insufficient balance for ${coinType}. Required: ${formatForDisplay(coinType, required)}, available: ${formatForDisplay(coinType, available)}.${ownerSuffix}`,
  );
}
