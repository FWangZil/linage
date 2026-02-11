#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_ENV_FILE="${ROOT_DIR}/app/.env"

NETWORK="${SUI_NETWORK:-testnet}"
USDC_COIN_TYPE="${USDC_COIN_TYPE:-0x2::sui::SUI}"
DEFAULT_INPUT_COIN_TYPE="${DEFAULT_INPUT_COIN_TYPE:-0x2::sui::SUI}"
MINT_INPUT_AMOUNT="${MINT_INPUT_AMOUNT:-100000000}"
SWAP_SLIPPAGE="${SWAP_SLIPPAGE:-0.01}"
DEFAULT_PAYMENT_AMOUNT="${DEFAULT_PAYMENT_AMOUNT:-0.1}"
EMBROIDERY_ASK_AMOUNT="${EMBROIDERY_ASK_AMOUNT:-100000000}"
TEA_ASK_AMOUNT="${TEA_ASK_AMOUNT:-120000000}"
PUBLISH_GAS_BUDGET="${PUBLISH_GAS_BUDGET:-600000000}"
CALL_GAS_BUDGET="${CALL_GAS_BUDGET:-120000000}"

TMP_FILES=()

cleanup() {
  for f in "${TMP_FILES[@]}"; do
    if [[ -n "$f" && -f "$f" ]]; then
      rm -f "$f"
    fi
  done
}
trap cleanup EXIT

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

new_tmp() {
  local f
  f="$(mktemp)"
  TMP_FILES+=("$f")
  printf '%s' "$f"
}

run_json_cmd() {
  local out_json="$1"
  shift

  local raw_output
  raw_output="$(new_tmp)"

  if ! "$@" >"$raw_output" 2>&1; then
    cat "$raw_output" >&2
    return 1
  fi

  sed -n '/^{/,$p' "$raw_output" >"$out_json"
  if [[ ! -s "$out_json" ]]; then
    cat "$raw_output" >&2
    echo "Command did not return JSON output." >&2
    return 1
  fi

  if ! jq empty "$out_json" >/dev/null 2>&1; then
    cat "$raw_output" >&2
    echo "Command output is not valid JSON." >&2
    return 1
  fi
}

