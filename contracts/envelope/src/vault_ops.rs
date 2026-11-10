//! Vault 입출금: fill / register_ft / claim_near / claim_ft / on_vault_deposit.
//! 소유자: A

use near_contract_standards::non_fungible_token::TokenId;
use near_sdk::json_types::U128;
use near_sdk::{near, AccountId};

use crate::{Contract, ContractExt};

#[near]
impl Contract {
    /// 누구나 NEAR를 봉투에 채울 수 있다. 첨부액 전부를 Vault로 전송.
    /// envelope_fill 이벤트 + grant_mission(FirstFill)
    #[payable]
    pub fn fill(&mut self, token_id: TokenId) {
        let _ = token_id;
        todo!("A: fill")
    }

    /// Vault를 FT 컨트랙트에 storage 등록. 첨부액 ≥ FT_STORAGE_DEPOSIT.
    #[payable]
    pub fn register_ft(&mut self, token_id: TokenId, ft_contract_id: AccountId) {
        let _ = (token_id, ft_contract_id);
        todo!("A: register_ft")
    }

    /// 소유자만. 1 yocto. receiver_id 생략 시 소유자.
    #[payable]
    pub fn claim_near(&mut self, token_id: TokenId, amount: U128, receiver_id: Option<AccountId>) {
        let _ = (token_id, amount, receiver_id);
        todo!("A: claim_near")
    }

    /// 소유자만. 1 yocto.
    #[payable]
    pub fn claim_ft(
        &mut self,
        token_id: TokenId,
        ft_contract_id: AccountId,
        amount: U128,
        receiver_id: Option<AccountId>,
    ) {
        let _ = (token_id, ft_contract_id, amount, receiver_id);
        todo!("A: claim_ft")
    }

    /// Vault의 ft_on_transfer가 호출. predecessor == vault_id(token_id) 확인 필수 (ERR_NOT_VAULT).
    /// envelope_fill 이벤트 + grant_mission(FirstFill)
    pub fn on_vault_deposit(&mut self, token_id: TokenId, ft_contract_id: AccountId, amount: U128) {
        let _ = (token_id, ft_contract_id, amount);
        todo!("A: on_vault_deposit")
    }
}
