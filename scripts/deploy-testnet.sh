#!/usr/bin/env bash
# 테스트넷 배포. near-cli-rs(`near`) 필요, 계정 키는 keychain에 있어야 한다.
#   ./scripts/deploy-testnet.sh <nft-account>          예: harry-envelope.testnet
#   ./scripts/deploy-testnet.sh <nft-account> --with-ft  Mock USDC를 usdc.<nft-account>에 함께 배포
# 스테이징(nearenvelope.testnet)은 D만, main 기준으로 배포한다.
set -euo pipefail
cd "$(dirname "$0")/.."

ACCOUNT="${1:?usage: deploy-testnet.sh <nft-account> [--with-ft]}"
NET="network-config testnet"
WASM=contracts/target/near

./scripts/build-contracts.sh

near contract deploy "$ACCOUNT" use-file "$WASM/envelope/envelope.wasm" \
  with-init-call new json-args "{\"owner_id\":\"$ACCOUNT\"}" \
  prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' \
  $NET sign-with-keychain send

if [[ "${2:-}" == "--with-ft" ]]; then
  FT="usdc.$ACCOUNT"
  near account create-account fund-myself "$FT" '3 NEAR' autogenerate-new-keypair save-to-keychain \
    sign-as "$ACCOUNT" $NET sign-with-keychain send
  near contract deploy "$FT" use-file "$WASM/mock_ft/mock_ft.wasm" \
    with-init-call new json-args '{}' prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' \
    $NET sign-with-keychain send
fi

echo "Deployed. frontend/.env.local: NEXT_PUBLIC_NFT_CONTRACT_ID=$ACCOUNT"
