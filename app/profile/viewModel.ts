import type { LinageProfileSnapshot } from '../chain/profile';

export type ProfileStamp = {
  id: string;
  label: string;
  hint: string;
};

export type ProfileEntitlement = {
  title: string;
  detail: string;
};

type BuildProfileViewModelInput = {
  isConnected: boolean;
  isProfileSyncing: boolean;
  snapshot: LinageProfileSnapshot | null;
};

export type ProfileViewModel = {
  statusLabel: string;
  stamps: ProfileStamp[];
  entitlements: ProfileEntitlement[];
};

function buildStamps(snapshot: LinageProfileSnapshot | null): ProfileStamp[] {
  if (!snapshot) return [];

  const collectibleStamps = snapshot.collectibles.map((collectible) => ({
    id: collectible.objectId,
    label: `Collectible #${collectible.collectibleId}`,
    hint: `Tea code: ${collectible.itemCode}`,
  }));

  const productStamps = snapshot.products.map((product) => ({
    id: product.objectId,
    label: `Product #${product.sku}`,
    hint: product.title,
  }));

  return [...collectibleStamps, ...productStamps];
}

function buildEntitlements(
  isConnected: boolean,
  snapshot: LinageProfileSnapshot | null,
): ProfileEntitlement[] {
  if (!isConnected) {
    return [{ title: 'Entitlements', detail: 'Connect wallet to load on-chain rights.' }];
  }
  if (!snapshot) {
    return [{ title: 'Entitlements', detail: 'Snapshot unavailable. Try syncing again.' }];
  }

  const entitlements: ProfileEntitlement[] = [];
  if (snapshot.teaItemCodes.length > 0) {
    entitlements.push({
      title: 'Tea Passport',
      detail: `${snapshot.teaItemCodes.length} tea regions unlocked`,
    });
  }
  if (snapshot.collectibleCount > 0) {
    entitlements.push({
      title: 'Collector Tier',
      detail: `${snapshot.collectibleCount} collectible certificates on chain`,
    });
  }
  if (snapshot.productCount > 0) {
    entitlements.push({
      title: 'Artifact Allocation',
      detail: `${snapshot.productCount} product NFT in vault`,
    });
  }

  if (entitlements.length === 0) {
    entitlements.push({
      title: 'Entitlements',
      detail: 'No active rights found on chain for this address.',
    });
  }
  return entitlements;
}

function buildStatusLabel(
  isConnected: boolean,
  isProfileSyncing: boolean,
  snapshot: LinageProfileSnapshot | null,
): string {
  if (!isConnected) return 'Wallet Not Connected';
  if (isProfileSyncing) return 'Synchronizing on Chain';
  if (snapshot) return 'Synchronized on Chain';
  return 'Snapshot Unavailable';
}

export function buildProfileViewModel(input: BuildProfileViewModelInput): ProfileViewModel {
  return {
    statusLabel: buildStatusLabel(input.isConnected, input.isProfileSyncing, input.snapshot),
    stamps: buildStamps(input.snapshot),
    entitlements: buildEntitlements(input.isConnected, input.snapshot),
  };
}
