// ★ 공유 파일. docs/INTERFACE.md, contracts/envelope/src/types.rs와 1:1로 유지한다.
// 변경 절차: 루트 CLAUDE.md §5

export type Rarity = "Basic" | "Rare" | "Epic" | "Legendary";
export type MissionId = "Welcome" | "FirstFill" | "FirstGift" | "Regift";

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

/** 프런트 전용: Vault 잔액 (최소 단위 문자열) */
export interface VaultBalances {
  /** Vault `withdrawable` (스토리지 예약분 제외) */
  near: string;
  usdc: string;
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
  vaultBalances(vaultId: string): Promise<VaultBalances>;

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
}
