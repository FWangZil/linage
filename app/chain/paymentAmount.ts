export function parseDisplayAmountToMinorUnits(amount: string, decimals: number): bigint {
  const normalized = amount.trim();
  if (!normalized) {
    throw new Error('Please enter an amount.');
  }
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new Error('Invalid asset decimals configuration.');
  }
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error('Amount format is invalid.');
  }

  const [wholePartRaw, fractionRaw = ''] = normalized.split('.');
  if (fractionRaw.length > decimals) {
    throw new Error(`Amount supports at most ${decimals} decimal places.`);
  }

  const wholePart = BigInt(wholePartRaw);
  const scale = 10n ** BigInt(decimals);
  const paddedFraction = (fractionRaw + '0'.repeat(decimals)).slice(0, decimals);
  const fractionPart = paddedFraction ? BigInt(paddedFraction) : 0n;
  const total = wholePart * scale + fractionPart;

  if (total <= 0n) {
    throw new Error('Amount must be greater than 0.');
  }
  return total;
}
