module linage::merchant;

use std::string::String;
use sui::event;

const E_NOT_MERCHANT_OWNER: u64 = 1;
const E_PRODUCT_NOT_LISTABLE: u64 = 2;

public struct MerchantRegistry has key {
    id: UID,
    next_merchant_id: u64,
}

public struct MerchantCap has key {
    id: UID,
    owner: address,
    merchant_id: u64,
}

public struct ProductNFT has key, store {
    id: UID,
    merchant: address,
    merchant_id: u64,
    sku: u64,
    title: String,
    metadata_uri: String,
    category: u8,
    listable: bool,
}

public struct MerchantRegistered has copy, drop {
    owner: address,
    merchant_id: u64,
}

public struct ProductMinted has copy, drop {
    merchant: address,
    merchant_id: u64,
    sku: u64,
    category: u8,
    listable: bool,
}

fun init(ctx: &mut TxContext) {
    let registry = MerchantRegistry {
        id: object::new(ctx),
        next_merchant_id: 1,
    };
    transfer::share_object(registry);
}

public fun register_merchant(registry: &mut MerchantRegistry, ctx: &mut TxContext) {
    let cap = register_internal(registry, tx_context::sender(ctx), ctx);
    transfer::transfer(cap, tx_context::sender(ctx));
}

#[allow(lint(self_transfer))]
public fun mint_product(
    cap: &MerchantCap,
    sku: u64,
    title: String,
    metadata_uri: String,
    category: u8,
    listable: bool,
    ctx: &mut TxContext
) {
    assert_owner(cap, tx_context::sender(ctx));
    let product = mint_product_internal(cap, sku, title, metadata_uri, category, listable, ctx);
    transfer::public_transfer(product, tx_context::sender(ctx));
}

public fun set_product_listable(cap: &MerchantCap, product: &mut ProductNFT, listable: bool, ctx: &TxContext) {
    assert_owner(cap, tx_context::sender(ctx));
    assert!(product.merchant == cap.owner, E_NOT_MERCHANT_OWNER);
    product.listable = listable;
}

public fun assert_owner(cap: &MerchantCap, sender: address) {
    assert!(cap.owner == sender, E_NOT_MERCHANT_OWNER);
}

public fun assert_product_listable(product: &ProductNFT) {
    assert!(product.listable, E_PRODUCT_NOT_LISTABLE);
}

public fun owner(cap: &MerchantCap): address {
    cap.owner
}

public fun merchant_id(cap: &MerchantCap): u64 {
    cap.merchant_id
}

public fun product_merchant(product: &ProductNFT): address {
    product.merchant
}

public fun product_merchant_id(product: &ProductNFT): u64 {
    product.merchant_id
}

public fun product_sku(product: &ProductNFT): u64 {
    product.sku
}

public fun product_is_listable(product: &ProductNFT): bool {
    product.listable
}

public(package) fun mint_product_internal(
    cap: &MerchantCap,
    sku: u64,
    title: String,
    metadata_uri: String,
    category: u8,
    listable: bool,
    ctx: &mut TxContext
): ProductNFT {
    let product = ProductNFT {
        id: object::new(ctx),
        merchant: cap.owner,
        merchant_id: cap.merchant_id,
        sku,
        title,
        metadata_uri,
        category,
        listable,
    };

    event::emit(ProductMinted {
        merchant: cap.owner,
        merchant_id: cap.merchant_id,
        sku,
        category,
        listable,
    });
    product
}

fun register_internal(registry: &mut MerchantRegistry, owner: address, ctx: &mut TxContext): MerchantCap {
    let merchant_id = registry.next_merchant_id;
    registry.next_merchant_id = merchant_id + 1;

    let cap = MerchantCap {
        id: object::new(ctx),
        owner,
        merchant_id,
    };

    event::emit(MerchantRegistered { owner, merchant_id });
    cap
}

#[test_only]
public fun new_registry_for_testing(ctx: &mut TxContext): MerchantRegistry {
    MerchantRegistry {
        id: object::new(ctx),
        next_merchant_id: 1,
    }
}

#[test_only]
public fun register_for_testing(registry: &mut MerchantRegistry, owner: address, ctx: &mut TxContext): MerchantCap {
    register_internal(registry, owner, ctx)
}

#[test_only]
public fun mint_product_for_testing(
    cap: &MerchantCap,
    sku: u64,
    title: String,
    metadata_uri: String,
    category: u8,
    listable: bool,
    ctx: &mut TxContext
): ProductNFT {
    mint_product_internal(cap, sku, title, metadata_uri, category, listable, ctx)
}

#[test_only]
public fun destroy_registry_for_testing(registry: MerchantRegistry) {
    let MerchantRegistry {
        id,
        next_merchant_id: _,
    } = registry;
    id.delete();
}

#[test_only]
public fun destroy_cap_for_testing(cap: MerchantCap) {
    let MerchantCap {
        id,
        owner: _,
        merchant_id: _,
    } = cap;
    id.delete();
}

#[test_only]
public fun destroy_product_for_testing(product: ProductNFT) {
    let ProductNFT {
        id,
        merchant: _,
        merchant_id: _,
        sku: _,
        title: _,
        metadata_uri: _,
        category: _,
        listable: _,
    } = product;
    id.delete();
}
