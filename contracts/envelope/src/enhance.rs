//! 강화: 확률표, 레벨·희귀도, 토큰 메타데이터 갱신.
//! 소유자: B

use near_contract_standards::non_fungible_token::TokenId;
use near_sdk::near;

use crate::{Contract, ContractExt, EnhanceResult};

/// index = 현재 레벨, 값 = 성공 확률 (basis point, 10000 = 100%). INTERFACE.md와 일치시킬 것.
pub const ENHANCE_TABLE: [u16; 10] = [10_000, 9_000, 8_000, 7_000, 6_000, 5_000, 4_000, 3_000, 2_000, 1_000];

#[near]
impl Contract {
    /// 소유자만. 1 yocto. 티켓 1장 소모 (ERR_NO_TICKET), MAX_LEVEL이면 ERR_MAX_LEVEL.
    /// env::random_seed()로 판정 → 성공 시 level+1, refresh_token_metadata → envelope_enhance 이벤트.
    #[payable]
    pub fn enhance(&mut self, token_id: TokenId) -> EnhanceResult {
        let _ = token_id;
        todo!("B: enhance")
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
        let _ = token_id;
        todo!("B: refresh_token_metadata")
    }
}
