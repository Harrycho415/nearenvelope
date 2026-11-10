# Contract Interface (v0.1)

> **단일 진실 공급원.** 이 문서, `contracts/envelope/src/types.rs`, `frontend/src/lib/near/types.ts`는 항상 1:1로 일치해야 한다.
> 변경 절차는 루트 `CLAUDE.md` §5. 변경 이력은 맨 아래에 적는다.

## 공통 규칙

- 금액(yoctoNEAR, FT 최소 단위)은 JSON에서 **문자열**(`U128`)로 주고받는다.
- 시각은 **밀리초 정수**(`*_ms`). JS `number`로 안전하다.
- `token_id`는 `"1"`, `"2"` … 십진 문자열. Vault 계정 = `{token_id}.{nft_contract_id}`.
- 에러는 `panic!("ERR_XXX: 설명")` 형식. 프런트는 `ERR_XXX` 접두어로 분기한다.
- "1 yocto" = 1 yoctoNEAR를 첨부해야 함 (지갑 확인 강제용, NEP-171 관례).

## Envelope 컨트랙트 (`nearenvelope.testnet`)

### 상수 (`config()` 뷰로도 조회)

| 이름 | 값 | 설명 |
|---|---|---|
| `MINT_DEPOSIT` | 2 NEAR | 민트 최소 첨부액. NFT 저장 비용을 뺀 나머지는 Vault로 이동 |
| `FT_STORAGE_DEPOSIT` | 0.00125 NEAR | `register_ft` 최소 첨부액 |
| `MAX_LEVEL` | 10 | |
| `MESSAGE_MAX_LEN` | 280 | 문자 수 |
| `CHECK_IN_COOLDOWN_MS` | 600000 (10분) | 데모용 값 |

### Change 메서드

| 메서드 | 인자 | 첨부 | 권한 | 반환 | 권장 Gas |
|---|---|---|---|---|---|
| `mint` | `design: u8` | ≥ `MINT_DEPOSIT` | 누구나 | `TokenId` | 150 Tgas |
| `fill` | `token_id` | NEAR (>0) | 누구나 | – | 50 Tgas |
| `register_ft` | `token_id, ft_contract_id` | ≥ `FT_STORAGE_DEPOSIT` | 누구나 | – | 100 Tgas |
| `claim_near` | `token_id, amount: U128, receiver_id?: AccountId` | 1 yocto | 소유자 | – | 50 Tgas |
| `claim_ft` | `token_id, ft_contract_id, amount: U128, receiver_id?: AccountId` | 1 yocto | 소유자 | – | 100 Tgas |
| `send_envelope` | `token_id, receiver_id, message?: string` | 1 yocto | 소유자 | – | 50 Tgas |
| `enhance` | `token_id` | 1 yocto | 소유자 | `EnhanceResult` | 30 Tgas |
| `check_in` | `token_id` | – | 소유자 | – | 30 Tgas |

- `receiver_id` 생략 시 소유자 본인에게 출금.
- `claim_ft`의 수령자는 해당 FT에 storage 등록이 되어 있어야 한다 (프런트가 사전 확인·등록).
- 표준 `nft_transfer` / `nft_transfer_call`로 보내도 전달 기록은 남는다 (`message = null`).
- FT 채우기: 사용자가 FT 컨트랙트에 `ft_transfer_call(receiver_id = vault_id, amount, msg = "")`. 사전에 `register_ft` 필요.

### 내부 콜백 (프런트 호출 금지)

| 메서드 | 호출자 |
|---|---|
| `on_vault_created(token_id, minter_id, deposit: U128)` | self (`#[private]`) |
| `on_vault_deposit(token_id, ft_contract_id: AccountId, amount: U128)` | 해당 token의 Vault만 |

### View 메서드

| 메서드 | 인자 | 반환 |
|---|---|---|
| `envelope_info` | `token_id` | `EnvelopeView \| null` |
| `envelopes_for_owner` | `account_id, from_index?: U128, limit?: u64` | `EnvelopeView[]` |
| `enhance_table` | – | `u16[]` (index = 현재 레벨, 값 = 성공 확률 basis point) |
| `config` | – | `ContractConfig` |
| NEP-171/177/181 표준 | `nft_token`, `nft_tokens_for_owner`, `nft_metadata`, `nft_total_supply` 등 | |

### 타입

