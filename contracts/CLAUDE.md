# contracts/ 지침

루트 `CLAUDE.md`와 `docs/INTERFACE.md`를 먼저 읽는다. 여기는 컨트랙트 영역에만 해당하는 규칙이다.

## 크레이트

| 크레이트 | 역할 | 소유 |
|---|---|---|
| `envelope` | NEP-171 NFT + Vault 부모 계정 | 파일별로 A/B (아래) |
| `vault` | 하위 계정에 배포되는 금고 | A |
| `mock-ft` | 테스트넷 Mock USDC (+ `faucet`) | B |
| `integration-tests` | near-workspaces 시나리오 | B (A는 자기 기능 테스트를 별도 파일로 추가) |

`envelope/src` 파일 소유: A = `lib.rs`, `nft_core.rs`, `mint.rs`, `vault_ops.rs` / B = `gift.rs`, `enhance.rs`, `mission.rs`, `views.rs`, `events.rs` / 공유 = `types.rs`

## 모듈 간 내부 계약 (A ↔ B)

서로의 파일을 고치지 않고 협업하기 위해 아래 `pub(crate)` 함수의 **시그니처를 고정**한다. 바꾸려면 A·B가 합의하고 같은 PR에서 함께 바꾼다.

| 함수 | 위치(구현) | 호출하는 곳 |
|---|---|---|
| `Contract::vault_id(&TokenId) -> AccountId` | lib.rs (A) | 전체 |
| `owner_of`, `assert_owner`, `envelope`, `envelope_mut`, `now_ms` | lib.rs (A) | 전체 |
| `on_envelope_transferred(&TokenId, from, to, message)` | gift.rs (B) | nft_core.rs (A), gift.rs |
| `grant_mission(&TokenId, MissionId) -> bool` | mission.rs (B) | mint.rs, vault_ops.rs (A), gift.rs (B) |
| `refresh_token_metadata(&TokenId)` | enhance.rs (B) | mint.rs (A), enhance.rs |
| `events::emit(event, data)` | events.rs (B) | 전체 |

아직 구현되지 않은 함수는 `todo!("담당: ...")`로 남아 있다. 의존하는 쪽은 상대가 구현할 때까지 단위 테스트에서 해당 경로를 피하거나, 먼저 구현해 달라고 요청한다.

## 코딩 규칙

- near-sdk 5.x 스타일: `#[near(contract_state)]`, `#[near] impl`, `#[near(serializers = [...])]`. `near_bindgen` 등 구 매크로 금지.
- 상태 저장은 `near_sdk::store::*` 사용 (`NonFungibleToken` 내부의 `collections`는 예외).
- 에러: `require!(cond, "ERR_XXX: 설명")` 또는 `env::panic_str("ERR_XXX")`. 코드는 `docs/INTERFACE.md` 목록에 있는 것만 쓰고, 새 코드는 §5 절차로 추가한다.
- 1 yocto 메서드는 `near_sdk::assert_one_yocto()`로 시작한다.
- Gas 상수는 파일 상단 `const GAS_*: Gas = Gas::from_tgas(n);`로 둔다.
- 금액은 내부에서 `NearToken`/`u128`, 외부 인터페이스에서는 `U128`.
- 크로스 컨트랙트 호출은 `#[ext_contract]` trait + 콜백은 `#[private]`.
- `Contract` 구조체나 `EnvelopeState`에 필드를 추가하면 기존 배포 상태와 호환되지 않는다. 스테이징 재배포가 필요하므로 PR 설명에 `state-breaking`을 적는다 (아래 배포 참고).
- 단위 테스트는 같은 파일 하단 `#[cfg(test)] mod tests`에 둔다 (파일 소유권 유지).

## 빌드·테스트

```bash
cargo check-contracts                   # .cargo/config.toml alias (wasm 타깃 체크)
cargo test -p vault -p envelope -p mock-ft
../scripts/build-contracts.sh           # vault → res/vault.wasm 복사 → envelope, mock-ft 빌드
cargo test -p integration-tests         # wasm 빌드 후 실행
```

- 호스트 타깃 `cargo check`/`cargo build`는 near-sdk가 막는다. 위 alias나 `cargo near build`를 쓴다.
- `res/vault.wasm`은 커밋한다. `vault` 코드를 바꾼 PR은 반드시 스크립트로 다시 빌드한 wasm을 함께 커밋한다 (A).
- macOS에서 `cargo install cargo-near`가 `'algorithm' file not found`로 실패하면:
  `export SDKROOT=$(xcrun --show-sdk-path) CXXFLAGS="-isystem $SDKROOT/usr/include/c++/v1"` 후 재시도.

## 배포 (테스트넷)

- 개인 계정: `../scripts/deploy-testnet.sh <이름>-envelope.testnet` — 자유롭게.
- 스테이징 `nearenvelope.testnet`: D만, `main` 기준. `state-breaking` 변경이 머지되면 새 계정(`nearenvelope-v2.testnet` 등)에 배포하고 프런트 `.env.example`과 팀 채널에 주소를 갱신한다.
