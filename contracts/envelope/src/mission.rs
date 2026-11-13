//! 미션 판정과 강화 티켓 지급, 체크인, 니어 행사 코드.
//! 소유자: B

use near_contract_standards::non_fungible_token::TokenId;
use near_sdk::serde_json::json;
use near_sdk::{env, near, require};

use crate::{events, Contract, ContractExt, MissionId, NearEvent, CHECK_IN_COOLDOWN_MS};

#[near]
impl Contract {
    /// 소유자만. CHECK_IN_COOLDOWN_MS마다 티켓 1장 (ERR_CHECK_IN_COOLDOWN).
    pub fn check_in(&mut self, token_id: TokenId) {
        self.assert_owner(&token_id);
        let now = Self::now_ms();
        let envelope = self.envelope_mut(&token_id);
        require!(
            envelope.last_check_in_ms == 0 || now >= envelope.last_check_in_ms + CHECK_IN_COOLDOWN_MS,
            "ERR_CHECK_IN_COOLDOWN: check-in is cooling down"
        );
        envelope.last_check_in_ms = now;
        envelope.enhance_tickets += 1;
    }

    /// 컨트랙트 소유자만. code_hash = sha256(code) 소문자 hex.
    pub fn add_near_event(
        &mut self,
        event_id: String,
        name: String,
        code_hash: String,
        tickets: u32,
        ends_at_ms: u64,
    ) {
        require!(
            env::predecessor_account_id() == self.tokens.owner_id,
            "ERR_NOT_ADMIN: only the contract owner can add events"
        );
        require!(
            !self.near_events.contains_key(&event_id),
            "ERR_EVENT_EXISTS: event_id already registered"
        );
        let code_hash = code_hash.to_lowercase();
        require!(
            code_hash.len() == 64 && code_hash.bytes().all(|b| b.is_ascii_hexdigit()),
            "ERR_INVALID_CODE: code_hash must be sha256 hex"
        );
        self.near_events.insert(event_id, NearEvent { name, code_hash, tickets, ends_at_ms });
    }

    /// 봉투 소유자만. 행사마다 계정당 1회, 보상은 token_id 봉투에 쌓인다.
    pub fn redeem_near_event(&mut self, token_id: TokenId, event_id: String, code: String) {
        let owner_id = self.assert_owner(&token_id);
        let event = self
            .near_events
            .get(&event_id)
            .cloned()
            .unwrap_or_else(|| env::panic_str("ERR_EVENT_NOT_FOUND: unknown event_id"));
        require!(Self::now_ms() < event.ends_at_ms, "ERR_EVENT_ENDED: event has ended");
        let key = (event_id.clone(), owner_id);
        require!(
            !self.near_event_redeemed.contains(&key),
            "ERR_ALREADY_REDEEMED: this account already used this event"
        );
        require!(
            to_hex(&env::sha256(code.trim().as_bytes())) == event.code_hash,
            "ERR_INVALID_CODE: wrong event code"
        );

        self.near_event_redeemed.insert(key);
        self.envelope_mut(&token_id).enhance_tickets += event.tickets;
        events::emit(
            "mission_complete",
            json!({
                "token_id": token_id,
                "mission": MissionId::NearEvent,
                "tickets": event.tickets,
                "event_id": event_id,
            }),
        );
    }
}

impl Contract {
    /// 1회성 미션 달성 처리. 이미 달성했으면 아무것도 하지 않고 false.
    /// 달성 시 missions_done 추가, 보상 티켓 지급, mission_complete 이벤트 → true.
    /// A(mint, fill, on_vault_deposit)와 B(gift)가 호출한다.
    pub(crate) fn grant_mission(&mut self, token_id: &TokenId, mission: MissionId) -> bool {
        let envelope = self.envelope_mut(token_id);
        if envelope.missions_done.contains(&mission) {
            return false;
        }
        let tickets = mission_reward(mission);
        envelope.missions_done.push(mission);
        envelope.enhance_tickets += tickets;
        events::emit(
            "mission_complete",
            json!({ "token_id": token_id, "mission": mission, "tickets": tickets }),
        );
        true
    }
}

pub(crate) fn mission_reward(mission: MissionId) -> u32 {
    match mission {
        MissionId::Welcome | MissionId::FirstFill | MissionId::FirstGift | MissionId::Journey3 => 1,
        MissionId::Regift | MissionId::Journey5 | MissionId::NewConnection => 2,
        MissionId::Journey10 => 3,
        // 행사마다 NearEvent.tickets를 쓴다. grant_mission 경로로 지급하지 않는다.
        MissionId::NearEvent => 0,
    }
}

fn to_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

#[cfg(test)]
mod tests {
    use near_sdk::test_utils::{accounts, VMContextBuilder};
    use near_sdk::testing_env;

