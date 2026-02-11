#[test_only]
module linage::market_tests;

use std::string;
use linage::admin;
use linage::market;
use linage::merchant;

#[test]
fun test_list_and_cancel_lifecycle() {
    let mut ctx = tx_context::dummy();

    let (admin_cap, cfg) = admin::new_for_testing(@0xA, &mut ctx);
    let mut registry = merchant::new_registry_for_testing(&mut ctx);
    let mut marketplace = market::new_marketplace_for_testing(&mut ctx);
    let merchant_cap = merchant::register_for_testing(&mut registry, @0xB, &mut ctx);

    let product = merchant::mint_product_for_testing(
        &merchant_cap,
        1001,
        string::utf8(b"Su Embroidery"),
        string::utf8(b"https://linage.example/metadata/1001"),
        0,
        true,
        &mut ctx
    );

    let mut listing = market::list_product_internal(
        &cfg,
        &mut marketplace,
        &merchant_cap,
        product,
        1_000_000,
        &mut ctx
    );
    assert!(market::is_active(&listing), 0);
    assert!(market::ask_amount(&listing) == 1_000_000, 1);
    assert!(market::active_listing_count_for_testing(&marketplace) == 1, 2);
    assert!(
        market::active_listing_category_for_testing(&marketplace, 0) == 0,
        3
    );
    assert!(
        market::active_listing_object_for_testing(&marketplace, 0)
            == market::listing_object_for_testing(&listing),
        4
    );

    let recovered = market::cancel_listing_internal(&cfg, &mut marketplace, &merchant_cap, &mut listing);
    assert!(!market::is_active(&listing), 5);
    assert!(market::active_listing_count_for_testing(&marketplace) == 0, 6);

    merchant::destroy_product_for_testing(recovered);
    market::destroy_listing_for_testing(listing);
    merchant::destroy_cap_for_testing(merchant_cap);
    market::destroy_marketplace_for_testing(marketplace);
    merchant::destroy_registry_for_testing(registry);
    admin::destroy_for_testing(admin_cap, cfg);
}
