module linage::admin;

use sui::event;

const BPS_DENOMINATOR: u64 = 10_000;

const E_INVALID_FEE_BPS: u64 = 1;
const E_PLATFORM_PAUSED: u64 = 2;
const E_STABLELAYER_DISABLED: u64 = 3;
const E_STABLELAYER_ENABLED: u64 = 4;
const E_USDC_TYPE_NOT_SET: u64 = 5;
const E_LUSD_TYPE_NOT_SET: u64 = 6;
const E_INVALID_SETTLEMENT_TOKEN: u64 = 7;

public struct AdminCap has key {
    id: UID,
}

public struct PlatformConfig has key {
    id: UID,
    stablelayer_enabled: bool,
    paused: bool,
    platform_fee_bps: u16,
    treasury: address,
    usdc_type: option::Option<std::type_name::TypeName>,
    lusd_type: option::Option<std::type_name::TypeName>,
}

public struct ConfigUpdated has copy, drop {
    stablelayer_enabled: bool,
    paused: bool,
    platform_fee_bps: u16,
    treasury: address,
}

fun init(ctx: &mut TxContext) {
    let sender = tx_context::sender(ctx);
    let cap = AdminCap { id: object::new(ctx) };
    let cfg = PlatformConfig {
        id: object::new(ctx),
        stablelayer_enabled: false,
        paused: false,
        platform_fee_bps: 250,
        treasury: sender,
        usdc_type: option::none(),
        lusd_type: option::none(),
    };

    transfer::transfer(cap, sender);
    transfer::share_object(cfg);
}

public fun set_stablelayer_enabled(_cap: &AdminCap, cfg: &mut PlatformConfig, enabled: bool) {
    cfg.stablelayer_enabled = enabled;
    emit_update(cfg);
}

public fun set_paused(_cap: &AdminCap, cfg: &mut PlatformConfig, paused: bool) {
    cfg.paused = paused;
    emit_update(cfg);
}

public fun set_platform_fee_bps(_cap: &AdminCap, cfg: &mut PlatformConfig, fee_bps: u16) {
    assert!((fee_bps as u64) <= BPS_DENOMINATOR, E_INVALID_FEE_BPS);
    cfg.platform_fee_bps = fee_bps;
    emit_update(cfg);
}

public fun set_treasury(_cap: &AdminCap, cfg: &mut PlatformConfig, treasury: address) {
    cfg.treasury = treasury;
    emit_update(cfg);
}

public fun register_usdc_type<T>(_cap: &AdminCap, cfg: &mut PlatformConfig) {
    cfg.usdc_type = option::some(std::type_name::with_defining_ids<T>());
}

public fun register_lusd_type<T>(_cap: &AdminCap, cfg: &mut PlatformConfig) {
    cfg.lusd_type = option::some(std::type_name::with_defining_ids<T>());
}

public fun assert_not_paused(cfg: &PlatformConfig) {
    assert!(!cfg.paused, E_PLATFORM_PAUSED);
}

public fun assert_stablelayer_enabled(cfg: &PlatformConfig) {
    assert!(cfg.stablelayer_enabled, E_STABLELAYER_DISABLED);
}

public fun assert_stablelayer_disabled(cfg: &PlatformConfig) {
    assert!(!cfg.stablelayer_enabled, E_STABLELAYER_ENABLED);
}

public fun assert_usdc_token<T>(cfg: &PlatformConfig) {
    assert!(option::is_some(&cfg.usdc_type), E_USDC_TYPE_NOT_SET);
    let token = std::type_name::with_defining_ids<T>();
    assert!(token == *option::borrow(&cfg.usdc_type), E_INVALID_SETTLEMENT_TOKEN);
}

public fun assert_lusd_token<T>(cfg: &PlatformConfig) {
    assert!(option::is_some(&cfg.lusd_type), E_LUSD_TYPE_NOT_SET);
    let token = std::type_name::with_defining_ids<T>();
    assert!(token == *option::borrow(&cfg.lusd_type), E_INVALID_SETTLEMENT_TOKEN);
}

public fun assert_settlement_token<T>(cfg: &PlatformConfig) {
    if (cfg.stablelayer_enabled) {
        assert_lusd_token<T>(cfg);
    } else {
        assert_usdc_token<T>(cfg);
    }
}

public fun stablelayer_enabled(cfg: &PlatformConfig): bool {
    cfg.stablelayer_enabled
}

public fun is_paused(cfg: &PlatformConfig): bool {
    cfg.paused
}

public fun platform_fee_bps(cfg: &PlatformConfig): u16 {
    cfg.platform_fee_bps
}

public fun treasury(cfg: &PlatformConfig): address {
    cfg.treasury
}

fun emit_update(cfg: &PlatformConfig) {
    event::emit(ConfigUpdated {
        stablelayer_enabled: cfg.stablelayer_enabled,
        paused: cfg.paused,
        platform_fee_bps: cfg.platform_fee_bps,
        treasury: cfg.treasury,
    });
}

#[test_only]
public fun new_for_testing(treasury: address, ctx: &mut TxContext): (AdminCap, PlatformConfig) {
    let cap = AdminCap { id: object::new(ctx) };
    let cfg = PlatformConfig {
        id: object::new(ctx),
        stablelayer_enabled: false,
        paused: false,
        platform_fee_bps: 250,
        treasury,
        usdc_type: option::none(),
        lusd_type: option::none(),
    };
    (cap, cfg)
}

#[test_only]
public fun destroy_for_testing(cap: AdminCap, cfg: PlatformConfig) {
    let AdminCap { id: cap_id } = cap;
    cap_id.delete();

    let PlatformConfig {
        id,
        stablelayer_enabled: _,
        paused: _,
        platform_fee_bps: _,
        treasury: _,
        usdc_type: _,
        lusd_type: _,
    } = cfg;
    id.delete();
}
