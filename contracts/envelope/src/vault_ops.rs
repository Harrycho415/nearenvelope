//! Vault 입출금: fill / register_ft / claim_near / claim_ft / on_vault_deposit.
//! 소유자: A

use near_contract_standards::non_fungible_token::TokenId;
use near_sdk::json_types::U128;
use near_sdk::serde_json::json;
use near_sdk::{
    assert_one_yocto, env, ext_contract, near, require, AccountId, Gas, NearToken, Promise,
};

use crate::{events, Contract, ContractExt, MissionId, FT_STORAGE_DEPOSIT};

const GAS_VAULT_WITHDRAW_NEAR: Gas = Gas::from_tgas(15);
const GAS_VAULT_FT_TRANSFER: Gas = Gas::from_tgas(30);
const GAS_VAULT_FT_STORAGE_DEPOSIT: Gas = Gas::from_tgas(30);

#[ext_contract(ext_vault)]
#[allow(dead_code)]
trait Vault {
    fn withdraw_near(&mut self, amount: U128, receiver_id: AccountId);
    fn ft_transfer(&mut self, ft_contract_id: AccountId, amount: U128, receiver_id: AccountId);
    fn ft_storage_deposit(&mut self, ft_contract_id: AccountId);
}

#[near]
impl Contract {
    /// 누구나 NEAR를 봉투에 채울 수 있다. 첨부액 전부를 Vault로 전송.
    /// envelope_fill 이벤트 + grant_mission(FirstFill)
    #[payable]
    pub fn fill(&mut self, token_id: TokenId) -> Promise {
        let amount = env::attached_deposit();
        require!(!amount.is_zero(), "ERR_INSUFFICIENT_DEPOSIT: attach NEAR to fill");
        self.owner_of(&token_id);

        events::emit(
            "envelope_fill",
            json!({
                "token_id": token_id,
                "sender_id": env::predecessor_account_id(),
                "asset": "NEAR",
                "amount": U128(amount.as_yoctonear()),
            }),
        );
        self.grant_mission(&token_id, MissionId::FirstFill);
        Promise::new(Self::vault_id(&token_id)).transfer(amount)
    }

    /// Vault를 FT 컨트랙트에 storage 등록. 첨부액 ≥ FT_STORAGE_DEPOSIT.
    #[payable]
    pub fn register_ft(&mut self, token_id: TokenId, ft_contract_id: AccountId) -> Promise {
        let deposit = env::attached_deposit();
        require!(
            deposit >= FT_STORAGE_DEPOSIT,
            "ERR_INSUFFICIENT_DEPOSIT: attach at least FT_STORAGE_DEPOSIT"
        );
        self.owner_of(&token_id);
        ext_vault::ext(Self::vault_id(&token_id))
            .with_attached_deposit(deposit)
            .with_static_gas(GAS_VAULT_FT_STORAGE_DEPOSIT)
            .ft_storage_deposit(ft_contract_id)
    }

    /// 소유자만. 1 yocto. receiver_id 생략 시 소유자.
    #[payable]
    pub fn claim_near(&mut self, token_id: TokenId, amount: U128, receiver_id: Option<AccountId>) -> Promise {
        assert_one_yocto();
        let owner_id = self.assert_owner(&token_id);
        ext_vault::ext(Self::vault_id(&token_id))
            .with_static_gas(GAS_VAULT_WITHDRAW_NEAR)
            .withdraw_near(amount, receiver_id.unwrap_or(owner_id))
    }

    /// 소유자만. 1 yocto.
    #[payable]
    pub fn claim_ft(
        &mut self,
        token_id: TokenId,
        ft_contract_id: AccountId,
        amount: U128,
        receiver_id: Option<AccountId>,
    ) -> Promise {
        assert_one_yocto();
        let owner_id = self.assert_owner(&token_id);
        ext_vault::ext(Self::vault_id(&token_id))
            .with_attached_deposit(NearToken::from_yoctonear(0))
            .with_static_gas(GAS_VAULT_FT_TRANSFER)
            .ft_transfer(ft_contract_id, amount, receiver_id.unwrap_or(owner_id))
    }

    /// Vault의 ft_on_transfer가 호출. predecessor == vault_id(token_id) 확인 필수 (ERR_NOT_VAULT).
    /// envelope_fill 이벤트 + grant_mission(FirstFill)
    pub fn on_vault_deposit(&mut self, token_id: TokenId, ft_contract_id: AccountId, amount: U128) {
        require!(
            env::predecessor_account_id() == Self::vault_id(&token_id),
            "ERR_NOT_VAULT: only this envelope's vault can report deposits"
        );
        self.owner_of(&token_id);
        // Vault가 FT 보낸 계정을 전달하지 않으므로 sender_id는 null
        events::emit(
            "envelope_fill",
            json!({
                "token_id": token_id,
                "sender_id": null,
                "asset": ft_contract_id,
                "amount": amount,
            }),
        );
        self.grant_mission(&token_id, MissionId::FirstFill);
    }
}
