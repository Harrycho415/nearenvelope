//! MVP 핵심 시나리오. 데모 영상·README의 근거가 되는 테스트다.
//! 실행 전 `scripts/build-contracts.sh`로 wasm을 빌드해야 한다.
//! 소유자: B (A는 자기 기능 시나리오를 별도 파일로 추가)

use near_workspaces::types::NearToken;
use serde_json::json;

const ENVELOPE_WASM: &str = "../target/near/envelope/envelope.wasm";
const MOCK_FT_WASM: &str = "../target/near/mock_ft/mock_ft.wasm";

#[tokio::test]
#[ignore = "mint/claim/send_envelope 구현 후 활성화"]
async fn ownership_transfers_vault_control() -> anyhow::Result<()> {
    let sandbox = near_workspaces::sandbox().await?;
    let envelope = sandbox.dev_deploy(&std::fs::read(ENVELOPE_WASM)?).await?;
    let _usdc = sandbox.dev_deploy(&std::fs::read(MOCK_FT_WASM)?).await?;
    let alice = sandbox.dev_create_account().await?;
    let bob = sandbox.dev_create_account().await?;

    envelope
        .call("new")
        .args_json(json!({ "owner_id": envelope.id() }))
        .transact()
        .await?
        .into_result()?;

    // 1. alice mint
    let token_id: String = alice
        .call(envelope.id(), "mint")
        .args_json(json!({ "design": 0 }))
        .deposit(NearToken::from_near(2))
        .max_gas()
        .transact()
        .await?
        .json()?;

    // 2. alice fill 1 NEAR
    // 3. alice send_envelope → bob (message)
    // 4. alice claim_near → ERR_NOT_OWNER
    // 5. bob claim_near → 성공, bob 잔액 증가 확인
    // 6. envelope_info: history 1건, FirstFill/FirstGift 미션 확인
    let _ = (token_id, bob);
    todo!("B: 시나리오 완성")
}