extract_object_id_by_type() {
  local json_file="$1"
  local object_type="$2"
  local object_id
  object_id="$(jq -r --arg t "$object_type" '
    (
      [(.objectChanges // [])[] | select(.objectType == $t and (.type == "created" or .type == "mutated")) | .objectId] +
      [(.changed_objects // [])[] | select(.objectType == $t and .idOperation == "CREATED") | .objectId]
    ) | .[0] // empty
  ' "$json_file")"
  if [[ -z "$object_id" || "$object_id" == "null" ]]; then
    echo "Failed to find object type ${object_type} in ${json_file}" >&2
    exit 1
  fi
  printf '%s' "$object_id"
}

extract_package_id() {
  local json_file="$1"
  local package_id
  package_id="$(jq -r '
    (
      [(.objectChanges // [])[] | select(.type == "published") | .packageId] +
      [(.changed_objects // [])[] | select(.objectType == "package" and .idOperation == "CREATED") | .objectId]
    ) | .[0] // empty
  ' "$json_file")"
  if [[ -z "$package_id" || "$package_id" == "null" ]]; then
    echo "Failed to extract published package ID from ${json_file}" >&2
    exit 1
  fi
  printf '%s' "$package_id"
}

mint_and_list() {
  local package_id="$1"
  local platform_config_id="$2"
  local marketplace_id="$3"
  local merchant_cap_id="$4"
  local sku="$5"
  local title="$6"
  local metadata_uri="$7"
  local category="$8"
  local ask_amount="$9"

  local mint_json list_json product_id listing_id
  mint_json="$(new_tmp)"
  list_json="$(new_tmp)"

  run_json_cmd "$mint_json" \
    sui client call \
    --package "$package_id" \
    --module merchant \
    --function mint_product \
    --args "$merchant_cap_id" "$sku" "$title" "$metadata_uri" "$category" true \
    --gas-budget "$CALL_GAS_BUDGET" \
    --json

  product_id="$(extract_object_id_by_type "$mint_json" "${package_id}::merchant::ProductNFT")"

  run_json_cmd "$list_json" \
    sui client call \
    --package "$package_id" \
    --module market \
    --function list_product \
    --args "$platform_config_id" "$marketplace_id" "$merchant_cap_id" "$product_id" "$ask_amount" \
    --gas-budget "$CALL_GAS_BUDGET" \
    --json

  listing_id="$(extract_object_id_by_type "$list_json" "${package_id}::market::Listing")"
  printf '%s' "$listing_id"
}

require_cmd sui
require_cmd jq

active_env="$(sui client active-env)"
if [[ "$active_env" != "$NETWORK" ]]; then
  echo "Switching Sui env from ${active_env} to ${NETWORK}"
  sui client switch --env "$NETWORK"
fi

active_address="$(sui client active-address)"
if [[ -z "$active_address" || "$active_address" == "null" ]]; then
  echo "No active Sui address found. Configure one via 'sui client new-address'." >&2
  exit 1
fi

gas_json="$(new_tmp)"
sui client gas --json >"$gas_json"
gas_count="$(jq 'length' "$gas_json")"
if [[ "$gas_count" -eq 0 ]]; then
  echo "Active address ${active_address} has no gas coins on ${NETWORK}." >&2
  exit 1
fi

echo "Running Move contract tests..."
(
  cd "$ROOT_DIR"
  sui move test
  sui move test --coverage
)

echo "Publishing Move package to ${NETWORK}..."
publish_json="$(new_tmp)"
if [[ -f "${ROOT_DIR}/Published.toml" ]]; then
  cp "${ROOT_DIR}/Published.toml" "${ROOT_DIR}/Published.toml.bak"
  rm -f "${ROOT_DIR}/Published.toml"
fi
(
  cd "$ROOT_DIR"
  run_json_cmd "$publish_json" \
    sui client publish --gas-budget "$PUBLISH_GAS_BUDGET" --json
)

PACKAGE_ID="$(extract_package_id "$publish_json")"
ADMIN_CAP_ID="$(extract_object_id_by_type "$publish_json" "${PACKAGE_ID}::admin::AdminCap")"
PLATFORM_CONFIG_ID="$(extract_object_id_by_type "$publish_json" "${PACKAGE_ID}::admin::PlatformConfig")"
MARKETPLACE_ID="$(extract_object_id_by_type "$publish_json" "${PACKAGE_ID}::market::Marketplace")"
MERCHANT_REGISTRY_ID="$(extract_object_id_by_type "$publish_json" "${PACKAGE_ID}::merchant::MerchantRegistry")"
COLLECTIBLE_REGISTRY_ID="$(extract_object_id_by_type "$publish_json" "${PACKAGE_ID}::collectible::CollectibleRegistry")"

echo "Registering settlement token type: ${USDC_COIN_TYPE}"
register_usdc_json="$(new_tmp)"
run_json_cmd "$register_usdc_json" \
  sui client call \
  --package "$PACKAGE_ID" \
  --module admin \
  --function register_usdc_type \
  --type-args "$USDC_COIN_TYPE" \
  --args "$ADMIN_CAP_ID" "$PLATFORM_CONFIG_ID" \
  --gas-budget "$CALL_GAS_BUDGET" \
  --json

echo "Registering merchant..."
merchant_call_json="$(new_tmp)"
run_json_cmd "$merchant_call_json" \
  sui client call \
  --package "$PACKAGE_ID" \
  --module merchant \
  --function register_merchant \
  --args "$MERCHANT_REGISTRY_ID" \
  --gas-budget "$CALL_GAS_BUDGET" \
  --json

MERCHANT_CAP_ID="$(extract_object_id_by_type "$merchant_call_json" "${PACKAGE_ID}::merchant::MerchantCap")"

echo "Minting and listing sample products..."
EMBROIDERY_LISTING_ID="$(
  mint_and_list \
    "$PACKAGE_ID" \
    "$PLATFORM_CONFIG_ID" \
    "$MARKETPLACE_ID" \
    "$MERCHANT_CAP_ID" \
    "1001" \
    "Suzhou Embroidery Kingfisher" \
    "https://linage.example/metadata/embroidery-1001.json" \
    "0" \
    "$EMBROIDERY_ASK_AMOUNT"
)"

TEA_LISTING_ID="$(
  mint_and_list \
    "$PACKAGE_ID" \
    "$PLATFORM_CONFIG_ID" \
    "$MARKETPLACE_ID" \
    "$MERCHANT_CAP_ID" \
    "2001" \
    "Biluochun Spring Tribute" \
    "https://linage.example/metadata/tea-2001.json" \
    "1" \
    "$TEA_ASK_AMOUNT"
)"

cat >"$APP_ENV_FILE" <<EOF
VITE_SUI_NETWORK=${NETWORK}

VITE_LINAGE_PACKAGE_ID=${PACKAGE_ID}
VITE_LINAGE_PLATFORM_CONFIG_ID=${PLATFORM_CONFIG_ID}
VITE_LINAGE_MARKETPLACE_ID=${MARKETPLACE_ID}
VITE_LINAGE_COLLECTIBLE_REGISTRY_ID=${COLLECTIBLE_REGISTRY_ID}

VITE_LINAGE_USDC_COIN_TYPE=${USDC_COIN_TYPE}
VITE_LINAGE_TEA_LISTING_ID=${TEA_LISTING_ID}
VITE_LINAGE_EMBROIDERY_LISTING_ID=${EMBROIDERY_LISTING_ID}

VITE_LINAGE_DEFAULT_INPUT_COIN_TYPE=${DEFAULT_INPUT_COIN_TYPE}
VITE_LINAGE_DEFAULT_MINT_INPUT_AMOUNT=${MINT_INPUT_AMOUNT}
VITE_LINAGE_DEFAULT_SWAP_SLIPPAGE=${SWAP_SLIPPAGE}
VITE_LINAGE_DEFAULT_PAYMENT_AMOUNT=${DEFAULT_PAYMENT_AMOUNT}
EOF

echo ""
echo "Deployment and seed completed."
echo "Active address: ${active_address}"
echo "Package ID: ${PACKAGE_ID}"
echo "PlatformConfig: ${PLATFORM_CONFIG_ID}"
echo "Marketplace: ${MARKETPLACE_ID}"
echo "CollectibleRegistry: ${COLLECTIBLE_REGISTRY_ID}"
echo "MerchantRegistry: ${MERCHANT_REGISTRY_ID}"
echo "AdminCap: ${ADMIN_CAP_ID}"
echo "MerchantCap: ${MERCHANT_CAP_ID}"
echo "Embroidery listing: ${EMBROIDERY_LISTING_ID}"
echo "Tea listing: ${TEA_LISTING_ID}"
echo "Wrote frontend config: ${APP_ENV_FILE}"
