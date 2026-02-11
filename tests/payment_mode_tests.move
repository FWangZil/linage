#[test_only]
module linage::payment_mode_tests;

use linage::admin;

public struct FakeUsdc has drop, store {}
public struct FakeLusd has drop, store {}
public struct WrongToken has drop, store {}

#[test]
fun test_settlement_validation_follows_switch() {
    let mut ctx = tx_context::dummy();
    let (cap, mut cfg) = admin::new_for_testing(@0xA, &mut ctx);

    admin::register_usdc_type<FakeUsdc>(&cap, &mut cfg);
    admin::register_lusd_type<FakeLusd>(&cap, &mut cfg);

    admin::assert_settlement_token<FakeUsdc>(&cfg);
    admin::set_stablelayer_enabled(&cap, &mut cfg, true);
    admin::assert_settlement_token<FakeLusd>(&cfg);

    admin::destroy_for_testing(cap, cfg);
}

#[test, expected_failure(abort_code = 5, location = linage::admin)]
fun test_missing_usdc_type_registration_fails() {
    let mut ctx = tx_context::dummy();
    let (cap, cfg) = admin::new_for_testing(@0xA, &mut ctx);

    admin::assert_settlement_token<FakeUsdc>(&cfg);

    admin::destroy_for_testing(cap, cfg);
}

#[test, expected_failure(abort_code = 7, location = linage::admin)]
fun test_wrong_token_in_usdc_mode_fails() {
    let mut ctx = tx_context::dummy();
    let (cap, mut cfg) = admin::new_for_testing(@0xA, &mut ctx);

    admin::register_usdc_type<FakeUsdc>(&cap, &mut cfg);
    admin::assert_settlement_token<WrongToken>(&cfg);

    admin::destroy_for_testing(cap, cfg);
}

#[test, expected_failure(abort_code = 6, location = linage::admin)]
fun test_missing_lusd_type_registration_fails() {
    let mut ctx = tx_context::dummy();
    let (cap, mut cfg) = admin::new_for_testing(@0xA, &mut ctx);

    admin::register_usdc_type<FakeUsdc>(&cap, &mut cfg);
    admin::set_stablelayer_enabled(&cap, &mut cfg, true);
    admin::assert_settlement_token<FakeLusd>(&cfg);

    admin::destroy_for_testing(cap, cfg);
}
