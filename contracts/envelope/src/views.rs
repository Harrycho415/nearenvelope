//! View 메서드.
//! 소유자: B

use near_contract_standards::non_fungible_token::TokenId;
use near_sdk::json_types::U128;
use near_sdk::{near, AccountId};

use crate::{
    Contract, ContractConfig, ContractExt, EnvelopeView, CHECK_IN_COOLDOWN_MS, FT_STORAGE_DEPOSIT,
    MAX_LEVEL, MESSAGE_MAX_LEN, MINT_DEPOSIT,
};

#[near]
impl Contract {
    pub fn envelope_info(&self, token_id: TokenId) -> Option<EnvelopeView> {
        let _ = token_id;
        todo!("B: envelope_info")
    }

    pub fn envelopes_for_owner(
        &self,
        account_id: AccountId,
        from_index: Option<U128>,
        limit: Option<u64>,
    ) -> Vec<EnvelopeView> {
        let _ = (account_id, from_index, limit);
        todo!("B: envelopes_for_owner")
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
}
