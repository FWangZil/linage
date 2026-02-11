#[test_only]
module linage::admin_tests;

use linage::admin;

#[test]
fun test_admin_config_updates() {
    let mut ctx = tx_context::dummy();
    let (cap, mut cfg) = admin::new_for_testing(@0xA, &mut ctx);

    assert!(!admin::stablelayer_enabled(&cfg), 0);
    assert!(!admin::is_paused(&cfg), 1);
    assert!(admin::platform_fee_bps(&cfg) == 250, 2);
    assert!(admin::treasury(&cfg) == @0xA, 3);

    admin::set_stablelayer_enabled(&cap, &mut cfg, true);
    admin::set_paused(&cap, &mut cfg, true);
    admin::set_platform_fee_bps(&cap, &mut cfg, 300);
    admin::set_treasury(&cap, &mut cfg, @0xB);

    assert!(admin::stablelayer_enabled(&cfg), 4);
    assert!(admin::is_paused(&cfg), 5);
    assert!(admin::platform_fee_bps(&cfg) == 300, 6);
    assert!(admin::treasury(&cfg) == @0xB, 7);

    admin::destroy_for_testing(cap, cfg);
}
