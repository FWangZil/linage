type ActiveListingShape = {
  listing?: unknown;
  category?: unknown;
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

export function pickFirstListingByCategory(marketplaceFields: unknown, category: number): string | null {
  const fields = asRecord(marketplaceFields);
  if (!fields) return null;

  const activeListings = fields.active_listings;
  if (!Array.isArray(activeListings)) return null;

  for (const entry of activeListings) {
    const listing = asRecord(entry) as ActiveListingShape | null;
    if (!listing) continue;
    const parsedCategory = parseCategory(listing.category);
    if (parsedCategory !== category) continue;
    const listingObjectId = parseListingObjectId(listing.listing);
    if (listingObjectId) {
      return listingObjectId;
    }
  }

  return null;
}
