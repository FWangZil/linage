#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_ENV_FILE="${ROOT_DIR}/app/.env"

NETWORK="${SUI_NETWORK:-testnet}"
TARGET_ASK_AMOUNT="${TARGET_ASK_AMOUNT:-100000}" # 0.1 USDC (6 decimals)
CALL_GAS_BUDGET="${CALL_GAS_BUDGET:-120000000}"
CATEGORY_FILTER="${CATEGORY_FILTER:-}" # optional: 0 or 1

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_cmd sui
require_cmd jq

env_or_file() {
  local var_name="$1"
  local default="${2:-}"
  local env_value="${!var_name:-}"
  if [[ -n "$env_value" ]]; then
    printf '%s' "$env_value"
    return
  fi
  if [[ -f "$APP_ENV_FILE" ]]; then
    local from_file
    from_file="$(grep -E "^${var_name}=" "$APP_ENV_FILE" | tail -n 1 | cut -d'=' -f2- || true)"
    if [[ -n "$from_file" ]]; then
      printf '%s' "$from_file"
      return
    fi
  fi
  printf '%s' "$default"
}

PACKAGE_ID="$(env_or_file VITE_LINAGE_PACKAGE_ID)"
PLATFORM_CONFIG_ID="$(env_or_file VITE_LINAGE_PLATFORM_CONFIG_ID)"
MARKETPLACE_ID="$(env_or_file VITE_LINAGE_MARKETPLACE_ID)"

if [[ -z "$PACKAGE_ID" || -z "$PLATFORM_CONFIG_ID" || -z "$MARKETPLACE_ID" ]]; then
  echo "Missing package/platform/marketplace IDs. Set env vars or app/.env first." >&2
  exit 1
fi

active_env="$(sui client active-env)"
if [[ "$active_env" != "$NETWORK" ]]; then
  echo "Switching Sui env from ${active_env} to ${NETWORK}"
  sui client switch --env "$NETWORK" >/dev/null
fi

ACTIVE_ADDRESS="$(sui client active-address)"
if [[ -z "$ACTIVE_ADDRESS" || "$ACTIVE_ADDRESS" == "null" ]]; then
  echo "No active Sui address." >&2
  exit 1
fi

tmp_objects="$(mktemp)"
tmp_market="$(mktemp)"
trap 'rm -f "$tmp_objects" "$tmp_market"' EXIT

sui client objects "$ACTIVE_ADDRESS" --json >"$tmp_objects"
MERCHANT_CAP_ID="$(
  jq -r --arg t "${PACKAGE_ID}::merchant::MerchantCap" '
    [.[]
      | select(.data.type == $t)
      | .data.objectId
    ] | .[0] // empty
  ' "$tmp_objects"
)"

if [[ -z "$MERCHANT_CAP_ID" ]]; then
  echo "No MerchantCap found for package ${PACKAGE_ID} on ${ACTIVE_ADDRESS}." >&2
  exit 1
fi

sui client object "$MARKETPLACE_ID" --json >"$tmp_market"

if [[ -n "$CATEGORY_FILTER" ]]; then
  LISTINGS_QUERY='
    .content.fields.active_listings[]?.fields
    | select(.merchant == $owner)
    | select((.category | tonumber) == $category)
    | {
        listing: .listing,
        listing_id: (.listing_id | tostring),
        category: (.category | tonumber),
        ask_amount: (.ask_amount | tonumber),
        sku: (.sku | tostring)
      }
  '
  TOTAL_LISTINGS="$(
    jq -r --arg owner "$ACTIVE_ADDRESS" --argjson category "$CATEGORY_FILTER" "[${LISTINGS_QUERY}] | length" "$tmp_market"
  )"
else
  LISTINGS_QUERY='
    .content.fields.active_listings[]?.fields
    | select(.merchant == $owner)
    | {
        listing: .listing,
        listing_id: (.listing_id | tostring),
        category: (.category | tonumber),
        ask_amount: (.ask_amount | tonumber),
        sku: (.sku | tostring)
      }
  '
  TOTAL_LISTINGS="$(
    jq -r --arg owner "$ACTIVE_ADDRESS" "[${LISTINGS_QUERY}] | length" "$tmp_market"
  )"
