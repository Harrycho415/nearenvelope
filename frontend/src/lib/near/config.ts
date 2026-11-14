export const NETWORK = (process.env.NEXT_PUBLIC_NETWORK ?? "testnet") as "testnet" | "mainnet";
export const NFT_CONTRACT_ID = process.env.NEXT_PUBLIC_NFT_CONTRACT_ID ?? "nearenvelope.testnet";
export const FT_CONTRACT_ID = process.env.NEXT_PUBLIC_FT_CONTRACT_ID ?? "usdc.nearenvelope.testnet";
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://test.rpc.fastnear.com";
export const EXPLORER_URL = NETWORK === "mainnet" ? "https://nearblocks.io" : "https://testnet.nearblocks.io";
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
/** 드라이런 계정. 목업 모드에서 이 값이 있으면 Meteor 없이 이 계정으로 바로 연결된다 (서명·잔액 불필요) */
export const MOCK_ACCOUNT = (USE_MOCK && process.env.NEXT_PUBLIC_MOCK_ACCOUNT) || null;

export const FT_DECIMALS = 6;
export const NEAR_DECIMALS = 24;

/** docs/INTERFACE.md 권장 Gas (Tgas) */
export const GAS_TGAS = {
  mint: 150,
  fill: 50,
  registerFt: 100,
  fillFt: 100,
  claimNear: 50,
  claimFt: 100,
  sendEnvelope: 50,
  enhance: 30,
  checkIn: 30,
  faucet: 30,
  redeemNearEvent: 30,
} as const;

export const ONE_YOCTO = "1";

/** Mock USDC faucet 1회 최대 (mock-ft FAUCET_MAX = 1,000 USDC) */
export const FAUCET_MAX_USDC = "1000";
/** 테스트넷 NEAR faucet (외부) */
export const NEAR_FAUCET_URL = "https://near-faucet.io";
