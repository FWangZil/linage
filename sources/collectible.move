module linage::collectible;

use std::string::{Self as string, String};
use linage::admin;
use sui::coin::{Self, Coin};
use sui::event;

const E_INVALID_MINT_PRICE: u64 = 1;
const E_TRIBUTE_TOO_LONG: u64 = 2;
const E_EMPTY_ITEM_CODE: u64 = 3;
const E_INSUFFICIENT_PAYMENT: u64 = 4;

const MAX_TRIBUTE_BYTES: u64 = 280;

public struct CollectibleRegistry has key {
    id: UID,
    next_collectible_id: u64,
    mint_price: u64,
}

public struct HeritageCollectible has key, store {
    id: UID,
    collectible_id: u64,
    owner: address,
    item_code: String,
    tribute: String,
}

public struct CollectibleMinted has copy, drop {
    collectible_id: u64,
    owner: address,
    item_code_len: u64,
}

fun init(ctx: &mut TxContext) {
    let registry = CollectibleRegistry {
        id: object::new(ctx),
        next_collectible_id: 1,
        mint_price: 1_000_000,
    };
    transfer::share_object(registry);
}

public fun set_mint_price(_cap: &admin::AdminCap, registry: &mut CollectibleRegistry, mint_price: u64) {
    assert!(mint_price > 0, E_INVALID_MINT_PRICE);
    registry.mint_price = mint_price;
}

#[allow(lint(self_transfer))]
public fun mint_collectible_usdc<T>(
    cfg: &admin::PlatformConfig,
    registry: &mut CollectibleRegistry,
    item_code: String,
    tribute: String,
    payment: Coin<T>,
    ctx: &mut TxContext
) {
    admin::assert_stablelayer_disabled(cfg);
    admin::assert_usdc_token<T>(cfg);
    let owner = tx_context::sender(ctx);
    let collectible = mint_with_payment(cfg, registry, item_code, tribute, payment, owner, ctx);
    transfer::public_transfer(collectible, owner);
}

#[allow(lint(self_transfer))]
public fun mint_collectible_lusd<T>(
    cfg: &admin::PlatformConfig,
    registry: &mut CollectibleRegistry,
    item_code: String,
    tribute: String,
    payment: Coin<T>,
    ctx: &mut TxContext
) {
    admin::assert_stablelayer_enabled(cfg);
    admin::assert_lusd_token<T>(cfg);
    let owner = tx_context::sender(ctx);
    let collectible = mint_with_payment(cfg, registry, item_code, tribute, payment, owner, ctx);
    transfer::public_transfer(collectible, owner);
}

public fun collectible_id(collectible: &HeritageCollectible): u64 {
    collectible.collectible_id
}

public fun registry_next_id(registry: &CollectibleRegistry): u64 {
    registry.next_collectible_id
}

fun mint_with_payment<T>(
    cfg: &admin::PlatformConfig,
    registry: &mut CollectibleRegistry,
    item_code: String,
    tribute: String,
    mut payment: Coin<T>,
    owner: address,
    ctx: &mut TxContext
): HeritageCollectible {
    admin::assert_not_paused(cfg);
    assert_valid_mint_input(&item_code, &tribute);

    let due = registry.mint_price;
    let paid = coin::value(&payment);
    assert!(paid >= due, E_INSUFFICIENT_PAYMENT);

    let refund_amount = paid - due;
    if (refund_amount > 0) {
        let refund = coin::split(&mut payment, refund_amount, ctx);
        transfer::public_transfer(refund, owner);
    };

    transfer::public_transfer(payment, admin::treasury(cfg));
    mint_internal(registry, item_code, tribute, owner, ctx)
}

fun assert_valid_mint_input(item_code: &String, tribute: &String) {
    let item_code_len = vector::length(string::as_bytes(item_code));
    assert!(item_code_len > 0, E_EMPTY_ITEM_CODE);

    let tribute_len = vector::length(string::as_bytes(tribute));
    assert!(tribute_len <= MAX_TRIBUTE_BYTES, E_TRIBUTE_TOO_LONG);
}

fun mint_internal(
    registry: &mut CollectibleRegistry,
    item_code: String,
    tribute: String,
    owner: address,
    ctx: &mut TxContext
): HeritageCollectible {
    let collectible_id = registry.next_collectible_id;
    registry.next_collectible_id = collectible_id + 1;

    event::emit(CollectibleMinted {
        collectible_id,
        owner,
        item_code_len: vector::length(string::as_bytes(&item_code)),
    });

    HeritageCollectible {
        id: object::new(ctx),
        collectible_id,
        owner,
        item_code,
        tribute,
    }
}

#[test_only]
public fun new_registry_for_testing(mint_price: u64, ctx: &mut TxContext): CollectibleRegistry {
    assert!(mint_price > 0, E_INVALID_MINT_PRICE);
    CollectibleRegistry {
        id: object::new(ctx),
        next_collectible_id: 1,
        mint_price,
    }
}

#[test_only]
public fun mint_for_testing<T>(
    cfg: &admin::PlatformConfig,
    registry: &mut CollectibleRegistry,
    item_code: String,
    tribute: String,
    owner: address,
    ctx: &mut TxContext
): HeritageCollectible {
    admin::assert_settlement_token<T>(cfg);
    admin::assert_not_paused(cfg);
    assert_valid_mint_input(&item_code, &tribute);
    mint_internal(registry, item_code, tribute, owner, ctx)
}

#[test_only]
public fun destroy_collectible_for_testing(collectible: HeritageCollectible) {
    let HeritageCollectible {
        id,
        collectible_id: _,
        owner: _,
        item_code: _,
        tribute: _,
    } = collectible;
    id.delete();
}

#[test_only]
public fun destroy_registry_for_testing(registry: CollectibleRegistry) {
    let CollectibleRegistry {
        id,
        next_collectible_id: _,
        mint_price: _,
    } = registry;
    id.delete();
}
