# NEAR Envelope — 팀 공통 지침

> 자산을 보유하는 계정 자체를 선물 가능한 NFT로 만든 서비스.
> NEAR Hackathon **Track 10: NFTs That Do Something** 제출작.
> **마감: 2026-11-14 23:59 UTC (= 11-15 08:59 KST). 팀 내부 목표: 11-14 18:00 KST 제출 완료.**

이 파일은 4명이 동시에 개발하면서 충돌하지 않기 위한 규칙이다. 사람이든 Claude든 작업 전에 반드시 읽는다.
하위 영역별 상세 규칙은 `contracts/CLAUDE.md`, `frontend/CLAUDE.md`에 있다.

---

## 1. 핵심 개념 (모든 결정의 기준)

- **NFT 소유권 = Vault(하위 계정) 자산 제어권.** 이 불변식을 깨는 코드는 머지하지 않는다.
- 각 Envelope NFT는 `<token_id>.<nft-contract>` 하위 계정(Vault)을 하나 가진다.
- Vault에는 **Access Key가 없다.** Vault 컨트랙트는 오직 NFT 컨트랙트(`controller`)의 호출만 받는다.
- 따라서 NFT가 이전되면 별도 처리 없이 자산 권한도 이전된다. 출금은 항상 NFT 컨트랙트가 현재 소유자를 확인한 뒤 Vault에 지시한다.

자세한 구조와 흐름: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
컨트랙트 메서드/타입 명세 (**단일 진실 공급원**): [`docs/INTERFACE.md`](docs/INTERFACE.md)

## 2. 폴더 구조

```
nearenvelope/
├── CLAUDE.md                  # 이 파일 (공유, 변경 시 팀 공지)
├── README.md                  # 제출용 README (D 담당, 마지막 날 완성)
├── docs/
│   ├── ARCHITECTURE.md        # 구조·흐름·보안 모델
│   ├── INTERFACE.md           # ★ 컨트랙트 ↔ 프런트 계약. 변경 절차 §5 참고
│   └── DECISIONS.md           # 설계 결정 로그 (append-only)
├── contracts/                 # Rust 워크스페이스 (near-sdk 5.x)
│   ├── CLAUDE.md
│   ├── Cargo.toml             # workspace (공유)
│   ├── envelope/              # NEP-171 NFT 컨트랙트 = Vault의 부모 계정
│   │   └── src/
│   │       ├── lib.rs         # 상태 구조체·init·모듈 선언     (A)
│   │       ├── types.rs       # ★ 공유 타입 (INTERFACE.md와 1:1) (공유)
│   │       ├── nft_core.rs    # NEP-171/177/178/181 구현 + 전송 훅 (A)
│   │       ├── mint.rs        # mint: 하위 계정 생성 + Vault 배포 (A)
│   │       ├── vault_ops.rs   # fill / claim / register_ft       (A)
│   │       ├── gift.rs        # send_envelope, 메시지, 전달 기록  (B)
│   │       ├── enhance.rs     # 강화 확률·레벨·희귀도           (B)
│   │       ├── mission.rs     # 미션 판정·티켓 지급             (B)
│   │       ├── views.rs       # view 메서드                    (B)
│   │       └── events.rs      # NEP-297 이벤트 로그             (B)
│   ├── vault/                 # 하위 계정에 배포되는 Vault 컨트랙트 (A)
│   ├── mock-ft/               # 테스트넷용 Mock USDC (NEP-141)    (B)
│   └── integration-tests/     # near-workspaces 시나리오 테스트   (B, A는 자기 기능 테스트 추가)
├── frontend/                  # Next.js 16 (App Router) + Tailwind 4
│   ├── CLAUDE.md
│   └── src/
│       ├── app/               # 라우트 (페이지별 담당 §3)
│       ├── components/
│       │   ├── envelope/      # EnvelopeCard 등 봉투 시각 요소 (D)
│       │   └── ui/            # 공용 버튼·모달 등            (C)
│       └── lib/near/          # ★ 체인 접근 계층 (C). 페이지는 여기만 import
│           ├── types.ts       # ★ INTERFACE.md와 1:1 (공유)
│           ├── config.ts      # 네트워크·컨트랙트 주소
│           ├── wallet.tsx     # Wallet Selector Provider
│           ├── contract.ts    # 실제 RPC/트랜잭션 구현
│           └── mock.ts        # 목업 구현 (컨트랙트 배포 전 개발용)
└── scripts/                   # 배포·시드 스크립트 (D)
```

