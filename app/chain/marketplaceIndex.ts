type ActiveListingShape = {
  listing?: unknown;
  category?: unknown;
  ask_amount?: unknown;
  fields?: unknown;
};

export type ActiveListingRef = {
  listingId: string;
  category: number;
  askAmount: bigint;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function parseCategory(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && value.length > 0) {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) return parsed;
  }
  return null;
}

function parseListingObjectId(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  const maybeRecord = asRecord(value);
  if (maybeRecord && typeof maybeRecord.id === 'string') {
    return maybeRecord.id;
  }
  return null;
}

function parseAskAmount(value: unknown): bigint | null {
  if (typeof value === 'string' && value.length > 0) {
    try {
      return BigInt(value);
    } catch {
      return null;
    }
  }
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return BigInt(value);
  }
  return null;
}

export function pickFirstActiveListingByCategory(
  marketplaceFields: unknown,
  category: number,
): ActiveListingRef | null {
  const fields = asRecord(marketplaceFields);
  if (!fields) return null;

  const activeListings = fields.active_listings;
  if (!Array.isArray(activeListings)) return null;

  for (const entry of activeListings) {
    const outer = asRecord(entry) as ActiveListingShape | null;
    if (!outer) continue;
    const listing = (asRecord(outer.fields) ?? outer) as ActiveListingShape;
    const parsedCategory = parseCategory(listing.category);
    if (parsedCategory !== category) continue;
    const listingObjectId = parseListingObjectId(listing.listing);
    if (!listingObjectId) continue;
    const askAmount = parseAskAmount(listing.ask_amount) ?? 0n;
    return {
      listingId: listingObjectId,
      category: parsedCategory,
      askAmount,
    };
  }

  return null;
}

export function pickFirstListingByCategory(marketplaceFields: unknown, category: number): string | null {
  return pickFirstActiveListingByCategory(marketplaceFields, category)?.listingId ?? null;
}
