// 보내기 2~4단계가 함께 쓰는 타입과 표시 헬퍼.
// 소유자: C

import { designName } from "@/components/envelope/designs";
import {
  FT_DECIMALS,
  NEAR_DECIMALS,
  toUnits,
  unitsToUsdc,
  yoctoToNear,
  type EnvelopeView,
  type VaultBalances,
} from "@/lib/near";

export type Token = "USDC" | "NEAR";
export const TOKENS: Token[] = ["USDC", "NEAR"];

const DECIMALS: Record<Token, number> = { USDC: FT_DECIMALS, NEAR: NEAR_DECIMALS };
const BALANCE_KEY: Record<Token, keyof VaultBalances> = { USDC: "usdc", NEAR: "near" };

export interface AssetRow {
  key: number;
  token: Token;
  amount: string;
}

export const balanceOf = (balances: VaultBalances, token: Token) => BigInt(balances[BALANCE_KEY[token]]);

/** 입력값 → 최소 단위. 빈칸은 0, 형식이 틀리면 null */
export function parseAmount(row: AssetRow): bigint | null {
  if (!row.amount.trim()) return BigInt(0);
  try {
    return BigInt(toUnits(row.amount, DECIMALS[row.token]));
  } catch {
    return null;
  }
}

export function formatToken(units: bigint, token: Token) {
  return token === "NEAR" ? yoctoToNear(units.toString()) : unitsToUsdc(units.toString());
}

/** "1.5 NEAR + 50 USDC". 아무것도 없으면 null */
export function formatAssets(balances: VaultBalances): string | null {
  const parts = TOKENS.filter((t) => balanceOf(balances, t) > BigInt(0)).map(
    (t) => `${formatToken(balanceOf(balances, t), t)} ${t}`,
  );
  return parts.length ? parts.join(" + ") : null;
}

export const envelopeTitle = (e: EnvelopeView) => `${designName(e.design)} Envelope +${e.level}`;

/** 컨트랙트 에러 코드 → 사용자 문구 */
const ERROR_TEXT: Record<string, string> = {
  ERR_NOT_OWNER: "You no longer own this envelope.",
  ERR_TOKEN_NOT_FOUND: "This envelope doesn't exist.",
  ERR_MESSAGE_TOO_LONG: "Your message is too long.",
  ERR_INSUFFICIENT_BALANCE: "Not enough balance in your wallet.",
  ERR_INSUFFICIENT_DEPOSIT: "Not enough balance in your wallet.",
};

export function errorText(e: unknown) {
  const message = (e as Error)?.message ?? "";
  const code = Object.keys(ERROR_TEXT).find((c) => message.includes(c));
  return code ? ERROR_TEXT[code] : message || "Something went wrong. Please try again.";
}

export function StepHeader({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <>
      <p className="mt-10 text-[13px] font-semibold uppercase tracking-wide text-brand">Step {step} of 4</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-[42px]">{title}</h1>
      <p className="mt-3 text-lg text-ink-muted">{subtitle}</p>
    </>
  );
}