## 3. 역할 분담 (파일 소유권)

| 역할 | 담당 영역 | 소유 파일 |
|---|---|---|
| **A — Contract Core** | Vault, mint, 입출금, NFT 표준 | `contracts/vault/**`, `envelope/src/{lib,nft_core,mint,vault_ops}.rs` |
| **B — Contract Gameplay** | 선물·기록·강화·미션·뷰, 테스트 | `envelope/src/{gift,enhance,mission,views,events}.rs`, `contracts/mock-ft/**`, `contracts/integration-tests/**` |
| **C — Frontend Core** | 지갑, 체인 계층, 내 봉투/채우기/보내기/열기 | `frontend/src/lib/near/**`, `app/` 중 `/`, `/envelopes/**`, `/send/**`, `components/ui/**` |
| **D — Frontend Experience & Delivery** | 봉투 디자인, 강화 화면·연출, 배포, README, 데모 | `components/envelope/**`, `app/enhance/**`, `public/**`, `scripts/**`, `README.md` |

> 머지 승인권자는 역할과 관계없이 **@Harrycho415 한 명**이다 (`.github/CODEOWNERS`).

**규칙**
- 남의 소유 파일은 수정하지 않는다. 필요하면 소유자에게 요청하거나, PR에 소유자를 리뷰어로 지정한다.
- **공유 파일**(★ 표시 + `CLAUDE.md`, `Cargo.toml`, `Cargo.lock`, `package.json`, `pnpm-lock.yaml`)은 §5 절차를 따른다.
- 의존성 추가는 해당 영역 소유자만. 프런트 패키지 추가는 C, Rust crate 추가는 A가 머지한다 (lockfile 충돌 방지).

## 4. 브랜치·커밋·PR

**Trunk 기반 + 짧은 feature 브랜치.** 개발 기간이 4일이라 `develop` 브랜치는 두지 않는다.

- `main`: 항상 빌드·테스트 통과 상태. 테스트넷 배포는 `main`에서만. 직접 push 금지.
- 브랜치 이름: `<type>/<area>-<짧은-설명>`
  - type: `feat` `fix` `refactor` `test` `docs` `chore`
  - area: `contract` `vault` `fe` `design` `infra` `docs`
  - 예: `feat/contract-enhance`, `feat/fe-send-page`, `fix/vault-storage-reserve`
- 브랜치 수명은 **하루 이내**. 크면 쪼갠다. 작업 시작 전과 PR 전에 `git pull --rebase origin main`.
- 커밋 메시지: Conventional Commits. `feat(contract): add enhance probability table`
- PR
  - **Squash merge**만 사용. PR 제목이 곧 main의 커밋 메시지.
  - 모든 PR: CI 통과 + **@Harrycho415 승인** → 머지. 다른 팀원 리뷰는 권장하지만 머지 조건은 아니다.
  - 공유 파일을 바꾼 PR은 관련 영역 담당자도 리뷰어로 지정해 내용을 확인받는다.
  - PR 템플릿(`.github/pull_request_template.md`)의 체크리스트를 채운다.
- 충돌이 나면 **나중에 머지하는 사람**이 rebase로 해결한다. 남의 코드를 지워서 해결하지 않는다.

## 5. 인터페이스 변경 절차 (가장 중요)

컨트랙트와 프런트를 병렬로 개발하기 위해 `docs/INTERFACE.md`를 계약서로 쓴다.

1. 메서드 시그니처·인자·반환 JSON·이벤트를 바꾸려면 **하나의 PR에서 함께** 수정한다:
   `docs/INTERFACE.md` + `contracts/envelope/src/types.rs` + `frontend/src/lib/near/types.ts` (+ `mock.ts`)
