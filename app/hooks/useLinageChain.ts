import { useCallback, useState } from 'react';
import {
  useConnectWallet,
  useCurrentAccount,
  useCurrentWallet,
  useDisconnectWallet,
  useSignAndExecuteTransaction,
  useSuiClient,
  useWallets,
} from '@mysten/dapp-kit';
import { buildMintCollectibleUsdcTx, buildBuyListingUsdcTx } from '../chain/ptb';
import { getLinageRuntimeConfig } from '../chain/runtimeConfig';
import { pickFirstActiveListingByCategory, type ActiveListingRef } from '../chain/marketplaceIndex';

type MintTeaParams = {
  itemCode: string;
  tribute: string;
  inputCoinType?: string;
  inputAmount?: bigint;
  slippage?: number;
};

type BuyListingParams = {
  listingId: string;
  inputCoinType?: string;
  inputAmount: bigint;
  slippage?: number;
};

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (
      error.message.includes('Identifier("market")') &&
      error.message.includes('function_name: Some("buy_listing_internal")') &&
      error.message.includes('}, 4)')
    ) {
      return 'Payment amount is below listing price. Please increase amount and try again.';
    }
    return error.message;
  }
  return String(error);
}

export function useLinageChain() {
  const wallets = useWallets();
  const currentAccount = useCurrentAccount();
  const { isConnected } = useCurrentWallet();
  const { mutateAsync: connectWallet, isPending: isConnecting } = useConnectWallet();
  const { mutateAsync: disconnectWallet, isPending: isDisconnecting } = useDisconnectWallet();
  const { mutateAsync: signAndExecuteTransaction, isPending: isSigning } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const [lastDigest, setLastDigest] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (wallets.length === 0) {
      throw new Error('No Sui wallet detected. Please install Slush, Suiet, or another Sui wallet.');
    }
    await connectWallet({ wallet: wallets[0] });
  }, [connectWallet, wallets]);

  const disconnect = useCallback(async () => {
    if (!isConnected) return;
    await disconnectWallet();
  }, [disconnectWallet, isConnected]);

  const mintTeaCollectibleUsdc = useCallback(
    async (params: MintTeaParams): Promise<string | null> => {
      if (!currentAccount) {
        throw new Error('Wallet not connected.');
      }

      const tx = await buildMintCollectibleUsdcTx(suiClient, {
        owner: currentAccount.address,
        itemCode: params.itemCode,
        tribute: params.tribute,
        inputCoinType: params.inputCoinType,
        inputAmount: params.inputAmount,
        slippage: params.slippage,
      });
      const result = await signAndExecuteTransaction({ transaction: tx });
      const digest = 'digest' in result ? result.digest : null;
      setLastDigest(digest);
      return digest;
    },
    [currentAccount, signAndExecuteTransaction, suiClient],
  );

  const buyListingUsdc = useCallback(
    async (params: BuyListingParams): Promise<string | null> => {
      if (!currentAccount) {
        throw new Error('Wallet not connected.');
      }
      const tx = await buildBuyListingUsdcTx(suiClient, {
        owner: currentAccount.address,
        listingId: params.listingId,
        inputCoinType: params.inputCoinType,
        inputAmount: params.inputAmount,
        slippage: params.slippage,
      });
      const result = await signAndExecuteTransaction({ transaction: tx });
      const digest = 'digest' in result ? result.digest : null;
      setLastDigest(digest);
      return digest;
    },
    [currentAccount, signAndExecuteTransaction, suiClient],
  );

  const getActiveListingByCategory = useCallback(
    async (category: number): Promise<ActiveListingRef | null> => {
      const cfg = getLinageRuntimeConfig();
      const result = await suiClient.getObject({
        id: cfg.marketplaceId,
        options: { showContent: true },
      });

      const content = result.data?.content;
      if (!content || content.dataType !== 'moveObject') {
        return null;
      }

      return pickFirstActiveListingByCategory(content.fields, category);
    },
    [suiClient],
  );

  return {
    currentAccount,
    isConnected,
    address: currentAccount?.address ?? '',
    isBusy: isConnecting || isDisconnecting || isSigning,
    lastDigest,
    connect,
    disconnect,
    mintTeaCollectibleUsdc,
    buyListingUsdc,
    getActiveListingByCategory,
    formatError: errorMessage,
  };
}
