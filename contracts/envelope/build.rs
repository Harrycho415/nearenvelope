//! `contracts/res/vault.wasm`을 OUT_DIR로 복사해 `include_bytes!`로 포함할 수 있게 한다.
//! 파일이 없으면 빈 바이트를 넣어 `cargo check`는 통과시키고, `mint`에서 실패하게 한다.

use std::{env, fs, path::PathBuf};

fn main() {
    let src = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap()).join("../res/vault.wasm");
    let dst = PathBuf::from(env::var("OUT_DIR").unwrap()).join("vault.wasm");
    println!("cargo:rerun-if-changed={}", src.display());

    match fs::read(&src) {
        Ok(bytes) => fs::write(&dst, bytes).unwrap(),
        Err(_) => {
            println!("cargo:warning=contracts/res/vault.wasm not found; run scripts/build-contracts.sh");
            fs::write(&dst, []).unwrap();
        }
    }
}
