//! mint: NFT 발행 + 하위 계정(Vault) 생성·배포·초기화.
//! 소유자: A

use near_contract_standards::non_fungible_token::events::{NftBurn, NftMint};
use near_contract_standards::non_fungible_token::TokenId;
use near_sdk::json_types::U128;
use near_sdk::serde_json::json;
use near_sdk::{env, near, require, AccountId, Gas, NearToken, Promise, PromiseError};

use crate::{
    Contract, ContractExt, EnvelopeState, MissionId, DESIGN_COUNT, ENVELOPE_STORAGE_BUFFER,
    MINT_DEPOSIT,
};

pub(crate) const VAULT_WASM: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/vault.wasm"));

const GAS_VAULT_INIT: Gas = Gas::from_tgas(10);
const GAS_ON_VAULT_CREATED: Gas = Gas::from_tgas(15);

#[near]
impl Contract {
    /// INTERFACE.md `mint`. 첨부액 ≥ MINT_DEPOSIT.
    /// 1) design 검증 (< DESIGN_COUNT, 아니면 ERR_INVALID_DESIGN)
    /// 2) next_token_id로 토큰 발행 + EnvelopeState 저장 + 초기 메타데이터
    /// 3) Promise: CreateAccount(vault_id) → Transfer(잔액) → DeployContract(VAULT_WASM)
    ///    → FunctionCall new(controller_id, token_id) → then on_vault_created
    /// 4) grant_mission(Welcome)
    #[payable]
    pub fn mint(&mut self, design: u8) -> TokenId {
        let deposit = env::attached_deposit();
        require!(
            deposit >= MINT_DEPOSIT,
            "ERR_INSUFFICIENT_DEPOSIT: attach at least MINT_DEPOSIT"
        );
        require!(design < DESIGN_COUNT, "ERR_INVALID_DESIGN: unknown design");
        require!(!VAULT_WASM.is_empty(), "vault.wasm missing: run scripts/build-contracts.sh");

        let minter_id = env::predecessor_account_id();
        let token_id = self.next_token_id.to_string();
        self.next_token_id += 1;
        let storage_before = env::storage_usage();

        self.envelopes.insert(
            token_id.clone(),
            EnvelopeState::new(minter_id.clone(), design, Self::now_ms()),
        );
        let metadata = self.token_metadata(&token_id);
        self.tokens
            .internal_mint_with_refund(token_id.clone(), minter_id.clone(), Some(metadata), None);
        NftMint { owner_id: &minter_id, token_ids: &[&token_id], memo: None }.emit();
        self.known_accounts.insert(minter_id.clone());
        self.grant_mission(&token_id, MissionId::Welcome);

        // store:: 컬렉션은 함수 끝에서 기록되므로 미리 flush해 실제 사용량을 잰다
        self.envelopes.flush();
        let storage_cost = env::storage_byte_cost()
            .saturating_mul((env::storage_usage().saturating_sub(storage_before)) as u128);
        let vault_amount = deposit
            .checked_sub(storage_cost)
            .and_then(|rest| rest.checked_sub(ENVELOPE_STORAGE_BUFFER))
            .unwrap_or_else(|| env::panic_str("ERR_INSUFFICIENT_DEPOSIT: storage cost exceeds deposit"));

        Promise::new(Self::vault_id(&token_id))
            .create_account()
            .transfer(vault_amount)
            .deploy_contract(VAULT_WASM.to_vec())
            .function_call(
                "new".to_string(),
                json!({ "controller_id": env::current_account_id(), "token_id": token_id })
                    .to_string()
                    .into_bytes(),
                NearToken::from_yoctonear(0),
                GAS_VAULT_INIT,
            )
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_ON_VAULT_CREATED)
                    .on_vault_created(token_id.clone(), minter_id, U128(deposit.as_yoctonear())),
            )
            .detach();

        token_id
    }

    /// Vault 생성 실패 시 토큰·상태를 롤백하고 deposit을 minter에게 환불한다.
    #[private]
    pub fn on_vault_created(
        &mut self,
        token_id: TokenId,
        minter_id: AccountId,
        deposit: U128,
        #[callback_result] created: Result<(), PromiseError>,
    ) -> bool {
        if created.is_ok() {
            return true;
        }

        // 실패한 배치의 Transfer 금액은 이 컨트랙트로 되돌아온다
        if let Some(owner_id) = self.tokens.owner_by_id.remove(&token_id) {
            if let Some(per_owner) = &mut self.tokens.tokens_per_owner {
                if let Some(mut set) = per_owner.get(&owner_id) {
                    set.remove(&token_id);
                    if set.is_empty() {
                        per_owner.remove(&owner_id);
                    } else {
                        per_owner.insert(&owner_id, &set);
                    }
                }
            }
            if let Some(metadata) = &mut self.tokens.token_metadata_by_id {
                metadata.remove(&token_id);
            }
            if let Some(approvals) = &mut self.tokens.approvals_by_id {
                approvals.remove(&token_id);
            }
            NftBurn {
                owner_id: &owner_id,
                token_ids: &[&token_id],
                authorized_id: None,
                memo: Some("vault creation failed"),
            }
            .emit();
        }
        self.envelopes.remove(&token_id);
        Promise::new(minter_id).transfer(NearToken::from_yoctonear(deposit.0)).detach();
        false
    }
}
