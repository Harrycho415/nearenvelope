`vault.wasm`은 `scripts/build-contracts.sh`가 생성한다. envelope 컨트랙트가 빌드 시 `include_bytes!`로 포함한다.
이 파일은 A만 갱신·커밋한다. 없으면 envelope은 빈 바이트로 컴파일되고 `mint`가 실패한다.
