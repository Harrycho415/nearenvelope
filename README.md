# NEAR Envelope

Gift crypto inside an NFT that owns its own NEAR account. Whoever holds the envelope controls the money inside it.

Built at NEAR HACKATHON · Track: **NFTs That Do Something** (`nfts`)

- Network: NEAR **testnet** · contracts deployed at [`nearenvelope.testnet`](#deployed-contracts-testnet)
- Live demo: **https://nearenvelope.vercel.app** (testnet)
- Try it: [step by step on testnet](#try-it-testnet) or [run it locally](#run-locally)
- Demo video (X): https://x.com/suhyuncho415/status/2121641810443555315

## Problem

Sending crypto as a gift today means pasting an address and pressing send. Nothing travels with the money: no message, no story, nothing the receiver can keep or pass on. And if you want to hand a "gift card" to someone, the funds usually sit in a wallet whose keys someone else still knows.

## What it does

Each envelope is an NFT with its own NEAR account (a "vault") holding the gift:

- **Fill it** with NEAR or USDC. The assets live in the envelope's vault, not in your wallet.
- **Send it** with a message. Sending the NFT moves control of everything inside, and the previous owner can no longer withdraw.
- **Withdraw** as the current owner, any time, any amount.
- **It keeps a history.** Every hand-off and message is stored on-chain and travels with the envelope.
- **It grows.** Missions give the envelope enhancement attempts; enhancing raises its level (+0 to +10) and rarity (Common → Rare → Epic → Legendary), and the NFT's metadata and artwork change with it.

## How NEAR is used

| NEAR feature | Where |
|---|---|
| **Sub-accounts** | `mint` creates `<token_id>.<nft-contract>` and deploys a vault contract to it. Only the parent account can create it, so every vault is provably tied to one envelope. |
| **Accounts with no access keys** | Vaults have no keys. Their only caller is the envelope contract (`controller`), which checks the current NFT owner before every withdrawal. NFT ownership *is* control of the funds. |
| **NEP-171 / 177 / 178 / 181** | The envelope is a standard NFT (core, metadata, approval, enumeration). Standard `nft_transfer` also records history and moves control. |
| **Dynamic NFT metadata** | `enhance` rewrites the token's `title` and `media` (`designs/{design}/{rarity}.svg`) when the level changes rarity. |
| **NEP-141** | USDC deposits go straight to the vault via `ft_transfer_call`; the vault reports them to the envelope contract. A mock USDC is deployed for testnet. |

## Try it (testnet)

Open **https://nearenvelope.vercel.app** (or [run it locally](#run-locally)). You need a [Meteor wallet](https://wallet.meteorwallet.app) testnet account with ~5 NEAR (free from [near-faucet.io](https://near-faucet.io)). To see the ownership transfer, use **two** accounts (A and B).

Each step is "do X → see Y".

1. **Connect.** Click **Connect Wallet** and sign in with account A → your account name appears in the header.
2. **Get test USDC.** Open **Wallet → Get test USDC** → your USDC balance goes up by 1,000.
3. **Create an envelope.** **My Envelopes → Create Envelope**, pick a cover, confirm in the wallet (2 NEAR deposit) → a done screen shows the new envelope and "Welcome mission complete: +1 Enhancement Attempt". Its vault account `<id>.nearenvelope.testnet` now exists on the [explorer](https://testnet.nearblocks.io) with **no access keys**.
4. **Fill it.** Open the envelope → **Assets → Add Assets**, add 10 USDC → the Assets tab shows 10 USDC inside, and the explorer shows the USDC on the vault account.
5. **Send it.** **Send**, choose the envelope, write a message, enter account B, confirm → the envelope leaves A's list.
6. **Old owner can't withdraw.** The app hides Withdraw for non-owners, so try it from the CLI ([near-cli-rs](https://github.com/near/near-cli-rs)) as A → the call fails with `ERR_NOT_OWNER`:
   ```bash
   near contract call-function as-transaction nearenvelope.testnet claim_ft \
     json-args '{"token_id":"<id>","ft_contract_id":"usdc.nearenvelope.testnet","amount":"1000000"}' \
     prepaid-gas '100.0 Tgas' attached-deposit '1 yoctoNEAR' \
     sign-as <account-A>.testnet network-config testnet sign-with-keychain send
   ```
7. **New owner can.** Sign in as B → **Home** shows a "New gift" banner → **View gift → Open Envelope** → the envelope opens (seal, flap, letter) and shows the amount and message → **View Envelope → Assets → Withdraw** 5 USDC → B's wallet gets 5 USDC and 5 USDC stays inside.
8. **Missions and enhance.** **Missions** → First Fill, First Gift and New Connection (B had never held an envelope) are marked completed and their attempts were added on their own → **Enhance Envelope** shows the success chance and attempts left → **Enhance Envelope** → a success or failure screen. A failure keeps the level. At +4, +7 and +10 the rarity changes and so does the artwork.

## Deployed contracts (testnet)

| Contract | Account |
|---|---|
| Envelope NFT | [`nearenvelope.testnet`](https://testnet.nearblocks.io/address/nearenvelope.testnet) |
| Mock USDC (NEP-141, 6 decimals, public `faucet`) | [`usdc.nearenvelope.testnet`](https://testnet.nearblocks.io/address/usdc.nearenvelope.testnet) |
| Vaults | `<token_id>.nearenvelope.testnet` (one per envelope) |

Method and type reference: [`docs/INTERFACE.md`](docs/INTERFACE.md).

## Run locally

Requirements: Node 22, pnpm 10. For contracts: Rust (pinned in `contracts/rust-toolchain.toml`), `wasm32-unknown-unknown`, `cargo-near` 0.23.

```bash
# Frontend against the deployed testnet contracts
cd frontend
cp .env.example .env.local
# uses the testnet contracts by default (set NEXT_PUBLIC_USE_MOCK=true in .env.local for in-memory mock data)
pnpm install
pnpm dev            # http://localhost:3000
```

```bash
# Contracts
cd contracts
cargo test -p vault -p envelope -p mock-ft      # unit tests
../scripts/build-contracts.sh                   # vault → envelope, mock-ft wasm
cargo test -p integration-tests                 # sandbox scenario (after the build)
../scripts/deploy-testnet.sh <your-account>.testnet --with-ft
```

## Architecture

```
nearenvelope.testnet                 Envelope NFT contract (NEP-171/177/178/181)
├── 1.nearenvelope.testnet           Vault (no access keys, controller = nearenvelope.testnet)
├── 2.nearenvelope.testnet
└── ...
usdc.nearenvelope.testnet            Mock USDC (NEP-141)
```

- `contracts/envelope` — NFT, mint (creates and deploys the vault), fill / claim, send, missions, enhance, views.
- `contracts/vault` — holds NEAR and FTs; every change method requires `predecessor == controller`.
- `contracts/mock-ft` — testnet USDC with a faucet.
- `frontend` — Next.js 16 app; all chain access goes through `src/lib/near` (Meteor wallet via Wallet Selector).

### Security model: ownership = control

| Threat | Mitigation |
|---|---|
| Previous owner withdraws after sending | Vaults have no keys. Withdrawals only go through `claim_near` / `claim_ft`, which require the caller to be the current NFT owner. |
| Someone calls a vault directly | Every vault change method checks `predecessor == controller`. |
| Vault drained below its storage cost | `withdraw_near` keeps storage cost plus a reserve. |
| Vault creation fails during mint | `on_vault_created` rolls back the token and refunds the deposit. |

More: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), design decisions in [`docs/DECISIONS.md`](docs/DECISIONS.md).

### Missions

Rewards are enhancement attempts, stored on the envelope and granted automatically (no claim step).

| Mission | When | Reward |
|---|---|---|
| Welcome | Mint | 1 |
| First Fill | First NEAR or FT deposit | 1 |
| First Gift | First transfer | 1 |
| Pass It On (Regift) | A receiver sends it again | 2 |
| Traveler / Wanderer / World Traveler | 3 / 5 / 10 different owners | 1 / 2 / 3 |
| New Connection | Sent to an account that has never held an envelope | 2 |
| Check-in | Every 10 minutes (demo value) | 1 |

## Tests

`contracts/integration-tests/tests/mvp_flow.rs` runs the full flow in a local sandbox: mint (vault created and funded) → fill NEAR and USDC → send with message (FirstGift, NewConnection) → previous owner `claim_near` fails with `ERR_NOT_OWNER` → new owner withdraws NEAR and USDC → regift (Regift, Journey3) → enhance and metadata update → check-in cooldown → event-code rewards (a contract feature not shown in the app: not admin / wrong code / success / already used) → standard `nft_transfer` keeps history. Mission rules also have unit tests in `contracts/envelope/src/mission.rs` (run in CI).

## Limitations

- **Testnet only**; USDC is a mock token.
- **Enhancement randomness** uses the block random seed mixed with the token ID and attempt count. It's fine for a demo but a validator could bias it; a VRF would be needed on mainnet.
- **Journey missions can be farmed** by passing an envelope between your own accounts. Each mission pays once per envelope.
- **Locking assets while an envelope is listed for sale** (approval) is not implemented, so a seller could withdraw before a marketplace sale completes.
- **NFT images in external wallets**: the contract's `base_uri` is not set, so the relative `media` path (`designs/{design}/{rarity}.svg`) only resolves inside this app. Pointing it at the hosted app needs a contract update (there is no `base_uri` setter yet).

## Roadmap

Gift by link for receivers without a wallet · Global Contract for cheaper mints · withdrawal lock while approved · more envelope designs.

## Built with

- Contracts: `near-sdk` 5.30, `near-contract-standards` 5.30, `near-workspaces` 0.24 (tests), `cargo-near`
- Frontend: Next.js 16, React 19, Tailwind CSS 4, `@near-wallet-selector` 10 (Meteor wallet), `@near-js/transactions` 2, `near-api-js` 6
- UI theme inspired by the [Clario](https://www.framer.com/marketplace/templates/clario/) Framer template (reimplemented, no template assets used)
- Envelope artwork: 12 SVGs (3 designs × 4 rarities) generated by `scripts/generate-envelope-art.mjs`; the same files are the NFT metadata `media`
- **AI assistance**: large parts of the contracts, frontend, tests and docs were written with Claude Code (commits are marked `Co-Authored-By: Claude`) and reviewed by the team.

All code was written during the hackathon window (first commit 2026-11-10).

## Team

**blockblock yonsei**

- Harrycho415
- cheolwoo
- Iris1485
- Chanju Ahn

## License

[MIT](LICENSE)
