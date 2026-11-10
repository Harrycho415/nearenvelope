# Decision Log

새 결정은 맨 아래에 추가한다. 기존 항목은 수정하지 않고, 번복할 때는 새 항목으로 적는다.

| # | 날짜 | 결정 | 이유 | 결정자 |
|---|---|---|---|---|
| 1 | 2026-11-10 | Vault 하위 계정에 Access Key를 두지 않고 NFT 컨트랙트만 controller로 신뢰 | 키 교체 방식은 이전 소유자가 키를 남기거나 지울 수 있어 소유권과 제어권이 어긋남 | 팀 |
| 2 | 2026-11-10 | Vault wasm은 `include_bytes!`로 포함해 일반 배포. Global Contract는 여유 시 | 구현 리스크 최소화. 민트당 스토리지 비용 증가는 감수 | 팀 |
| 3 | 2026-11-10 | 미션은 온체인에서 판정 가능한 것만 | 백엔드·서명 서버 없이 4일 내 완성 | 팀 |
| 4 | 2026-11-10 | 테스트넷 FT는 자체 Mock USDC 배포 | 테스트넷 USDC 확보에 시간 쓰지 않기 | 팀 |
| 5 | 2026-11-10 | Trunk 기반 브랜치 + squash merge | 4일짜리 프로젝트에 develop 브랜치는 오버헤드 | 팀 |
| 6 | 2026-11-10 | 프런트는 `lib/near` 계층 + mock 모드로 컨트랙트와 병렬 개발 | 컨트랙트 배포 전에도 UI 작업 가능 | 팀 |
| 7 | 2026-11-10 | `MINT_DEPOSIT` = 2 NEAR | vault.wasm 109KB → 스토리지 약 1.1 NEAR + 계정·NFT 저장 여유분 | 팀 |
| 8 | 2026-11-10 | 프런트 `near-api-js` 6.x 고정, 트랜잭션 생성은 `@near-js/transactions` | Meteor SDK가 near-api-js ^6을 peer로 요구. 7.x에서 빌드 실패 | 팀 |
| 9 | 2026-11-10 | `vault.wasm`은 `contracts/res/`에 커밋, envelope `build.rs`가 포함 | 모든 팀원이 vault 빌드 없이 `cargo check` 가능 | 팀 |