2. PR 제목에 `[interface]` 접두어를 붙이고 팀 채널에 공지한다.
3. A·B 중 1명과 C가 리뷰한 뒤 @Harrycho415 승인으로 머지한다.
4. 추가(필드/메서드 신규)는 언제든 가능. **삭제·이름 변경은 11/13 00:00 KST 이후 금지.**

## 6. 환경

| 도구 | 버전 | 비고 |
|---|---|---|
| Rust | `contracts/rust-toolchain.toml` 고정 | `rustup target add wasm32-unknown-unknown` |
| cargo-near | 0.23.x | 빌드·배포 (`cargo near build`) |
| near-sdk / near-contract-standards | 5.30.x | |
| near-workspaces | 0.24.x | 통합 테스트 |
| Node | 22.x | |
| pnpm | 10.x | npm/yarn 사용 금지 (lockfile 하나만 유지) |
| Next.js | 16.x | 학습 데이터와 API가 다를 수 있음 → `frontend/AGENTS.md` 참고 |

**테스트넷 계정**
- 공용 스테이징: `nearenvelope.testnet` (NFT 컨트랙트), `usdc.nearenvelope.testnet` (Mock FT). **D만** `main` 기준으로 배포한다.
- 개인 개발용: `<이름>-envelope.testnet`. 각자 자유롭게 재배포한다. 공용 계정에 개인 실험 배포 금지.
- 비밀키·시드 문구는 절대 커밋하지 않는다. `.env*`는 `.env.example`만 커밋한다.

## 7. 공통 명령어

```bash
# 컨트랙트
cd contracts
cargo check-contracts                   # 빠른 타입 체크 (wasm 타깃 alias. 호스트 `cargo check`는 near-sdk가 막음)
cargo test -p vault -p envelope -p mock-ft   # 단위 테스트
../scripts/build-contracts.sh           # vault → res/vault.wasm → envelope, mock-ft wasm 빌드
cargo test -p integration-tests         # 샌드박스 시나리오 (wasm 빌드 후)
../scripts/deploy-testnet.sh <계정>      # 테스트넷 배포 (near-cli-rs 필요)

# 프런트
cd frontend
cp .env.example .env.local              # 최초 1회
pnpm dev                                # NEXT_PUBLIC_USE_MOCK=true면 목업 데이터로 동작
pnpm lint && pnpm build
```

CI(`.github/workflows/ci.yml`)는 PR마다 위의 check/unit test, lint/build를 돌린다. 통합 테스트와 wasm 빌드는 로컬에서 실행한다.

**처음 세팅 (각자 1회)**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh   # Rust (버전은 rust-toolchain.toml이 고정)
cargo install cargo-near --version 0.23.0 --locked               # macOS 실패 시 contracts/CLAUDE.md 참고
# near-cli-rs: https://github.com/near/near-cli-rs (배포 담당자만)
cd frontend && pnpm install
```

## 8. 범위 관리

**MVP (이것만 끝나면 제출 가능)** — 민트 → 채우기(NEAR/USDC) → 메시지와 함께 보내기 → 이전 소유자 출금 실패 / 새 소유자 출금 성공 → 강화 → 전달 기록 표시.

**하지 않는다:** 백엔드 서버, 인덱서, 메인넷 배포, 오프체인 미션 검증, 마켓플레이스.

**여유가 생기면 (순서대로):** 링크로 선물하기(지갑 없는 수신자) → Global Contract로 민트 비용 절감 → 승인 중 출금 잠금 → 봉투 디자인 추가.

## 9. Claude 작업 규칙

- 작업 전 해당 영역의 `CLAUDE.md`와 `docs/INTERFACE.md`를 읽는다.
- 요청받은 사람의 **소유 파일 범위 밖은 수정하지 않는다.** 필요하면 변경 제안만 출력한다.
- 인터페이스를 바꿔야 하면 코드를 바꾸기 전에 사용자에게 §5 절차가 필요하다고 알린다.
- 설계 판단을 내렸다면 `docs/DECISIONS.md`에 한 줄 추가를 제안한다.
- 커밋/push/배포는 사용자가 요청할 때만.