    use super::*;
    use crate::EnvelopeState;

    /// sha256("ENVELOPE")
    const DEMO_CODE_HASH: &str = "5b50fc78d3eeb7e774e5aa20ceb2fd61562095db427f20166504d86c9c67fad1";

    fn setup(predecessor: usize, now_ms: u64) -> Contract {
        let mut contract = Contract::new(accounts(0), None);
        set_context(predecessor, now_ms);
        let token_id = "1".to_string();
        contract.envelopes.insert(token_id.clone(), EnvelopeState::new(accounts(1), 0, 0));
        let metadata = contract.token_metadata(&token_id);
        contract.tokens.internal_mint_with_refund(token_id, accounts(1), Some(metadata), None);
        contract.known_accounts.insert(accounts(1));
        contract
    }

    fn set_context(predecessor: usize, now_ms: u64) {
        testing_env!(VMContextBuilder::new()
            .predecessor_account_id(accounts(predecessor))
            .block_timestamp(now_ms * 1_000_000)
            .build());
    }

    fn tickets(contract: &Contract) -> u32 {
        contract.envelope(&"1".to_string()).enhance_tickets
    }

    #[test]
    fn grant_mission_once() {
        let mut contract = setup(1, 1);
        let id = "1".to_string();
        assert!(contract.grant_mission(&id, MissionId::Regift));
        assert!(!contract.grant_mission(&id, MissionId::Regift));
        assert_eq!(tickets(&contract), 2);
    }

    #[test]
    fn transfers_grant_journey_and_new_connection() {
        let mut contract = setup(1, 1);
        let id = "1".to_string();
        contract.on_envelope_transferred(&id, accounts(1), accounts(2), None);
        contract.on_envelope_transferred(&id, accounts(2), accounts(3), None);
        // 같은 계정에게 다시 가면 신규도, 새 소유자도 아니다
        contract.on_envelope_transferred(&id, accounts(3), accounts(1), None);
        let done = &contract.envelope(&id).missions_done;
        assert_eq!(
            done,
            &[MissionId::FirstGift, MissionId::NewConnection, MissionId::Regift, MissionId::Journey3]
        );
        // FirstGift 1 + NewConnection 2 + Regift 2 + Journey3 1
        assert_eq!(tickets(&contract), 6);
    }

    #[test]
    fn check_in_cooldown() {
        let mut contract = setup(1, 1_000);
        contract.check_in("1".to_string());
        set_context(1, 1_000 + CHECK_IN_COOLDOWN_MS);
        contract.check_in("1".to_string());
        assert_eq!(tickets(&contract), 2);
    }

    #[test]
    #[should_panic(expected = "ERR_CHECK_IN_COOLDOWN")]
    fn check_in_too_soon() {
        let mut contract = setup(1, 1_000);
        contract.check_in("1".to_string());
        contract.check_in("1".to_string());
    }

    fn with_event(contract: &mut Contract) {
        set_context(0, 1);
        contract.add_near_event("demo".into(), "Demo".into(), DEMO_CODE_HASH.into(), 2, 10_000);
        set_context(1, 1);
    }

    #[test]
    fn redeem_event() {
        let mut contract = setup(1, 1);
        with_event(&mut contract);
        contract.redeem_near_event("1".into(), "demo".into(), " ENVELOPE ".into());
        assert_eq!(tickets(&contract), 2);
        assert!(contract.near_event_redeemed("demo".into(), accounts(1)));
    }

    #[test]
    #[should_panic(expected = "ERR_ALREADY_REDEEMED")]
    fn redeem_event_twice() {
        let mut contract = setup(1, 1);
        with_event(&mut contract);
        contract.redeem_near_event("1".into(), "demo".into(), "ENVELOPE".into());
        contract.redeem_near_event("1".into(), "demo".into(), "ENVELOPE".into());
    }

    #[test]
    #[should_panic(expected = "ERR_INVALID_CODE")]
    fn redeem_event_wrong_code() {
        let mut contract = setup(1, 1);
        with_event(&mut contract);
        contract.redeem_near_event("1".into(), "demo".into(), "NOPE".into());
    }

    #[test]
    #[should_panic(expected = "ERR_EVENT_ENDED")]
    fn redeem_event_ended() {
        let mut contract = setup(1, 1);
        with_event(&mut contract);
        set_context(1, 10_000);
        contract.redeem_near_event("1".into(), "demo".into(), "ENVELOPE".into());
    }

    #[test]
    #[should_panic(expected = "ERR_NOT_ADMIN")]
    fn add_event_not_admin() {
        let mut contract = setup(1, 1);
        contract.add_near_event("demo".into(), "Demo".into(), DEMO_CODE_HASH.into(), 2, 10_000);
    }
}
