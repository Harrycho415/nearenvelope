//! ★ 공유 파일. docs/INTERFACE.md, frontend/src/lib/near/types.ts와 1:1로 유지한다.
//! 변경 절차: 루트 CLAUDE.md §5

use near_contract_standards::non_fungible_token::TokenId;
use near_sdk::json_types::U128;
use near_sdk::{near, AccountId};

#[near(serializers = [borsh, json])]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Rarity {
    Basic,
    Rare,
    Epic,
    Legendary,
}

impl Rarity {
    pub fn from_level(level: u8) -> Self {
        match level {
            0..=3 => Rarity::Basic,
            4..=6 => Rarity::Rare,
            7..=9 => Rarity::Epic,
            _ => Rarity::Legendary,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Rarity::Basic => "Basic",
            Rarity::Rare => "Rare",
            Rarity::Epic => "Epic",
            Rarity::Legendary => "Legendary",
        }
    }
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum MissionId {
    Welcome,
    FirstFill,
    FirstGift,
    Regift,
    // v0.2 — borsh 호환을 위해 항상 뒤에 추가한다
    Journey3,
    Journey5,
    Journey10,
    NewConnection,
    /// 반복 보상. missions_done에는 넣지 않고 mission_complete 이벤트로만 남긴다.
    NearEvent,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct TransferRecord {
    pub from: AccountId,
    pub to: AccountId,
    pub at_ms: u64,
    pub message: Option<String>,
}

/// 온체인 저장용. 소유자·NEP-177 메타데이터는 `NonFungibleToken`이 따로 관리한다.
#[near(serializers = [borsh])]
#[derive(Clone, Debug)]
pub struct EnvelopeState {
    pub creator_id: AccountId,
    pub design: u8,
    pub level: u8,
    pub enhance_tickets: u32,
    pub enhance_attempts: u32,
    pub missions_done: Vec<MissionId>,
    pub last_check_in_ms: u64,
    pub created_at_ms: u64,
    pub history: Vec<TransferRecord>,
}

impl EnvelopeState {
    pub fn new(creator_id: AccountId, design: u8, created_at_ms: u64) -> Self {
        Self {
            creator_id,
            design,
            level: 0,
            enhance_tickets: 0,
            enhance_attempts: 0,
            missions_done: Vec::new(),
            last_check_in_ms: 0,
            created_at_ms,
            history: Vec::new(),
        }
    }
}

#[near(serializers = [json])]
#[derive(Clone, Debug)]
pub struct EnvelopeView {
    pub token_id: TokenId,
    pub owner_id: AccountId,
    pub vault_id: AccountId,
    pub creator_id: AccountId,
    pub design: u8,
    pub level: u8,
    pub rarity: Rarity,
    pub enhance_tickets: u32,
    pub enhance_attempts: u32,
    pub missions_done: Vec<MissionId>,
    pub last_check_in_ms: u64,
    pub created_at_ms: u64,
    pub history: Vec<TransferRecord>,
}

#[near(serializers = [json])]
#[derive(Clone, Debug)]
pub struct EnhanceResult {
    pub success: bool,
    pub level_before: u8,
    pub level_after: u8,
    pub rarity: Rarity,
}

#[near(serializers = [json])]
#[derive(Clone, Debug)]
pub struct ContractConfig {
    pub mint_deposit: U128,
    pub ft_storage_deposit: U128,
    pub max_level: u8,
    pub message_max_len: u32,
    pub check_in_cooldown_ms: u64,
}

/// 온체인 저장용 니어 행사. 코드 원문은 저장하지 않는다.
#[near(serializers = [borsh])]
#[derive(Clone, Debug)]
pub struct NearEvent {
    pub name: String,
    /// sha256(code)의 소문자 hex
    pub code_hash: String,
    pub tickets: u32,
    pub ends_at_ms: u64,
}

#[near(serializers = [json])]
#[derive(Clone, Debug)]
pub struct NearEventView {
    pub event_id: String,
    pub name: String,
    pub tickets: u32,
    pub ends_at_ms: u64,
}
