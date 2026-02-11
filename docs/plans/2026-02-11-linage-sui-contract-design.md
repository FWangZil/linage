# Linage Sui Contract Design

Date: 2026-02-11

## 1. Goal

Build a Sui on-chain protocol for:

- Merchant pre-mint and listing of heritage product NFTs (e.g. 苏绣、茶叶).
- User collectible minting and product purchasing with paid flow.
- Payment mode switch:
  - `StableLayer ON`: settle in LUSD (our StableLayer-issued stablecoin).
  - `StableLayer OFF`: settle in USDC fallback.
- Frontend uses Cetus aggregator / SDK to convert arbitrary user assets into settlement token.

## 2. Current Frontend Audit (what exists now)

### 2.1 Business actions already in UI

- Wallet connect is UI mock only, not real chain wallet:
  - `app/App.tsx:77`
- Tea collectible mint is simulated by timeout + local state:
  - `app/components/TeaDetail.tsx:39`
- Collectible and save status are persisted only in localStorage:
  - `app/App.tsx:52`
  - `app/App.tsx:94`
  - `app/App.tsx:102`
- “Pay respects / tribute” text exists in UI but is not stored on-chain:
  - `app/components/TeaDetail.tsx:243`
- “Save experience” is purely local bookmark behavior:
  - `app/components/ExperiencePage.tsx:117`

### 2.2 Chain package status

- Move package is initialized but module is still empty template:
  - `sources/linage.move:1`

Conclusion: Frontend interaction model is mostly ready, but all chain-critical logic (mint/list/buy/payment settlement/events) still needs Move modules + PTB integration.

## 3. Integration Constraints (important)

1. Cetus aggregator and StableLayer SDK are off-chain SDK tools (TypeScript PTB composition), not callable from Move directly.
2. Move contract should validate settlement token + pricing + asset transfer, not perform DEX route discovery.
3. Payment switch must live on-chain as a shared config so frontend cannot spoof settlement mode.
4. Since StableLayer is not available on testnet yet, default mode should be USDC fallback.

## 4. Architecture Options

### Option A: Put swap logic inside Move

- Pros: single contract abstraction.
- Cons: not practical; DEX route finding is off-chain; high complexity and poor upgradeability.
- Decision: reject.

### Option B (Recommended): On-chain settlement guard + frontend PTB orchestrator

- Pros:
  - Clean responsibility boundary.
  - Works with Cetus aggregator today.
  - StableLayer can be enabled later via config switch without changing purchase API shape.
- Cons:
  - Requires robust frontend PTB builder and quote handling.
- Decision: **recommended**.

### Option C: Backend relayer-only payment pipeline

- Pros: client simpler.
- Cons: custody/regulatory/trust burden, introduces centralized failure points.
- Decision: keep as optional future extension, not V1.

## 5. Recommended On-chain Module Design (Move 2024)

## 5.1 Module layout

- `linage::admin`
  - Admin capability, global config, pause switch.
- `linage::merchant`
  - Merchant registration/capability.
- `linage::catalog`
  - Product metadata templates and SKU lifecycle.
- `linage::market`
  - NFT escrow listing, purchase settlement, fee split.
- `linage::collectible`
  - User collectible mint (tea stamp / heritage pass) + tribute binding.
- `linage::events`
  - Event structs (list/purchase/mint/toggle).

## 5.2 Key shared objects

```move
public struct AdminCap has key { id: UID }

public struct PlatformConfig has key {
    id: UID,
    stablelayer_enabled: bool,
    paused: bool,
    platform_fee_bps: u16,
    treasury: address,
    usdc_type: TypeName,
    lusd_type: Option<TypeName>, // register later when available
}

public struct Marketplace has key {
    id: UID,
    next_listing_id: u64,
}
```

## 5.3 Merchant and product objects

```move
public struct MerchantCap has key {
    id: UID,
    owner: address,
    merchant_id: u64,
}

public struct ProductNFT has key, store {
    id: UID,
    merchant: address,
    sku: u64,
    title: String,
    metadata_uri: String,
    category: u8,      // 0=embroidery,1=tea,...
    listable: bool,
}

public struct Listing has key {
    id: UID,
    listing_id: u64,
    merchant: address,
    ask_amount: u64,   // in settlement token minor unit
    active: bool,
}
```

Note: Escrow the `ProductNFT` with `dynamic_object_field` under `Listing` (or `Marketplace`) to guarantee atomic delivery on purchase.

## 6. Payment Switch and Settlement Rules

## 6.1 On-chain source of truth

- `PlatformConfig.stablelayer_enabled == true`:
  - purchase/mint entry must accept only LUSD type.
- `PlatformConfig.stablelayer_enabled == false`:
  - purchase/mint entry must accept only USDC type.

Core check helper:

