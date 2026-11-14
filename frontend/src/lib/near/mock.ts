// 컨트랙트 배포 전 UI 개발용 목업. INTERFACE.md의 규칙(확률표·미션·에러 코드)을 흉내 낸다.
// NEXT_PUBLIC_USE_MOCK=true일 때 사용. 상태는 메모리에만 있고 새로고침하면 초기화된다.
// 소유자: C (인터페이스 변경 시 types.ts와 함께 갱신)

import { FAUCET_MAX_USDC, NFT_CONTRACT_ID } from "./config";
import { isValidAccountId, nearToYocto, usdcToUnits } from "./format";
import type { EnvelopeApi, EnvelopeView, MissionId, NearEventView, Rarity, VaultBalances } from "./types";

/** 지갑이 연결되면 setMockAccount로 실제 계정으로 바뀐다. 시드 봉투도 그 계정 소유가 된다. */
let currentAccount = "you.testnet";

const ENHANCE_TABLE = [10000, 9000, 8000, 7000, 6000, 5000, 4000, 3000, 2000, 1000];
const REWARD: Record<MissionId, number> = {
  Welcome: 1,
  FirstFill: 1,
  FirstGift: 1,
  Regift: 2,
  Journey3: 1,
  Journey5: 2,
  Journey10: 3,
  NewConnection: 2,
  NearEvent: 0, // 행사별 tickets
};
const JOURNEY: [number, MissionId][] = [
  [3, "Journey3"],
  [5, "Journey5"],
  [10, "Journey10"],
];

/** 목업 행사. 실제 컨트랙트는 sha256 해시를 저장하지만 목업은 원문을 비교한다 */
const nearEvents: (NearEventView & { code: string })[] = [
  {
    event_id: "near-hackathon-demo",
    name: "NEAR Hackathon Demo Day",
    tickets: 2,
    ends_at_ms: Date.now() + 7 * 86_400_000,
    code: "ENVELOPE",
  },
];
/** `${event_id}:${account_id}` */
const redeemed = new Set<string>();

const rarityOf = (level: number): Rarity =>
  level <= 3 ? "Basic" : level <= 6 ? "Rare" : level <= 9 ? "Epic" : "Legendary";

const delay = () => new Promise<void>((r) => setTimeout(r, 400));

/** 연결된 지갑의 목업 잔액 (25 NEAR, 124.32 USDC) */
const walletBalance: VaultBalances = { near: nearToYocto("25"), usdc: "124320000" };

function spend(key: keyof VaultBalances, amount: bigint) {
  if (BigInt(walletBalance[key]) < amount) throw new Error("ERR_INSUFFICIENT_BALANCE");
  walletBalance[key] = (BigInt(walletBalance[key]) - amount).toString();
}

const envelopes = new Map<string, EnvelopeView>();
const balances = new Map<string, VaultBalances>();
let nextId = 1;

function seed(
  owner: string,
  level: number,
  design: number,
  history: EnvelopeView["history"] = [],
  balance: VaultBalances = { near: "1000000000000000000000000", usdc: "50000000" },
) {
  const token_id = String(nextId++);
  const vault_id = `${token_id}.${NFT_CONTRACT_ID}`;
  envelopes.set(token_id, {
    token_id,
    owner_id: owner,
    vault_id,
    creator_id: history[0]?.from ?? owner,
    design,
    level,
    rarity: rarityOf(level),
    enhance_tickets: 2,
    enhance_attempts: level,
    missions_done: ["Welcome"],
    last_check_in_ms: 0,
    created_at_ms: Date.now() - 86_400_000 * 3,
    history,
  });
  balances.set(vault_id, balance);
  return token_id;
}

const EMPTY: VaultBalances = { near: "0", usdc: "0" };
const received = (from: string, hoursAgo: number, message: string | null) => [
  { from, to: currentAccount, at_ms: Date.now() - hoursAgo * 3_600_000, message },
];

