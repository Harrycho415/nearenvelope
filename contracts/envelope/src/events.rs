//! NEP-297 커스텀 이벤트 (standard = "near_envelope"). 이벤트 목록은 INTERFACE.md.
//! 소유자: B

use near_sdk::env;
use near_sdk::serde_json::{json, Value};

#[allow(dead_code)]
pub(crate) fn emit(event: &str, data: Value) {
    let log = json!({
        "standard": "near_envelope",
        "version": "1.0.0",
        "event": event,
        "data": [data],
    });
    env::log_str(&format!("EVENT_JSON:{log}"));
}
