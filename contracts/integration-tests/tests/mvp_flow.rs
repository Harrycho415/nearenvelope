//! MVP 핵심 시나리오. 데모 영상·README의 근거가 되는 테스트다.
//! 실행 전 `scripts/build-contracts.sh`로 wasm을 빌드해야 한다.
//! 소유자: B (A는 자기 기능 시나리오를 별도 파일로 추가)

use near_workspaces::result::ExecutionFinalResult;
use near_workspaces::types::NearToken;
use near_workspaces::{Account, Contract};
use serde_json::{json, Value};

const ENVELOPE_WASM: &str = "../target/near/envelope/envelope.wasm";
const MOCK_FT_WASM: &str = "../target/near/mock_ft/mock_ft.wasm";
/// sha256("ENVELOPE")
const DEMO_CODE_HASH: &str = "5b50fc78d3eeb7e774e5aa20ceb2fd61562095db427f20166504d86c9c67fad1";

fn assert_err(result: ExecutionFinalResult, code: &str) {
    let err = format!("{:?}", result.into_result().expect_err("expected failure"));
    assert!(err.contains(code), "expected {code}, got {err}");
}

async fn info(envelope: &Contract, token_id: &str) -> anyhow::Result<Value> {
    Ok(envelope.view("envelope_info").args_json(json!({ "token_id": token_id })).await?.json()?)
}

fn missions(v: &Value) -> Vec<String> {
    v["missions_done"].as_array().unwrap().iter().map(|m| m.as_str().unwrap().to_string()).collect()
}

async fn send(from: &Account, envelope: &Contract, token_id: &str, to: &Account, message: Option<&str>) -> anyhow::Result<()> {
    from.call(envelope.id(), "send_envelope")
        .args_json(json!({ "token_id": token_id, "receiver_id": to.id(), "message": message }))
        .deposit(NearToken::from_yoctonear(1))
        .transact()
        .await?
        .into_result()?;
    Ok(())
}