// design: 0 Classic, 1 Golden, 2 Midnight (components/envelope/designs.ts)
seed(currentAccount, 5, 1, received("maya.testnet", 2, "생일 축하해! 🎉"));
seed(currentAccount, 0, 0, received("jin.testnet", 26, "고마워"), EMPTY);
seed(currentAccount, 8, 2, received("maya.testnet", 72, null), EMPTY);
seed(currentAccount, 2, 0);

export function setMockAccount(accountId: string) {
  if (accountId === currentAccount) return;
  for (const e of envelopes.values()) {
    if (e.owner_id === currentAccount) e.owner_id = accountId;
    for (const r of e.history) if (r.to === currentAccount) r.to = accountId;
  }
  currentAccount = accountId;
}

function get(tokenId: string) {
  const e = envelopes.get(tokenId);
  if (!e) throw new Error("ERR_TOKEN_NOT_FOUND");
  return e;
}

function owned(tokenId: string) {
  const e = get(tokenId);
  if (e.owner_id !== currentAccount) throw new Error("ERR_NOT_OWNER");
  return e;
}

function grant(e: EnvelopeView, mission: MissionId) {
  if (e.missions_done.includes(mission)) return;
  e.missions_done.push(mission);
  e.enhance_tickets += REWARD[mission];
}

function addBalance(vaultId: string, key: keyof VaultBalances, delta: bigint) {
  const b = balances.get(vaultId) ?? { near: "0", usdc: "0" };
  const next = BigInt(b[key]) + delta;
  if (next < BigInt(0)) throw new Error("ERR_INSUFFICIENT_BALANCE");
  balances.set(vaultId, { ...b, [key]: next.toString() });
}

/** 봉투를 민트했거나 받은 적 있는 계정 (컨트랙트 known_accounts) */
function isKnown(accountId: string) {
  return [...envelopes.values()].some((e) => e.creator_id === accountId || e.history.some((r) => r.to === accountId));
}

function transfer(e: EnvelopeView, to: string, message: string | null) {
  const regift = e.history.length > 0;
  const newcomer = to !== e.owner_id && !isKnown(to);
  e.history.push({ from: e.owner_id, to, at_ms: Date.now(), message });
  e.owner_id = to;
  grant(e, "FirstGift");
  if (regift) grant(e, "Regift");
  if (newcomer) grant(e, "NewConnection");
  const owners = new Set([e.creator_id, ...e.history.map((r) => r.to)]).size;
  for (const [n, mission] of JOURNEY) if (owners >= n) grant(e, mission);
}