```move
public fun assert_settlement_token<T>(cfg: &PlatformConfig) {
    let t = type_name::get<T>();
    if (cfg.stablelayer_enabled) {
        assert!(option::is_some(&cfg.lusd_type), ENoLusdConfigured);
        assert!(t == *option::borrow(&cfg.lusd_type), EInvalidSettlementToken);
    } else {
        assert!(t == cfg.usdc_type, EInvalidSettlementToken);
    }
}
```

## 6.2 Entry points (shape)

```move
public entry fun buy_listing<T>(
    cfg: &PlatformConfig,
    market: &mut Marketplace,
    listing: &mut Listing,
    payment: Coin<T>,
    clock: &Clock,
    ctx: &mut TxContext
)

public entry fun mint_collectible<T>(
    cfg: &PlatformConfig,
    tribute: vector<u8>,
    item_code: vector<u8>,
    payment: Coin<T>,
    ctx: &mut TxContext
)
```

`T` is generic but validated against config switch above.

## 6.3 Fee and transfer

Inside buy/mint:

1. `assert_settlement_token<T>(cfg)`.
2. Validate amount (`coin::value`).
3. Split payment into:
   - platform fee (`platform_fee_bps`)
   - merchant proceeds.
4. Transfer fee to `cfg.treasury`, transfer proceeds to merchant.
5. Transfer NFT/collectible to buyer.
6. Emit event.

## 7. Off-chain PTB Composition (Frontend SDK Layer)

## 7.1 StableLayer OFF (today, testnet default)

1. Read `PlatformConfig` from chain -> detect `stablelayer_enabled=false`.
2. Use Cetus Aggregator:
   - `findRouters(...)`
   - `routerSwap(...)` (or `fastRouterSwap(...)`)
3. Convert user input asset -> USDC.
4. In the same PTB, call `linage::market::buy_listing<USDC>(...)` (or collectible mint).

## 7.2 StableLayer ON

1. Read config -> target settlement = LUSD.
2. Preferred path:
   - Cetus aggregator swap input asset -> LUSD.
3. Optional fallback path (if no liquid LUSD pool yet):
   - swap input asset -> collateral token (e.g. USDC),
   - call StableLayer SDK mint flow to obtain LUSD,
   - then purchase using LUSD.

## 7.3 Why this split is safe

- Route selection/slippage/min-out remains off-chain where DEX data exists.
- Move validates final settlement token and amount, preventing wrong-token settlement.

## 8. Frontend-to-Contract Mapping

- Tea mint action (`app/components/TeaDetail.tsx:174`) ->
  `collectible::mint_collectible<T>()`.
- Tribute text (`app/components/TeaDetail.tsx:257`) ->
  stored on-chain in collectible object/event with byte-length cap.
- Product purchase CTA (to be added in Tea/Embroidery detail) ->
  `market::buy_listing<T>()`.
- Profile page holdings (`app/App.tsx:126`) ->
  derive from owned objects/events, replace localStorage count.
- Experience “Save” (`app/components/ExperiencePage.tsx:117`) ->
  keep off-chain bookmark (recommended V1), unless business requires paid on-chain collect.

## 9. Security / Risk Controls

- `paused` guard on all financial entries.
- Strict merchant ownership checks on listing/cancel.
- Listing state machine (`active -> sold/cancelled`) to avoid double-spend.
- Tribute size limits and UTF-8 sanitation off-chain.
- Price denomination explicit in minor unit; no floating-point.
- Reject buy with stale/inactive listing.
- Emit deterministic events for indexer reconciliation.

## 10. Suggested File Plan

- Create:
  - `sources/admin.move`
  - `sources/merchant.move`
  - `sources/catalog.move`
  - `sources/market.move`
  - `sources/collectible.move`
  - `sources/events.move`
- Modify:
  - `Move.toml` (add Sui dependency and named addresses)
- Tests:
  - `tests/admin_tests.move`
  - `tests/market_tests.move`
  - `tests/collectible_tests.move`
  - `tests/payment_mode_tests.move`

## 11. Milestones

1. **M1 (Core protocol)**: admin/config + merchant + listing + buy (USDC only).
2. **M2 (Collectible path)**: tea collectible mint + tribute event + profile query.
3. **M3 (Payment switch)**: add `lusd_type` registration + mode toggle + tests.
4. **M4 (SDK integration)**: frontend PTB with Cetus aggregator; StableLayer path behind flag.
5. **M5 (Hardening)**: failure-path tests, event indexer integration, gas profiling.

## 12. Official References

- Cetus Aggregator repo: https://github.com/CetusProtocol/aggregator
- Cetus aggregator SDK docs: https://cetus-1.gitbook.io/cetus-developer-docs/developer/cetus-aggregator/features-available
- Cetus SDK v2 repo: https://github.com/CetusProtocol/cetus-sdk-v2
- StableLayer docs: https://docs.stablelayer.site/
- StableLayer integrated guide: https://docs.stablelayer.site/integration/integrated-guide
- StableLayer SDK repo: https://github.com/StableLayer/stable-layer-sdk