```ts
type Rarity = "Basic" | "Rare" | "Epic" | "Legendary";
type MissionId = "Welcome" | "FirstFill" | "FirstGift" | "Regift";

interface TransferRecord {
  from: string;          // AccountId
  to: string;
  at_ms: number;
  message: string | null;
}

interface EnvelopeView {
  token_id: string;
  owner_id: string;
  vault_id: string;
  creator_id: string;
  design: number;
  level: number;          // 0..=10
  rarity: Rarity;
  enhance_tickets: number;
  enhance_attempts: number;
  missions_done: MissionId[];
  last_check_in_ms: number;   // 0 = 없음
  created_at_ms: number;
  history: TransferRecord[];  // 오래된 순
}

interface EnhanceResult {
  success: boolean;
  level_before: number;
  level_after: number;
  rarity: Rarity;
}

interface ContractConfig {
  mint_deposit: string;          // U128
  ft_storage_deposit: string;    // U128
  max_level: number;
  message_max_len: number;
  check_in_cooldown_ms: number;
}
```

### 미션

미션은 **토큰 단위**로 판정되고 티켓도 토큰에 쌓인다 (봉투가 이동하며 성장).

| MissionId | 조건 | 보상 | 반복 |
|---|---|---|---|
| `Welcome` | 민트 | 티켓 1 | 1회 |
| `FirstFill` | `fill` 또는 FT 입금(`on_vault_deposit`) 첫 발생 | 티켓 1 | 1회 |
| `FirstGift` | `send_envelope` 또는 `nft_transfer` 첫 발생 | 티켓 1 | 1회 |
| `Regift` | 선물로 **받은** 소유자가 다시 보냄 (history ≥ 1인 상태에서 전송) | 티켓 2 | 1회 |
| (check-in) | `check_in`, `CHECK_IN_COOLDOWN_MS`마다 | 티켓 1 | 반복 (`missions_done`에는 포함 안 함) |

### 강화

| 현재 레벨 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| 성공 확률 | 100% | 90% | 80% | 70% | 60% | 50% | 40% | 30% | 20% | 10% |

- 실패해도 레벨은 유지된다. 티켓은 성공·실패와 관계없이 1장 소모된다.
- 난수: `env::random_seed()`.
- 희귀도: `0–3 Basic`, `4–6 Rare`, `7–9 Epic`, `10 Legendary`.
- 레벨이 바뀌면 NEP-177 토큰 메타데이터를 갱신한다:
  - `title = "{Rarity} Envelope +{level}"`
  - `media = "designs/{design}/{rarity 소문자}.svg"` (컨트랙트 `base_uri` = 프런트 도메인)

### 에러 코드

`ERR_TOKEN_NOT_FOUND`, `ERR_NOT_OWNER`, `ERR_INSUFFICIENT_DEPOSIT`, `ERR_NO_TICKET`, `ERR_MAX_LEVEL`,
`ERR_MESSAGE_TOO_LONG`, `ERR_CHECK_IN_COOLDOWN`, `ERR_NOT_VAULT`, `ERR_INVALID_DESIGN`

### 이벤트 (NEP-297)

표준 `nft_mint` / `nft_transfer` 외에 `standard: "near_envelope", version: "1.0.0"`:

| event | data |
|---|---|
| `envelope_fill` | `{ token_id, sender_id, asset: "NEAR" \| ft_contract_id, amount }` |
| `envelope_gift` | `{ token_id, from, to, has_message }` |
| `envelope_enhance` | `{ token_id, success, level_before, level_after }` |
| `mission_complete` | `{ token_id, mission, tickets }` |

## Vault 컨트랙트 (`{token_id}.nearenvelope.testnet`)

| 메서드 | 인자 | 권한 | 비고 |
|---|---|---|---|
| `new` (init) | `controller_id, token_id` | 배포 시 1회 | |
| `withdraw_near` | `amount: U128, receiver_id` | controller | 스토리지 예약분은 출금 불가 |
| `ft_transfer` | `ft_contract_id, amount: U128, receiver_id` | controller | 1 yocto는 Vault 잔액에서 지불 |
| `ft_storage_deposit` | `ft_contract_id` | controller, payable | 첨부액을 FT `storage_deposit`으로 전달 |
| `ft_on_transfer` | `sender_id, amount, msg` | NEP-141 | 전액 수령(`"0"` 반환) 후 controller `on_vault_deposit` 호출 |
| `controller` (view) | – | | |
| `token_id` (view) | – | | |

## 변경 이력

- v0.1 (2026-11-10): 초안
