//! View 메서드.
//! 소유자: B

use near_contract_standards::non_fungible_token::enumeration::NonFungibleTokenEnumeration;
use near_contract_standards::non_fungible_token::TokenId;
use near_sdk::json_types::U128;
use near_sdk::{near, AccountId};

use crate::{
    Contract, ContractConfig, ContractExt, EnvelopeView, NearEventView, Rarity,
    CHECK_IN_COOLDOWN_MS, FT_STORAGE_DEPOSIT, MAX_LEVEL, MESSAGE_MAX_LEN, MINT_DEPOSIT,
};

#[near]
impl Contract {
    pub fn envelope_info(&self, token_id: TokenId) -> Option<EnvelopeView> {
        let owner_id = self.tokens.owner_by_id.get(&token_id)?;
        let e = self.envelopes.get(&token_id)?;
        Some(EnvelopeView {
            vault_id: Self::vault_id(&token_id),
            token_id,
            owner_id,
            creator_id: e.creator_id.clone(),
            design: e.design,
            level: e.level,
            rarity: Rarity::from_level(e.level),
            enhance_tickets: e.enhance_tickets,
            enhance_attempts: e.enhance_attempts,
            missions_done: e.missions_done.clone(),
            last_check_in_ms: e.last_check_in_ms,
            created_at_ms: e.created_at_ms,
            history: e.history.clone(),
        })
    }

    pub fn envelopes_for_owner(
        &self,
        account_id: AccountId,
        from_index: Option<U128>,
        limit: Option<u64>,
    ) -> Vec<EnvelopeView> {
        self.nft_tokens_for_owner(account_id, from_index, limit)
            .into_iter()
            .filter_map(|token| self.envelope_info(token.token_id))
            .collect()
    }

    pub fn config(&self) -> ContractConfig {
        ContractConfig {
            mint_deposit: U128(MINT_DEPOSIT.as_yoctonear()),
            ft_storage_deposit: U128(FT_STORAGE_DEPOSIT.as_yoctonear()),
            max_level: MAX_LEVEL,
            message_max_len: MESSAGE_MAX_LEN as u32,
            check_in_cooldown_ms: CHECK_IN_COOLDOWN_MS,
        }
    }

    /// 등록 순
    pub fn near_events(&self) -> Vec<NearEventView> {
        self.near_events
            .iter()
            .map(|(event_id, e)| NearEventView {
                event_id: event_id.clone(),
                name: e.name.clone(),
                tickets: e.tickets,
                ends_at_ms: e.ends_at_ms,
            })
            .collect()
    }

    pub fn near_event_redeemed(&self, event_id: String, account_id: AccountId) -> bool {
        self.near_event_redeemed.contains(&(event_id, account_id))
    }
}
