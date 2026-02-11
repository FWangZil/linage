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
import type { Transaction } from '@mysten/sui/transactions';
import { buildMintCollectibleUsdcTx, buildBuyListingUsdcTx } from '../chain/ptb';
import { getLinageRuntimeConfig } from '../chain/runtimeConfig';
import { pickFirstActiveListingByCategory, type ActiveListingRef } from '../chain/marketplaceIndex';
import { fetchLinageProfileSnapshot, type LinageProfileSnapshot } from '../chain/profile';

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

function formatMistToSui(amount: bigint): string {
  const whole = amount / 1_000_000_000n;
  const fractionalRaw = (amount % 1_000_000_000n).toString().padStart(9, '0');
  const fractional = fractionalRaw.replace(/0+$/, '');
  return fractional.length > 0 ? `${whole}.${fractional}` : `${whole}`;
}

export function formatLinageChainError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('Insufficient SUI balance for Gas Fee')) {
      return 'Insufficient SUI for gas on the connected account/network. Ensure wallet is on testnet and this address has spendable (not staked) SUI.';
    }
    if (error.message.includes('Insufficient sponsored budget for Gas Fee')) {
      return 'Sponsored gas budget is exhausted. Switch wallet to self-pay gas or top up SUI for gas.';
    }
    if (
      error.message.includes('Identifier("market")') &&
      error.message.includes('function_name: Some("buy_listing_internal")') &&
      error.message.includes('}, 2)')
    ) {
      return 'This listing is no longer active. Please refresh and choose an available item.';
    }
    if (
      error.message.includes('Identifier("admin")') &&
      error.message.includes('function_name: Some("assert_usdc_token")') &&
      error.message.includes('}, 7)')
    ) {
      return 'Settlement coin configuration mismatch between frontend and on-chain PlatformConfig. Check VITE_LINAGE_USDC_COIN_TYPE or re-register USDC type on-chain.';
    }
    if (error.message.includes('Cetus router error 1007:')) {
      return 'No Cetus route for this pair/amount right now. Try a larger amount or pay with the settlement coin directly.';
    }
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

  const signAndExecuteSelfPay = useCallback(
    async (tx: Transaction, owner: string): Promise<string | null> => {
      const cfg = getLinageRuntimeConfig();
      const gasBalance = await suiClient.getBalance({
        owner,
        coinType: '0x2::sui::SUI',
      });
      const totalBalance = BigInt(gasBalance.totalBalance);
      if (totalBalance < cfg.defaultTxGasBudget) {
        throw new Error(
          `Insufficient SUI for gas. Connected address ${owner} has ${formatMistToSui(totalBalance)} SUI spendable, minimum required is ${formatMistToSui(cfg.defaultTxGasBudget)} SUI.`,
        );
      }

      const result = await signAndExecuteTransaction({
        transaction: tx,
      });
      const digest = result.digest ?? null;
      setLastDigest(digest);
      return digest;
    },
    [signAndExecuteTransaction, suiClient],
  );

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
      return signAndExecuteSelfPay(tx, currentAccount.address);
    },
    [currentAccount, signAndExecuteSelfPay, suiClient],
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
      return signAndExecuteSelfPay(tx, currentAccount.address);
    },
    [currentAccount, signAndExecuteSelfPay, suiClient],
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

  const getProfileSnapshot = useCallback(
    async (owner: string): Promise<LinageProfileSnapshot> => {
      return fetchLinageProfileSnapshot(suiClient, owner);
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
    getProfileSnapshot,
    formatError: formatLinageChainError,
  };
}
