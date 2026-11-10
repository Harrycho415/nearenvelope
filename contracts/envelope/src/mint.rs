//! mint: NFT 발행 + 하위 계정(Vault) 생성·배포·초기화.
//! 소유자: A

use near_contract_standards::non_fungible_token::TokenId;
use near_sdk::json_types::U128;
use near_sdk::{near, AccountId};

use crate::{Contract, ContractExt};

#[allow(dead_code)]
pub(crate) const VAULT_WASM: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/vault.wasm"));

#[near]
impl Contract {
    /// INTERFACE.md `mint`. 첨부액 ≥ MINT_DEPOSIT.
    /// 1) design 검증 (< DESIGN_COUNT, 아니면 ERR_INVALID_DESIGN)
    /// 2) next_token_id로 토큰 발행 (`self.tokens.internal_mint`) + EnvelopeState 저장
    ///    + 초기 메타데이터 (`refresh_token_metadata`, enhance.rs)
    /// 3) Promise: CreateAccount(vault_id) → Transfer(잔액) → DeployContract(VAULT_WASM)
    ///    → FunctionCall new(controller_id, token_id) → then on_vault_created
    /// 4) grant_mission(Welcome) (mission.rs)
    #[payable]
    pub fn mint(&mut self, design: u8) -> TokenId {
        let _ = design;
        todo!("A: mint")
    }

    /// Vault 생성 실패 시 토큰·상태를 롤백하고 deposit을 minter에게 환불한다.
    #[private]
    pub fn on_vault_created(&mut self, token_id: TokenId, minter_id: AccountId, deposit: U128) -> bool {
        let _ = (token_id, minter_id, deposit);
        todo!("A: on_vault_created")
    }
}
