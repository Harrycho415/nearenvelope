//! Envelope Vault — 각 Envelope NFT에 연결된 하위 계정에 배포되는 컨트랙트.
//!
//! Access Key가 없으므로 이 계정의 자산은 오직 `controller`(Envelope NFT 컨트랙트)의
//! 호출로만 움직인다. 소유자 확인은 controller가 한다. (docs/ARCHITECTURE.md 보안 모델)
//! 소유자: A

use near_sdk::json_types::U128;
use near_sdk::{
    env, ext_contract, near, require, AccountId, Gas, NearToken, PanicOnDefault, Promise,
    PromiseOrValue,
};

const GAS_FT_TRANSFER: Gas = Gas::from_tgas(10);
const GAS_FT_STORAGE_DEPOSIT: Gas = Gas::from_tgas(10);
const GAS_ON_VAULT_DEPOSIT: Gas = Gas::from_tgas(15);
/// 스토리지 비용 외에 항상 남겨 두는 여유분 (향후 FT 호출 수수료 등)
const BALANCE_RESERVE: NearToken = NearToken::from_millinear(50);

#[ext_contract(ext_ft)]
#[allow(dead_code)]
trait FungibleToken {
    fn ft_transfer(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>);
    fn storage_deposit(&mut self, account_id: Option<AccountId>, registration_only: Option<bool>);
}

#[ext_contract(ext_envelope)]
#[allow(dead_code)]
trait Envelope {
    fn on_vault_deposit(&mut self, token_id: String, ft_contract_id: AccountId, amount: U128);
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Vault {
    controller_id: AccountId,
    token_id: String,
}

#[near]
impl Vault {
    #[init]
    pub fn new(controller_id: AccountId, token_id: String) -> Self {
        Self { controller_id, token_id }
    }

    pub fn withdraw_near(&mut self, amount: U128, receiver_id: AccountId) -> Promise {
        self.assert_controller();
        let amount = NearToken::from_yoctonear(amount.0);
        require!(
            amount <= self.withdrawable_near(),
            "ERR_INSUFFICIENT_BALANCE: amount exceeds withdrawable balance"
        );
        Promise::new(receiver_id).transfer(amount)
    }

    pub fn ft_transfer(
        &mut self,
        ft_contract_id: AccountId,
        amount: U128,
        receiver_id: AccountId,
    ) -> Promise {
        self.assert_controller();
        ext_ft::ext(ft_contract_id)
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(GAS_FT_TRANSFER)
            .ft_transfer(receiver_id, amount, None)
    }

    #[payable]
    pub fn ft_storage_deposit(&mut self, ft_contract_id: AccountId) -> Promise {
        self.assert_controller();
        ext_ft::ext(ft_contract_id)
            .with_attached_deposit(env::attached_deposit())
            .with_static_gas(GAS_FT_STORAGE_DEPOSIT)
            .storage_deposit(Some(env::current_account_id()), Some(true))
    }

    /// NEP-141 receiver. 받은 FT는 전액 보관하고 controller에 입금 사실을 알린다.
    /// TODO(A): controller가 허용한 FT만 미션에 반영하도록 envelope 쪽에서 화이트리스트 확인
    pub fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128> {
        let _ = (sender_id, msg);
        let _ = ext_envelope::ext(self.controller_id.clone())
            .with_static_gas(GAS_ON_VAULT_DEPOSIT)
            .on_vault_deposit(self.token_id.clone(), env::predecessor_account_id(), amount);
        PromiseOrValue::Value(U128(0))
    }

    pub fn controller(&self) -> AccountId {
        self.controller_id.clone()
    }

    pub fn token_id(&self) -> String {
        self.token_id.clone()
    }

    pub fn withdrawable(&self) -> U128 {
        U128(self.withdrawable_near().as_yoctonear())
    }
}

impl Vault {
    fn assert_controller(&self) {
        require!(
            env::predecessor_account_id() == self.controller_id,
            "ERR_NOT_CONTROLLER: only the envelope contract can call this"
        );
    }

    fn withdrawable_near(&self) -> NearToken {
        let storage_cost = env::storage_byte_cost().saturating_mul(env::storage_usage() as u128);
        env::account_balance()
            .saturating_sub(storage_cost)
            .saturating_sub(BALANCE_RESERVE)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::{accounts, VMContextBuilder};
    use near_sdk::testing_env;

    fn setup(predecessor: AccountId) -> Vault {
        let mut ctx = VMContextBuilder::new();
        ctx.current_account_id("1.envelope.testnet".parse().unwrap())
            .predecessor_account_id(predecessor);
        testing_env!(ctx.build());
        Vault::new(accounts(0), "1".to_string())
    }

    #[test]
    #[should_panic(expected = "ERR_NOT_CONTROLLER")]
    fn non_controller_cannot_withdraw() {
        let mut vault = setup(accounts(1));
        vault.withdraw_near(U128(1), accounts(1));
    }

    #[test]
    #[should_panic(expected = "ERR_NOT_CONTROLLER")]
    fn non_controller_cannot_transfer_ft() {
        let mut vault = setup(accounts(1));
        vault.ft_transfer(accounts(2), U128(1), accounts(1));
    }
}
