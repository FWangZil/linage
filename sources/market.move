module linage::market;

use linage::admin;
use linage::merchant;
use sui::coin::{Self, Coin};
use sui::dynamic_object_field as dof;
use sui::event;

const BPS_DENOMINATOR: u64 = 10_000;

const E_INVALID_PRICE: u64 = 1;
const E_LISTING_INACTIVE: u64 = 2;
const E_MERCHANT_MISMATCH: u64 = 3;
const E_INSUFFICIENT_PAYMENT: u64 = 4;

public struct Marketplace has key {
    id: UID,
    next_listing_id: u64,
    active_listings: vector<ActiveListingRef>,
}

public struct ActiveListingRef has copy, drop, store {
    listing: ID,
    listing_id: u64,
    category: u8,
    merchant: address,
    merchant_id: u64,
    sku: u64,
    ask_amount: u64,
}

public struct Listing has key {
    id: UID,
    listing_id: u64,
    category: u8,
    merchant: address,
    merchant_id: u64,
    sku: u64,
    ask_amount: u64,
    active: bool,
}

public struct EscrowKey has copy, drop, store {}

public struct Listed has copy, drop {
    listing_id: u64,
    category: u8,
    merchant: address,
    merchant_id: u64,
    sku: u64,
    ask_amount: u64,
}

public struct Purchased has copy, drop {
    listing_id: u64,
    buyer: address,
    merchant: address,
    ask_amount: u64,
    platform_fee: u64,
}

public struct Cancelled has copy, drop {
    listing_id: u64,
    merchant: address,
}

fun init(ctx: &mut TxContext) {
    let market = Marketplace {
        id: object::new(ctx),
        next_listing_id: 1,
        active_listings: vector[],
    };
    transfer::share_object(market);
}

public fun list_product(
    cfg: &admin::PlatformConfig,
    market: &mut Marketplace,
    cap: &merchant::MerchantCap,
    product: merchant::ProductNFT,
    ask_amount: u64,
    ctx: &mut TxContext
) {
    merchant::assert_owner(cap, tx_context::sender(ctx));
    let listing = list_product_internal(cfg, market, cap, product, ask_amount, ctx);
    transfer::share_object(listing);
}

#[allow(lint(self_transfer))]
public fun cancel_listing(
    cfg: &admin::PlatformConfig,
    market: &mut Marketplace,
    cap: &merchant::MerchantCap,
    listing: &mut Listing,
    ctx: &mut TxContext
) {
    merchant::assert_owner(cap, tx_context::sender(ctx));
    let product = cancel_listing_internal(cfg, market, cap, listing);
    transfer::public_transfer(product, tx_context::sender(ctx));
}

#[allow(lint(self_transfer))]
public fun buy_listing_usdc<T>(
    cfg: &admin::PlatformConfig,
    market: &mut Marketplace,
    listing: &mut Listing,
    payment: Coin<T>,
    ctx: &mut TxContext
) {
    admin::assert_stablelayer_disabled(cfg);
    admin::assert_usdc_token<T>(cfg);
    let buyer = tx_context::sender(ctx);
    let product = buy_listing_internal(cfg, market, listing, payment, buyer, ctx);
    transfer::public_transfer(product, buyer);
}

#[allow(lint(self_transfer))]
public fun buy_listing_lusd<T>(
    cfg: &admin::PlatformConfig,
    market: &mut Marketplace,
    listing: &mut Listing,
    payment: Coin<T>,
    ctx: &mut TxContext
) {
    admin::assert_stablelayer_enabled(cfg);
    admin::assert_lusd_token<T>(cfg);
    let buyer = tx_context::sender(ctx);
    let product = buy_listing_internal(cfg, market, listing, payment, buyer, ctx);
    transfer::public_transfer(product, buyer);
}

public fun is_active(listing: &Listing): bool {
    listing.active
}

public fun ask_amount(listing: &Listing): u64 {
    listing.ask_amount
}

public(package) fun list_product_internal(
    cfg: &admin::PlatformConfig,
    market: &mut Marketplace,
    cap: &merchant::MerchantCap,
    product: merchant::ProductNFT,
    ask_amount: u64,
    ctx: &mut TxContext
): Listing {
    admin::assert_not_paused(cfg);
    assert!(ask_amount > 0, E_INVALID_PRICE);
    merchant::assert_product_listable(&product);
    assert!(merchant::product_merchant(&product) == merchant::owner(cap), E_MERCHANT_MISMATCH);

    let listing_id = market.next_listing_id;
    market.next_listing_id = listing_id + 1;
    let category = merchant::product_category(&product);

    let mut listing = Listing {
        id: object::new(ctx),
        listing_id,
        category,
        merchant: merchant::owner(cap),
        merchant_id: merchant::merchant_id(cap),
        sku: merchant::product_sku(&product),
        ask_amount,
        active: true,
    };
    let listing_object = object::id(&listing);

    dof::add(&mut listing.id, EscrowKey {}, product);
    vector::push_back(
        &mut market.active_listings,
        ActiveListingRef {
            listing: listing_object,
            listing_id,
            category,
            merchant: listing.merchant,
            merchant_id: listing.merchant_id,
            sku: listing.sku,
            ask_amount,
        },
    );

    event::emit(Listed {
        listing_id,
        category,
        merchant: listing.merchant,
        merchant_id: listing.merchant_id,
        sku: listing.sku,
        ask_amount,
    });
    listing
}