export const mockApi: EnvelopeApi = {
  envelopeInfo: async (tokenId) => (await delay(), structuredClone(envelopes.get(tokenId) ?? null)),
  envelopesForOwner: async (accountId) => {
    await delay();
    return [...envelopes.values()].filter((e) => e.owner_id === accountId).map((e) => structuredClone(e));
  },
  enhanceTable: async () => ENHANCE_TABLE,
  config: async () => ({
    mint_deposit: "2000000000000000000000000",
    ft_storage_deposit: "1250000000000000000000",
    max_level: 10,
    message_max_len: 280,
    check_in_cooldown_ms: 600_000,
  }),
  nearEvents: async () =>
    nearEvents.map(({ event_id, name, tickets, ends_at_ms }) => ({ event_id, name, tickets, ends_at_ms })),
  nearEventRedeemed: async (eventId, accountId) => redeemed.has(`${eventId}:${accountId}`),
  vaultBalances: async (vaultId) => (await delay(), balances.get(vaultId) ?? { near: "0", usdc: "0" }),
  walletBalances: async () => (await delay(), { ...walletBalance }),
  accountExists: async (accountId) => (await delay(), isValidAccountId(accountId)),
  faucet: async (amount) => {
    await delay();
    if (BigInt(amount) > BigInt(usdcToUnits(FAUCET_MAX_USDC))) throw new Error("ERR_FAUCET_LIMIT");
    walletBalance.usdc = (BigInt(walletBalance.usdc) + BigInt(amount)).toString();
  },

  mint: async (design) => {
    await delay();
    const id = seed(currentAccount, 0, design);
    const e = get(id);
    e.enhance_tickets = 1;
    e.enhance_attempts = 0;
    balances.set(e.vault_id, { near: "0", usdc: "0" });
    return id;
  },
  fill: async (tokenId, yocto) => {
    await delay();
    const e = get(tokenId);
    addBalance(e.vault_id, "near", BigInt(yocto));
    grant(e, "FirstFill");
  },
  registerFt: async () => delay(),
  fillFt: async (vaultId, amount) => {
    await delay();
    addBalance(vaultId, "usdc", BigInt(amount));
    const e = [...envelopes.values()].find((x) => x.vault_id === vaultId);
    if (e) grant(e, "FirstFill");
  },
  claimNear: async (tokenId, yocto) => {
    await delay();
    addBalance(owned(tokenId).vault_id, "near", -BigInt(yocto));
  },
  claimFt: async (tokenId, amount) => {
    await delay();
    addBalance(owned(tokenId).vault_id, "usdc", -BigInt(amount));
  },
  sendEnvelope: async (tokenId, receiverId, message) => {
    await delay();
    if (message && message.length > 280) throw new Error("ERR_MESSAGE_TOO_LONG");
    transfer(owned(tokenId), receiverId, message || null);
  },
  enhance: async (tokenId) => {
    await delay();
    const e = owned(tokenId);
    if (e.level >= 10) throw new Error("ERR_MAX_LEVEL");
    if (e.enhance_tickets < 1) throw new Error("ERR_NO_TICKET");
    e.enhance_tickets -= 1;
    e.enhance_attempts += 1;
    const level_before = e.level;
    const success = Math.random() * 10000 < ENHANCE_TABLE[e.level];
    if (success) e.level += 1;
    e.rarity = rarityOf(e.level);
    return { success, level_before, level_after: e.level, rarity: e.rarity };
  },
  checkIn: async (tokenId) => {
    await delay();
    const e = owned(tokenId);
    if (Date.now() - e.last_check_in_ms < 600_000) throw new Error("ERR_CHECK_IN_COOLDOWN");
    e.last_check_in_ms = Date.now();
    e.enhance_tickets += 1;
  },
  redeemNearEvent: async (tokenId, eventId, code) => {
    await delay();
    const e = owned(tokenId);
    const event = nearEvents.find((x) => x.event_id === eventId);
    if (!event) throw new Error("ERR_EVENT_NOT_FOUND");
    if (Date.now() >= event.ends_at_ms) throw new Error("ERR_EVENT_ENDED");
    const key = `${eventId}:${currentAccount}`;
    if (redeemed.has(key)) throw new Error("ERR_ALREADY_REDEEMED");
    if (code.trim() !== event.code) throw new Error("ERR_INVALID_CODE");
    redeemed.add(key);
    e.enhance_tickets += event.tickets;
  },
  addAssets: async ({ tokenId, vaultId, near, usdc }) => {
    await delay();
    const e = get(tokenId);
    for (const [key, amount] of [["near", BigInt(near)], ["usdc", BigInt(usdc)]] as const) {
      if (amount === BigInt(0)) continue;
      spend(key, amount);
      addBalance(vaultId, key, amount);
      grant(e, "FirstFill");
    }
  },
  sealAndSend: async ({ tokenId, vaultId, near, usdc, receiverId, message }) => {
    await delay();
    const e = owned(tokenId);
    if (message && [...message].length > 280) throw new Error("ERR_MESSAGE_TOO_LONG");
    for (const [key, amount] of [["near", BigInt(near)], ["usdc", BigInt(usdc)]] as const) {
      if (amount === BigInt(0)) continue;
      spend(key, amount);
      addBalance(vaultId, key, amount);
      grant(e, "FirstFill");
    }
    transfer(e, receiverId, message || null);
    return null;
  },
};
