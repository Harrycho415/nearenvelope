//! 선물하기: send_envelope, 전달 기록, 메시지.
//! 소유자: B

use std::collections::HashSet;

use near_contract_standards::non_fungible_token::TokenId;
use near_sdk::serde_json::json;
use near_sdk::{assert_one_yocto, near, require, AccountId};

use crate::{events, Contract, ContractExt, MissionId, TransferRecord, MESSAGE_MAX_LEN};

/// (서로 다른 소유자 수, 미션). INTERFACE.md `JOURNEY_MILESTONES`
const JOURNEY_MILESTONES: [(usize, MissionId); 3] = [
    (3, MissionId::Journey3),
    (5, MissionId::Journey5),
    (10, MissionId::Journey10),
];

#[near]
impl Contract {
    /// 소유자만. 1 yocto. message ≤ MESSAGE_MAX_LEN (ERR_MESSAGE_TOO_LONG).
    /// 내부적으로 `self.tokens.internal_transfer` 후 `on_envelope_transferred(.., message)`.
    #[payable]
    pub fn send_envelope(&mut self, token_id: TokenId, receiver_id: AccountId, message: Option<String>) {
        assert_one_yocto();
        let owner_id = self.assert_owner(&token_id);
        let message = message.filter(|m| !m.is_empty());
        if let Some(m) = &message {
            require!(
                m.chars().count() <= MESSAGE_MAX_LEN,
                "ERR_MESSAGE_TOO_LONG: message exceeds MESSAGE_MAX_LEN"
            );
        }
        self.tokens
            .internal_transfer(&owner_id, &receiver_id, &token_id, None, None);
        self.on_envelope_transferred(&token_id, owner_id, receiver_id, message);
    }
}

impl Contract {
    /// 전송이 확정될 때마다 호출되는 훅 (nft_core.rs·send_envelope에서 호출).
    /// history 추가 → envelope_gift 이벤트 → FirstGift / Regift / NewConnection / Journey 판정.
    /// Regift 판정은 history 추가 *전* 상태 기준 (이미 한 번 이상 전달된 봉투인지).
    pub(crate) fn on_envelope_transferred(
        &mut self,
        token_id: &TokenId,
        from: AccountId,
        to: AccountId,
        message: Option<String>,
    ) {
        let newcomer = !self.known_accounts.contains(&to);
        let has_message = message.is_some();
        let at_ms = Self::now_ms();

        let envelope = self.envelope_mut(token_id);
        let regift = !envelope.history.is_empty();
        envelope.history.push(TransferRecord { from: from.clone(), to: to.clone(), at_ms, message });
        let owners: HashSet<&AccountId> = std::iter::once(&envelope.creator_id)
            .chain(envelope.history.iter().map(|r| &r.to))
            .collect();
        let owner_count = owners.len();

        events::emit(
            "envelope_gift",
            json!({ "token_id": token_id, "from": from, "to": to, "has_message": has_message }),
        );

        self.grant_mission(token_id, MissionId::FirstGift);
        if regift {
            self.grant_mission(token_id, MissionId::Regift);
        }
        if newcomer {
            self.grant_mission(token_id, MissionId::NewConnection);
            self.known_accounts.insert(to);
        }
        for (count, mission) in JOURNEY_MILESTONES {
            if owner_count >= count {
                self.grant_mission(token_id, mission);
            }
        }
    }
}