public(package) fun cancel_listing_internal(
    cfg: &admin::PlatformConfig,
    market: &mut Marketplace,
    cap: &merchant::MerchantCap,
    listing: &mut Listing
): merchant::ProductNFT {
    admin::assert_not_paused(cfg);
    assert!(listing.active, E_LISTING_INACTIVE);
    assert!(listing.merchant == merchant::owner(cap), E_MERCHANT_MISMATCH);

    let product = dof::remove<EscrowKey, merchant::ProductNFT>(&mut listing.id, EscrowKey {});
    listing.active = false;
    remove_active_listing_index(market, listing.listing_id);

    event::emit(Cancelled {
        listing_id: listing.listing_id,
        merchant: listing.merchant,
    });
    product
}

public(package) fun buy_listing_internal<T>(
    cfg: &admin::PlatformConfig,
    market: &mut Marketplace,
    listing: &mut Listing,
    mut payment: Coin<T>,
    buyer: address,
    ctx: &mut TxContext
): merchant::ProductNFT {
    admin::assert_not_paused(cfg);
    assert!(listing.active, E_LISTING_INACTIVE);

    let due = listing.ask_amount;
    let paid = coin::value(&payment);
    assert!(paid >= due, E_INSUFFICIENT_PAYMENT);

    let refund_amount = paid - due;
    if (refund_amount > 0) {
        let refund = coin::split(&mut payment, refund_amount, ctx);
        transfer::public_transfer(refund, buyer);
    };

    let fee_bps = admin::platform_fee_bps(cfg) as u64;
    let fee_amount = (due * fee_bps) / BPS_DENOMINATOR;
    if (fee_amount > 0) {
        let fee_coin = coin::split(&mut payment, fee_amount, ctx);
        transfer::public_transfer(fee_coin, admin::treasury(cfg));
    };
    transfer::public_transfer(payment, listing.merchant);

    let product = dof::remove<EscrowKey, merchant::ProductNFT>(&mut listing.id, EscrowKey {});
    listing.active = false;
    remove_active_listing_index(market, listing.listing_id);

    event::emit(Purchased {
        listing_id: listing.listing_id,
        buyer,
        merchant: listing.merchant,
        ask_amount: due,
        platform_fee: fee_amount,
    });
    product
}

fun remove_active_listing_index(market: &mut Marketplace, listing_id: u64) {
    let mut i = 0;
    let len = vector::length(&market.active_listings);
    while (i < len) {
        let entry = vector::borrow(&market.active_listings, i);
        if (entry.listing_id == listing_id) {
            vector::remove(&mut market.active_listings, i);
            return
        };
        i = i + 1;
    };
}

#[test_only]
public fun new_marketplace_for_testing(ctx: &mut TxContext): Marketplace {
    Marketplace {
        id: object::new(ctx),
        next_listing_id: 1,
        active_listings: vector[],
    }
}

#[test_only]
public fun listing_object_for_testing(listing: &Listing): ID {
    object::id(listing)
}

#[test_only]
public fun active_listing_count_for_testing(market: &Marketplace): u64 {
    vector::length(&market.active_listings)
}

#[test_only]
public fun active_listing_category_for_testing(market: &Marketplace, index: u64): u8 {
    let entry = vector::borrow(&market.active_listings, index);
    entry.category
}

#[test_only]
public fun active_listing_object_for_testing(market: &Marketplace, index: u64): ID {
    let entry = vector::borrow(&market.active_listings, index);
    entry.listing
}

#[test_only]
public fun take_escrowed_product_for_testing(listing: &mut Listing): merchant::ProductNFT {
    dof::remove<EscrowKey, merchant::ProductNFT>(&mut listing.id, EscrowKey {})
}

#[test_only]
public fun destroy_listing_for_testing(listing: Listing) {
    let Listing {
        id,
        listing_id: _,
        category: _,
        merchant: _,
        merchant_id: _,
        sku: _,
        ask_amount: _,
        active: _,
    } = listing;
    id.delete();
}

#[test_only]
public fun destroy_marketplace_for_testing(market: Marketplace) {
    let Marketplace {
        id,
        next_listing_id: _,
        active_listings: _,
    } = market;
    id.delete();
}
