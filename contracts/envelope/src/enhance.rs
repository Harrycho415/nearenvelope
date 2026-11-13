//! 강화: 확률표, 레벨·희귀도, 토큰 메타데이터 갱신.
//! 소유자: B

use near_contract_standards::non_fungible_token::metadata::TokenMetadata;
use near_contract_standards::non_fungible_token::TokenId;
use near_sdk::serde_json::json;
use near_sdk::{assert_one_yocto, env, near, require};

use crate::{events, Contract, ContractExt, EnhanceResult, Rarity, MAX_LEVEL};

/// index = 현재 레벨, 값 = 성공 확률 (basis point, 10000 = 100%). INTERFACE.md와 일치시킬 것.
pub const ENHANCE_TABLE: [u16; 10] = [10_000, 9_000, 8_000, 7_000, 6_000, 5_000, 4_000, 3_000, 2_000, 1_000];

#[near]
impl Contract {
    /// 소유자만. 1 yocto. 티켓 1장 소모 (ERR_NO_TICKET), MAX_LEVEL이면 ERR_MAX_LEVEL.
    /// env::random_seed()로 판정 → 성공 시 level+1, refresh_token_metadata → envelope_enhance 이벤트.
    #[payable]
    pub fn enhance(&mut self, token_id: TokenId) -> EnhanceResult {
        assert_one_yocto();
        self.assert_owner(&token_id);

        let envelope = self.envelope_mut(&token_id);
        let level_before = envelope.level;
        require!(level_before < MAX_LEVEL, "ERR_MAX_LEVEL: envelope is already at max level");
        require!(envelope.enhance_tickets > 0, "ERR_NO_TICKET: no enhancement tickets left");
        envelope.enhance_tickets -= 1;
        envelope.enhance_attempts += 1;

        // 같은 블록의 여러 강화가 같은 결과를 내지 않도록 토큰·시도 횟수를 섞는다
        let mut input = env::random_seed();
        input.extend_from_slice(token_id.as_bytes());
        input.extend_from_slice(&envelope.enhance_attempts.to_le_bytes());
        let hash = env::sha256(&input);
        let roll = u16::from_le_bytes([hash[0], hash[1]]) % 10_000;
        let success = roll < ENHANCE_TABLE[level_before as usize];
        if success {
            envelope.level += 1;
        }
        let level_after = envelope.level;
        let rarity = Rarity::from_level(level_after);

        if success {
            self.refresh_token_metadata(&token_id);
        }
        events::emit(
            "envelope_enhance",
            json!({
                "token_id": token_id,
                "success": success,
                "level_before": level_before,
                "level_after": level_after,
            }),
        );
        EnhanceResult { success, level_before, level_after, rarity }
    }

    pub fn enhance_table(&self) -> Vec<u16> {
        ENHANCE_TABLE.to_vec()
    }
}

impl Contract {
    /// NEP-177 메타데이터의 title/media를 현재 레벨·희귀도에 맞게 갱신.
    /// title = "{Rarity} Envelope +{level}", media = "designs/{design}/{rarity 소문자}.svg"
    /// mint(A)에서도 초기 메타데이터 설정에 사용한다.
    pub(crate) fn refresh_token_metadata(&mut self, token_id: &TokenId) {
        let fresh = self.token_metadata(token_id);
        if let Some(by_id) = &mut self.tokens.token_metadata_by_id {
            let metadata = match by_id.get(token_id) {
                Some(existing) => TokenMetadata { title: fresh.title, media: fresh.media, ..existing },
                None => fresh,
            };
            by_id.insert(token_id, &metadata);
        }
    }

    /// 현재 레벨 기준 메타데이터 (mint 초기값 겸용)
    pub(crate) fn token_metadata(&self, token_id: &TokenId) -> TokenMetadata {
        let envelope = self.envelope(token_id);
        let rarity = Rarity::from_level(envelope.level);
        TokenMetadata {
            title: Some(format!("{} Envelope +{}", rarity.as_str(), envelope.level)),
            description: Some("An envelope that owns its own assets. Whoever holds it controls the vault.".into()),
            media: Some(format!(
                "designs/{}/{}.svg",
                envelope.design,
                rarity.as_str().to_lowercase()
            )),
            media_hash: None,
            copies: Some(1),
            issued_at: Some(envelope.created_at_ms.to_string()),
            expires_at: None,
            starts_at: None,
            updated_at: None,
            extra: None,
            reference: None,
            reference_hash: None,
        }
    }
}
