import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { getLinageRuntimeConfig } from './runtimeConfig';

export type OwnedCollectible = {
  objectId: string;
  collectibleId: string;
  itemCode: string;
  tribute: string;
};

export type OwnedProduct = {
  objectId: string;
  sku: string;
  title: string;
  category: number;
};

export type LinageProfileSnapshot = {
  teaItemCodes: string[];
  collectibleCount: number;
  productCount: number;
  collectibles: OwnedCollectible[];
  products: OwnedProduct[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function parseString(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value;
  return null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function parseCollectible(entry: unknown, expectedType: string): OwnedCollectible | null {
  const outer = asRecord(entry);
  const data = asRecord(outer?.data);
  if (!data || data.type !== expectedType) return null;

  const objectId = parseString(data.objectId);
  const content = asRecord(data.content);
  const fields = asRecord(content?.fields);
  const collectibleId = parseString(fields?.collectible_id);
  const itemCode = parseString(fields?.item_code);
  const tribute = typeof fields?.tribute === 'string' ? fields.tribute : '';
  if (!objectId || !collectibleId || !itemCode) return null;

  return {
    objectId,
    collectibleId,
    itemCode,
    tribute,
  };
}

function parseProduct(entry: unknown, expectedType: string): OwnedProduct | null {
  const outer = asRecord(entry);
  const data = asRecord(outer?.data);
  if (!data || data.type !== expectedType) return null;

  const objectId = parseString(data.objectId);
  const content = asRecord(data.content);
  const fields = asRecord(content?.fields);
  const sku = parseString(fields?.sku);
  const title = parseString(fields?.title);
  const category = parseNumber(fields?.category);
  if (!objectId || !sku || !title || category === null) return null;

  return {
    objectId,
    sku,
    title,
    category,
  };
}

async function fetchAllOwnedObjectsByType(
  suiClient: SuiJsonRpcClient,
  owner: string,
  structType: string,
): Promise<unknown[]> {
  let cursor: string | null | undefined = undefined;
  const all: unknown[] = [];

  while (true) {
    const page = await suiClient.getOwnedObjects({
      owner,
      cursor: cursor ?? undefined,
      filter: { StructType: structType },
      options: { showType: true, showContent: true },
    });
    all.push(...page.data);
    if (!page.hasNextPage) break;
    if (!page.nextCursor || page.nextCursor === cursor) break;
    cursor = page.nextCursor;
  }

  return all;
}

export async function fetchLinageProfileSnapshot(
  suiClient: SuiJsonRpcClient,
  owner: string,
): Promise<LinageProfileSnapshot> {
  const cfg = getLinageRuntimeConfig();
  const collectibleType = `${cfg.packageId}::collectible::HeritageCollectible`;
  const productType = `${cfg.packageId}::merchant::ProductNFT`;

  const [collectibleRaw, productRaw] = await Promise.all([
    fetchAllOwnedObjectsByType(suiClient, owner, collectibleType),
    fetchAllOwnedObjectsByType(suiClient, owner, productType),
  ]);

  const collectibles = collectibleRaw
    .map((entry) => parseCollectible(entry, collectibleType))
    .filter((item): item is OwnedCollectible => Boolean(item));

  const products = productRaw
    .map((entry) => parseProduct(entry, productType))
    .filter((item): item is OwnedProduct => Boolean(item));

  const teaItemCodes = Array.from(new Set(collectibles.map((item) => item.itemCode)));

  return {
    teaItemCodes,
    collectibleCount: collectibles.length,
    productCount: products.length,
    collectibles,
    products,
  };
}
