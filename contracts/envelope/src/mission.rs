//! 미션 판정과 강화 티켓 지급.
//! 소유자: B

use near_contract_standards::non_fungible_token::TokenId;
use near_sdk::near;

use crate::{Contract, ContractExt, MissionId};

#[near]
impl Contract {
    /// 소유자만. CHECK_IN_COOLDOWN_MS마다 티켓 1장 (ERR_CHECK_IN_COOLDOWN).
    pub fn check_in(&mut self, token_id: TokenId) {
        let _ = token_id;
        todo!("B: check_in")
    }
}

impl Contract {
    /// 1회성 미션 달성 처리. 이미 달성했으면 아무것도 하지 않고 false.
    /// 달성 시 missions_done 추가, 보상 티켓 지급, mission_complete 이벤트 → true.
    /// A(mint, fill, on_vault_deposit)와 B(gift)가 호출한다.
    pub(crate) fn grant_mission(&mut self, token_id: &TokenId, mission: MissionId) -> bool {
        let _ = (token_id, mission);
        todo!("B: grant_mission")
    }
}

#[allow(dead_code)]
pub(crate) fn mission_reward(mission: MissionId) -> u32 {
    match mission {
        MissionId::Welcome | MissionId::FirstFill | MissionId::FirstGift => 1,
        MissionId::Regift => 2,
    }
}
