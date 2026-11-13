// ★ 공유 파일. docs/INTERFACE.md, contracts/envelope/src/types.rs와 1:1로 유지한다.
// 변경 절차: 루트 CLAUDE.md §5

export type Rarity = "Basic" | "Rare" | "Epic" | "Legendary";
export type MissionId =
  | "Welcome"
  | "FirstFill"
  | "FirstGift"
  | "Regift"
  | "Journey3"
  | "Journey5"
  | "Journey10"
  | "NewConnection"
  /** 반복 보상. missions_done에는 들어가지 않는다 */
  | "NearEvent";

export interface TransferRecord {
  from: string;
  to: string;
  at_ms: number;
  message: string | null;
}

export interface EnvelopeView {
  token_id: string;
  owner_id: string;
  vault_id: string;
  creator_id: string;
  design: number;
  level: number;
  rarity: Rarity;
  enhance_tickets: number;
  enhance_attempts: number;
  missions_done: MissionId[];
  last_check_in_ms: number;
  created_at_ms: number;
  history: TransferRecord[];
}

export interface EnhanceResult {
  success: boolean;
  level_before: number;
  level_after: number;
  rarity: Rarity;
}

export interface ContractConfig {
  mint_deposit: string;
  ft_storage_deposit: string;
  max_level: number;
  message_max_len: number;
  check_in_cooldown_ms: number;
}

export interface NearEventView {
  event_id: string;
  name: string;
  tickets: number;
  ends_at_ms: number;
}

/** 프런트 전용: Vault 잔액 (최소 단위 문자열) */
export interface VaultBalances {
  /** Vault `withdrawable` (스토리지 예약분 제외) */
  near: string;
  usdc: string;
}

/** 프런트 전용: 보내기 마지막 단계에서 채우기 + send_envelope를 한 번에 서명 */
export interface SealAndSendParams {
  tokenId: string;
  vaultId: string;
  /** 더 넣을 NEAR (yocto). "0"이면 생략 */
  near: string;
  /** 더 넣을 USDC (최소 단위). "0"이면 생략 */
  usdc: string;
  receiverId: string;
  message?: string;
}

/**
 * 페이지·컴포넌트가 쓰는 유일한 체인 API. 실제 구현(contract.ts)과 목업(mock.ts)이 같은 모양을 가진다.
 * change 메서드가 `null`을 반환하면 리다이렉트형 지갑이라 결과를 즉시 알 수 없다는 뜻이다. 화면은 다시 조회한다.
 */
export interface EnvelopeApi {
  envelopeInfo(tokenId: string): Promise<EnvelopeView | null>;
  envelopesForOwner(accountId: string): Promise<EnvelopeView[]>;
  enhanceTable(): Promise<number[]>;
  config(): Promise<ContractConfig>;
  nearEvents(): Promise<NearEventView[]>;
  nearEventRedeemed(eventId: string, accountId: string): Promise<boolean>;
  vaultBalances(vaultId: string): Promise<VaultBalances>;
  /** 프런트 전용: 지갑 계정의 사용 가능 잔액. NEAR는 스토리지·가스 예약분을 뺀 값 */
  walletBalances(accountId: string): Promise<VaultBalances>;
  /** 프런트 전용: 체인에 존재하는 계정인지 */
  accountExists(accountId: string): Promise<boolean>;

  mint(design: number): Promise<string | null>;
  fill(tokenId: string, yocto: string): Promise<void>;
  registerFt(tokenId: string): Promise<void>;
  /** FT 컨트랙트에 ft_transfer_call(receiver = vault) */
  fillFt(vaultId: string, amount: string): Promise<void>;
  claimNear(tokenId: string, yocto: string, receiverId?: string): Promise<void>;
  claimFt(tokenId: string, amount: string, receiverId?: string): Promise<void>;
  sendEnvelope(tokenId: string, receiverId: string, message?: string): Promise<void>;
  enhance(tokenId: string): Promise<EnhanceResult | null>;
  checkIn(tokenId: string): Promise<void>;
  /** 행사 코드 입력. 보상은 tokenId 봉투에 쌓인다 */
  redeemNearEvent(tokenId: string, eventId: string, code: string): Promise<void>;
  /** fill / register_ft / ft_transfer_call / send_envelope를 지갑 승인 한 번으로 보낸다. send 트랜잭션 해시 (모르면 null) */
  sealAndSend(params: SealAndSendParams): Promise<string | null>;
}