#[tokio::test]
async fn ownership_transfers_vault_control() -> anyhow::Result<()> {
    let sandbox = near_workspaces::sandbox().await?;
    let envelope = sandbox.dev_deploy(&std::fs::read(ENVELOPE_WASM)?).await?;
    let usdc = sandbox.dev_deploy(&std::fs::read(MOCK_FT_WASM)?).await?;
    let alice = sandbox.dev_create_account().await?;
    let bob = sandbox.dev_create_account().await?;
    let carol = sandbox.dev_create_account().await?;

    envelope.call("new").args_json(json!({ "owner_id": envelope.id() })).transact().await?.into_result()?;
    usdc.call("new").transact().await?.into_result()?;

    // 1. alice mint → Vault 하위 계정 생성, Welcome
    let token_id: String = alice
        .call(envelope.id(), "mint")
        .args_json(json!({ "design": 0 }))
        .deposit(NearToken::from_near(2))
        .max_gas()
        .transact()
        .await?
        .into_result()?
        .json()?;
    let vault_id = format!("{token_id}.{}", envelope.id());
    let withdrawable: String = sandbox.view(&vault_id.parse()?, "withdrawable").await?.json()?;
    assert!(withdrawable.parse::<u128>()? > 0, "vault should hold the leftover mint deposit");
    let e = info(&envelope, &token_id).await?;
    assert_eq!(e["owner_id"], alice.id().as_str());
    assert_eq!(missions(&e), ["Welcome"]);

    // 2. alice fill 1 NEAR, USDC 10 입금 → FirstFill
    alice
        .call(envelope.id(), "fill")
        .args_json(json!({ "token_id": token_id }))
        .deposit(NearToken::from_near(1))
        .transact()
        .await?
        .into_result()?;
    alice.call(usdc.id(), "faucet").args_json(json!({ "amount": "100000000" })).transact().await?.into_result()?;
    alice
        .call(envelope.id(), "register_ft")
        .args_json(json!({ "token_id": token_id, "ft_contract_id": usdc.id() }))
        .deposit(NearToken::from_millinear(10))
        .max_gas()
        .transact()
        .await?
        .into_result()?;
    alice
        .call(usdc.id(), "ft_transfer_call")
        .args_json(json!({ "receiver_id": vault_id, "amount": "10000000", "msg": "" }))
        .deposit(NearToken::from_yoctonear(1))
        .max_gas()
        .transact()
        .await?
        .into_result()?;
    let vault_usdc: String = usdc.view("ft_balance_of").args_json(json!({ "account_id": vault_id })).await?.json()?;
    assert_eq!(vault_usdc, "10000000");

    // 3. alice → bob (메시지) : FirstGift + NewConnection
    send(&alice, &envelope, &token_id, &bob, Some("생일 축하해!")).await?;
    let e = info(&envelope, &token_id).await?;
    assert_eq!(e["owner_id"], bob.id().as_str());
    assert_eq!(e["history"][0]["message"], "생일 축하해!");
    assert_eq!(missions(&e), ["Welcome", "FirstFill", "FirstGift", "NewConnection"]);

    // 4. 이전 소유자 출금 실패
    let res = alice
        .call(envelope.id(), "claim_near")
        .args_json(json!({ "token_id": token_id, "amount": NearToken::from_near(1).as_yoctonear().to_string() }))
        .deposit(NearToken::from_yoctonear(1))
        .max_gas()
        .transact()
        .await?;
    assert_err(res, "ERR_NOT_OWNER");

    // 5. 새 소유자 출금 성공 (NEAR, USDC)
    let before = bob.view_account().await?.balance;
    bob.call(envelope.id(), "claim_near")
        .args_json(json!({ "token_id": token_id, "amount": NearToken::from_near(1).as_yoctonear().to_string() }))
        .deposit(NearToken::from_yoctonear(1))
        .max_gas()
        .transact()
        .await?
        .into_result()?;
    let after = bob.view_account().await?.balance;
    assert!(after > before.saturating_add(NearToken::from_millinear(990)), "bob should receive ~1 NEAR");

    bob.call(usdc.id(), "storage_deposit")
        .args_json(json!({}))
        .deposit(NearToken::from_millinear(10))
        .transact()
        .await?
        .into_result()?;
    bob.call(envelope.id(), "claim_ft")
        .args_json(json!({ "token_id": token_id, "ft_contract_id": usdc.id(), "amount": "4000000" }))
        .deposit(NearToken::from_yoctonear(1))
        .max_gas()
        .transact()
        .await?
        .into_result()?;
    let bob_usdc: String = usdc.view("ft_balance_of").args_json(json!({ "account_id": bob.id() })).await?.json()?;
    assert_eq!(bob_usdc, "4000000");

    // 6. bob → carol : Regift + Journey3 (alice, bob, carol)
    send(&bob, &envelope, &token_id, &carol, None).await?;
    let e = info(&envelope, &token_id).await?;
    assert_eq!(
        missions(&e),
        ["Welcome", "FirstFill", "FirstGift", "NewConnection", "Regift", "Journey3"]
    );
    // 1 + 1 + 1 + 2 + 2 + 1
    assert_eq!(e["enhance_tickets"], 8);

    // 7. 강화 (레벨 0은 100%)
    let result: Value = carol
        .call(envelope.id(), "enhance")
        .args_json(json!({ "token_id": token_id }))
        .deposit(NearToken::from_yoctonear(1))
        .transact()
        .await?
        .into_result()?
        .json()?;
    assert_eq!(result["success"], true);
    assert_eq!(result["level_after"], 1);
    let token: Value = envelope.view("nft_token").args_json(json!({ "token_id": token_id })).await?.json()?;
    assert_eq!(token["metadata"]["title"], "Basic Envelope +1");

    // 8. 체크인: 1회 성공, 바로 다시 하면 쿨다운
    carol.call(envelope.id(), "check_in").args_json(json!({ "token_id": token_id })).transact().await?.into_result()?;
    let res = carol.call(envelope.id(), "check_in").args_json(json!({ "token_id": token_id })).transact().await?;
    assert_err(res, "ERR_CHECK_IN_COOLDOWN");

    // 9. 니어 행사 코드
    let add_event = json!({
        "event_id": "demo",
        "name": "Demo Day",
        "code_hash": DEMO_CODE_HASH,
        "tickets": 2,
        "ends_at_ms": 4_000_000_000_000u64,
    });
    let res = carol.call(envelope.id(), "add_near_event").args_json(&add_event).transact().await?;
    assert_err(res, "ERR_NOT_ADMIN");
    envelope.call("add_near_event").args_json(&add_event).transact().await?.into_result()?;

    let redeem = |code: &'static str| {
        carol
            .call(envelope.id(), "redeem_near_event")
            .args_json(json!({ "token_id": token_id, "event_id": "demo", "code": code }))
            .transact()
    };
    assert_err(redeem("WRONG").await?, "ERR_INVALID_CODE");
    redeem("ENVELOPE").await?.into_result()?;
    assert_err(redeem("ENVELOPE").await?, "ERR_ALREADY_REDEEMED");
    let redeemed: bool = envelope
        .view("near_event_redeemed")
        .args_json(json!({ "event_id": "demo", "account_id": carol.id() }))
        .await?
        .json()?;
    assert!(redeemed);

    // 8 - 1(강화) + 1(체크인) + 2(행사)
    let e = info(&envelope, &token_id).await?;
    assert_eq!(e["enhance_tickets"], 10);
    assert_eq!(e["level"], 1);

    // 10. 표준 nft_transfer도 기록이 남는다
    carol
        .call(envelope.id(), "nft_transfer")
        .args_json(json!({ "receiver_id": alice.id(), "token_id": token_id }))
        .deposit(NearToken::from_yoctonear(1))
        .transact()
        .await?
        .into_result()?;
    let e = info(&envelope, &token_id).await?;
    assert_eq!(e["history"].as_array().unwrap().len(), 3);
    assert!(e["history"][2]["message"].is_null());
    let owned: Vec<Value> = envelope
        .view("envelopes_for_owner")
        .args_json(json!({ "account_id": alice.id() }))
        .await?
        .json()?;
    assert_eq!(owned.len(), 1);

    Ok(())
}
