/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUI_NETWORK?: 'testnet' | 'mainnet';
  readonly VITE_LINAGE_PACKAGE_ID?: string;
  readonly VITE_LINAGE_PLATFORM_CONFIG_ID?: string;
  readonly VITE_LINAGE_MARKETPLACE_ID?: string;
  readonly VITE_LINAGE_COLLECTIBLE_REGISTRY_ID?: string;
  readonly VITE_LINAGE_USDC_COIN_TYPE?: string;
  readonly VITE_CETUS_AGGREGATOR_ENDPOINT?: string;
  readonly VITE_LINAGE_DEFAULT_INPUT_COIN_TYPE?: string;
  readonly VITE_LINAGE_DEFAULT_MINT_INPUT_AMOUNT?: string;
  readonly VITE_LINAGE_DEFAULT_SWAP_SLIPPAGE?: string;
  readonly VITE_LINAGE_DEFAULT_TX_GAS_BUDGET?: string;
  readonly VITE_LINAGE_TEA_LISTING_ID?: string;
  readonly VITE_LINAGE_EMBROIDERY_LISTING_ID?: string;
  readonly VITE_LINAGE_DEFAULT_PAYMENT_AMOUNT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
