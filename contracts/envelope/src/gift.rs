//! 선물하기: send_envelope, 전달 기록, 메시지.
//! 소유자: B

use near_contract_standards::non_fungible_token::TokenId;
use near_sdk::{near, AccountId};

use crate::{Contract, ContractExt};

#[near]
impl Contract {
    /// 소유자만. 1 yocto. message ≤ MESSAGE_MAX_LEN (ERR_MESSAGE_TOO_LONG).
    /// 내부적으로 `self.tokens.internal_transfer` 후 `on_envelope_transferred(.., message)`.
    #[payable]
    pub fn send_envelope(&mut self, token_id: TokenId, receiver_id: AccountId, message: Option<String>) {
        let _ = (token_id, receiver_id, message);
        todo!("B: send_envelope")
    }
}

impl Contract {
    /// 전송이 확정될 때마다 호출되는 훅 (nft_core.rs·send_envelope에서 호출).
    /// history 추가 → envelope_gift 이벤트 → FirstGift / Regift 미션 판정.
    /// Regift 판정은 history 추가 *전* 상태 기준 (이미 한 번 이상 전달된 봉투인지).
    pub(crate) fn on_envelope_transferred(
        &mut self,
        token_id: &TokenId,
        from: AccountId,
        to: AccountId,
        message: Option<String>,
    ) {
        let _ = (token_id, from, to, message);
        todo!("B: on_envelope_transferred")
    }
}