fi

if [[ "$TOTAL_LISTINGS" -eq 0 ]]; then
  echo "No active listings found for ${ACTIVE_ADDRESS}."
  exit 0
fi

echo "Found ${TOTAL_LISTINGS} active listings for ${ACTIVE_ADDRESS}. Target ask amount: ${TARGET_ASK_AMOUNT}"

updated=0
skipped=0

if [[ -n "$CATEGORY_FILTER" ]]; then
  ROWS_CMD=(jq -c --arg owner "$ACTIVE_ADDRESS" --argjson category "$CATEGORY_FILTER" "$LISTINGS_QUERY" "$tmp_market")
else
  ROWS_CMD=(jq -c --arg owner "$ACTIVE_ADDRESS" "$LISTINGS_QUERY" "$tmp_market")
fi

while IFS= read -r row; do
  if [[ -z "$row" ]]; then
    continue
  fi

  listing_object_id="$(jq -r '.listing' <<<"$row")"
  listing_id="$(jq -r '.listing_id' <<<"$row")"
  category="$(jq -r '.category' <<<"$row")"
  old_ask="$(jq -r '.ask_amount' <<<"$row")"
  sku="$(jq -r '.sku' <<<"$row")"

  if [[ "$old_ask" == "$TARGET_ASK_AMOUNT" ]]; then
    echo "Skip listing_id=${listing_id} sku=${sku} (already ${old_ask})"
    skipped=$((skipped + 1))
    continue
  fi

  echo "Repricing listing_id=${listing_id} sku=${sku} category=${category}: ${old_ask} -> ${TARGET_ASK_AMOUNT}"

  df_json="$(mktemp)"
  cancel_json="$(mktemp)"
  list_json="$(mktemp)"
  trap 'rm -f "$tmp_objects" "$tmp_market" "$df_json" "$cancel_json" "$list_json"' EXIT

  sui client dynamic-field "$listing_object_id" --json >"$df_json"
  product_id="$(
    jq -r --arg t "${PACKAGE_ID}::merchant::ProductNFT" '
      [(.data // [])[] | select(.objectType == $t) | .objectId] | .[0] // empty
    ' "$df_json"
  )"
  if [[ -z "$product_id" ]]; then
    echo "Failed to detect escrowed ProductNFT from listing_id=${listing_id}" >&2
    exit 1
  fi

  sui client call \
    --package "$PACKAGE_ID" \
    --module market \
    --function cancel_listing \
    --args "$PLATFORM_CONFIG_ID" "$MARKETPLACE_ID" "$MERCHANT_CAP_ID" "$listing_object_id" \
    --gas-budget "$CALL_GAS_BUDGET" \
    --json >"$cancel_json"

  sui client call \
    --package "$PACKAGE_ID" \
    --module market \
    --function list_product \
    --args "$PLATFORM_CONFIG_ID" "$MARKETPLACE_ID" "$MERCHANT_CAP_ID" "$product_id" "$TARGET_ASK_AMOUNT" \
    --gas-budget "$CALL_GAS_BUDGET" \
    --json >"$list_json"

  new_listing_id="$(
    jq -r --arg t "${PACKAGE_ID}::market::Listing" '
      (
        [(.objectChanges // [])[] | select(.objectType == $t and .type == "created") | .objectId] +
        [(.changed_objects // [])[] | select(.objectType == $t and .idOperation == "CREATED") | .objectId]
      ) | .[0] // empty
    ' "$list_json"
  )"
  echo "  -> relisted as ${new_listing_id:-<unknown>}"

  rm -f "$df_json" "$cancel_json" "$list_json"
  updated=$((updated + 1))
done < <("${ROWS_CMD[@]}")

echo ""
echo "Done. Updated=${updated}, skipped=${skipped}, total=${TOTAL_LISTINGS}"
