# Cetus Testnet Validation (Milestone A)

Date: 2026-02-12

## Scope

Validate frontend PTB path before enabling StableLayer:

- swap to settlement token with Cetus path
- fallback/bypass behavior
- error handling for router/no-route/liquidity/slippage
- readable payment error for `buy_listing_internal` abort code `4`

## Automated Test Coverage

Run:

```bash
pnpm --dir app test:cetus
```

Covered cases:

1. normal route success: `app/chain/ptb.swap.test.ts`
2. no route: `app/chain/ptb.swap.test.ts`
3. insufficient liquidity: `app/chain/ptb.swap.test.ts`
4. router/slippage-style error: `app/chain/ptb.swap.test.ts`
5. input==target bypass (no Cetus call): `app/chain/ptb.swap.test.ts`
6. payment below ask friendly message: `app/hooks/useLinageChain.error.test.ts`

## Testnet Smoke (Live Cetus Route)

Requires a known tradable pair and minor-unit amount:

```bash
FROM_COIN_TYPE=<coin-type> \
TARGET_COIN_TYPE=<coin-type> \
AMOUNT_IN=<minor-units> \
CETUS_AGGREGATOR_ENDPOINT=<optional-endpoint> \
pnpm --dir app smoke:cetus:testnet
```

Notes:

- `FROM_COIN_TYPE` and `TARGET_COIN_TYPE` must be different.
- Script checks route availability and prints `amountOut`.
- Script intentionally does not send a transaction; it validates routing connectivity and quote quality.
