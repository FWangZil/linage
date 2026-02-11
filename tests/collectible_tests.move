#[test_only]
module linage::collectible_tests;

use std::string;
use linage::admin;
use linage::collectible;

public struct FakeUsdc has drop, store {}
public struct FakeLusd has drop, store {}
public struct WrongToken has drop, store {}

#[test]
fun test_collectible_mint_tracks_ids() {
    let mut ctx = tx_context::dummy();
    let (cap, mut cfg) = admin::new_for_testing(@0xA, &mut ctx);
    admin::register_usdc_type<FakeUsdc>(&cap, &mut cfg);

    let mut registry = collectible::new_registry_for_testing(1_000, &mut ctx);
    let c1 = collectible::mint_for_testing<FakeUsdc>(
        &cfg,
        &mut registry,
        string::utf8(b"bi-luo-chun"),
        string::utf8(b"For the tea masters."),
        @0xB,
        &mut ctx
    );
    let c2 = collectible::mint_for_testing<FakeUsdc>(
        &cfg,
        &mut registry,
        string::utf8(b"long-jing"),
        string::utf8(b"A second tribute."),
        @0xC,
        &mut ctx
    );

    assert!(collectible::collectible_id(&c1) == 1, 0);
    assert!(collectible::collectible_id(&c2) == 2, 1);
    assert!(collectible::registry_next_id(&registry) == 3, 2);

    collectible::destroy_collectible_for_testing(c1);
    collectible::destroy_collectible_for_testing(c2);
    collectible::destroy_registry_for_testing(registry);
    admin::destroy_for_testing(cap, cfg);
}

#[test, expected_failure(abort_code = 7, location = linage::admin)]
fun test_collectible_wrong_token_fails() {
    let mut ctx = tx_context::dummy();
    let (cap, mut cfg) = admin::new_for_testing(@0xA, &mut ctx);
    admin::register_usdc_type<FakeUsdc>(&cap, &mut cfg);
    let mut registry = collectible::new_registry_for_testing(1_000, &mut ctx);

    let collectible_obj = collectible::mint_for_testing<WrongToken>(
        &cfg,
        &mut registry,
        string::utf8(b"bi-luo-chun"),
        string::utf8(b"token mismatch"),
        @0xB,
        &mut ctx
    );

    collectible::destroy_collectible_for_testing(collectible_obj);
    collectible::destroy_registry_for_testing(registry);
    admin::destroy_for_testing(cap, cfg);
}

#[test, expected_failure(abort_code = 2, location = linage::collectible)]
fun test_collectible_tribute_too_long_fails() {
    let mut ctx = tx_context::dummy();
    let (cap, mut cfg) = admin::new_for_testing(@0xA, &mut ctx);
    admin::register_usdc_type<FakeUsdc>(&cap, &mut cfg);
    let mut registry = collectible::new_registry_for_testing(1_000, &mut ctx);

    let long_tribute = string::utf8(
        b"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    );
    let collectible_obj = collectible::mint_for_testing<FakeUsdc>(
        &cfg,
        &mut registry,
        string::utf8(b"bi-luo-chun"),
        long_tribute,
        @0xB,
        &mut ctx
    );

    collectible::destroy_collectible_for_testing(collectible_obj);
    collectible::destroy_registry_for_testing(registry);
    admin::destroy_for_testing(cap, cfg);
}

#[test]
fun test_collectible_switch_to_lusd() {
    let mut ctx = tx_context::dummy();
    let (cap, mut cfg) = admin::new_for_testing(@0xA, &mut ctx);
    admin::register_usdc_type<FakeUsdc>(&cap, &mut cfg);
    admin::register_lusd_type<FakeLusd>(&cap, &mut cfg);
    admin::set_stablelayer_enabled(&cap, &mut cfg, true);

    let mut registry = collectible::new_registry_for_testing(1_000, &mut ctx);
    let c = collectible::mint_for_testing<FakeLusd>(
        &cfg,
        &mut registry,
        string::utf8(b"bi-luo-chun"),
        string::utf8(b"stable path"),
        @0xB,
        &mut ctx
    );
    assert!(collectible::collectible_id(&c) == 1, 0);

    collectible::destroy_collectible_for_testing(c);
    collectible::destroy_registry_for_testing(registry);
    admin::destroy_for_testing(cap, cfg);
}
