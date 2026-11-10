#!/usr/bin/env bash
# 모든 컨트랙트 wasm 빌드. vault를 먼저 빌드해 contracts/res/에 복사한 뒤 envelope을 빌드한다.
set -euo pipefail
cd "$(dirname "$0")/../contracts"

build() {
  cargo near build non-reproducible-wasm --no-abi --manifest-path "$1/Cargo.toml"
}

build vault
cp target/near/vault/vault.wasm res/vault.wasm
build envelope
build mock-ft

ls -lh res/vault.wasm target/near/envelope/envelope.wasm target/near/mock_ft/mock_ft.wasm
