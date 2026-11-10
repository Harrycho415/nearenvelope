//! NEAR Envelope — 하위 계정(Vault)을 보유하는 NEP-171 NFT 컨트랙트.
//! 소유자: A. 다른 담당자는 자기 모듈 파일만 수정한다 (contracts/CLAUDE.md).

use near_contract_standards::non_fungible_token::metadata::{
    NFTContractMetadata, NonFungibleTokenMetadataProvider, NFT_METADATA_SPEC,
};
use near_contract_standards::non_fungible_token::{NonFungibleToken, TokenId};
use near_sdk::collections::LazyOption;
use near_sdk::store::LookupMap;
use near_sdk::{env, near, require, AccountId, BorshStorageKey, NearToken, PanicOnDefault};

mod enhance;
mod events;
mod gift;
mod mint;
mod mission;
mod nft_core;
mod types;
mod vault_ops;
mod views;

pub use crate::types::*;

pub const MINT_DEPOSIT: NearToken = NearToken::from_near(2);
pub const FT_STORAGE_DEPOSIT: NearToken = NearToken::from_micronear(1_250);
pub const MAX_LEVEL: u8 = 10;
pub const MESSAGE_MAX_LEN: usize = 280;
pub const CHECK_IN_COOLDOWN_MS: u64 = 600_000;
/// 프런트 `public/designs/{design}/` 개수와 맞춘다 (D)
pub const DESIGN_COUNT: u8 = 3;

#[derive(BorshStorageKey)]
#[near]
pub(crate) enum StorageKey {
    NonFungibleToken,
    Metadata,
    TokenMetadata,
    Enumeration,
    Approval,
    Envelopes,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    pub(crate) tokens: NonFungibleToken,
    pub(crate) metadata: LazyOption<NFTContractMetadata>,
    pub(crate) envelopes: LookupMap<TokenId, EnvelopeState>,
    pub(crate) next_token_id: u64,
}

#[near]
impl Contract {
    #[init]
    pub fn new(owner_id: AccountId, metadata: Option<NFTContractMetadata>) -> Self {
        let metadata = metadata.unwrap_or_else(|| NFTContractMetadata {
            spec: NFT_METADATA_SPEC.to_string(),
            name: "NEAR Envelope".to_string(),
            symbol: "ENVELOPE".to_string(),
            icon: None,
            base_uri: None,
            reference: None,
            reference_hash: None,
        });
        metadata.assert_valid();
        Self {
            tokens: NonFungibleToken::new(
                StorageKey::NonFungibleToken,
                owner_id,
                Some(StorageKey::TokenMetadata),
                Some(StorageKey::Enumeration),
                Some(StorageKey::Approval),
            ),
            metadata: LazyOption::new(StorageKey::Metadata, Some(&metadata)),
            envelopes: LookupMap::new(StorageKey::Envelopes),
            next_token_id: 1,
        }
    }
}

#[near]
impl NonFungibleTokenMetadataProvider for Contract {
    fn nft_metadata(&self) -> NFTContractMetadata {
        self.metadata.get().unwrap()
    }
}

/// 모든 모듈이 쓰는 내부 헬퍼. 시그니처 변경 시 A·B 합의.
impl Contract {
    pub(crate) fn vault_id(token_id: &TokenId) -> AccountId {
        format!("{}.{}", token_id, env::current_account_id())
            .parse()
            .unwrap()
    }

    pub(crate) fn owner_of(&self, token_id: &TokenId) -> AccountId {
        self.tokens
            .owner_by_id
            .get(token_id)
            .unwrap_or_else(|| env::panic_str("ERR_TOKEN_NOT_FOUND"))
    }

    /// 호출자가 소유자인지 확인하고 소유자 계정을 반환한다.
    pub(crate) fn assert_owner(&self, token_id: &TokenId) -> AccountId {
        let owner_id = self.owner_of(token_id);
        require!(
            env::predecessor_account_id() == owner_id,
            "ERR_NOT_OWNER: caller does not own this envelope"
        );
        owner_id
    }

    pub(crate) fn envelope(&self, token_id: &TokenId) -> &EnvelopeState {
        self.envelopes
            .get(token_id)
            .unwrap_or_else(|| env::panic_str("ERR_TOKEN_NOT_FOUND"))
    }

    pub(crate) fn envelope_mut(&mut self, token_id: &TokenId) -> &mut EnvelopeState {
        self.envelopes
            .get_mut(token_id)
            .unwrap_or_else(|| env::panic_str("ERR_TOKEN_NOT_FOUND"))
    }

    pub(crate) fn now_ms() -> u64 {
        env::block_timestamp_ms()
    }
}
