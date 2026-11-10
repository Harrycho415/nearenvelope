## 무엇을
<!-- 한두 줄 -->

## 체크리스트
- [ ] 브랜치 이름 `<type>/<area>-<설명>`, PR 제목 Conventional Commits
- [ ] 내 소유 파일만 수정했다 (아니라면 해당 소유자를 리뷰어로 지정)
- [ ] `[interface]` 변경이면 INTERFACE.md + types.rs + types.ts (+ mock.ts)를 함께 수정했다
- [ ] `state-breaking` (Contract/EnvelopeState 필드 변경) 여부: 예 / 아니오
- [ ] `vault` 변경 시 `contracts/res/vault.wasm` 재빌드·커밋
- [ ] 컨트랙트: `cargo check-contracts` + `cargo test` 통과
- [ ] 프런트: `pnpm lint && pnpm build` 통과

## 스크린샷 / 테스트 결과
