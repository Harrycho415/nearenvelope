// 금액 변환. 부동소수점 오차를 피하려고 BigInt 문자열 연산만 쓴다.

import { FT_DECIMALS, NEAR_DECIMALS } from "./config";

export function toUnits(amount: string, decimals: number): string {
  const [whole, frac = ""] = amount.trim().split(".");
  if (!/^\d*$/.test(whole) || !/^\d*$/.test(frac) || frac.length > decimals) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  return BigInt((whole || "0") + frac.padEnd(decimals, "0")).toString();
}

export function fromUnits(units: string, decimals: number, maxFraction = 4): string {
  const s = BigInt(units).toString().padStart(decimals + 1, "0");
  const whole = s.slice(0, -decimals);
  const frac = s.slice(-decimals).slice(0, maxFraction).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

export const nearToYocto = (near: string) => toUnits(near, NEAR_DECIMALS);
export const yoctoToNear = (yocto: string, maxFraction = 4) => fromUnits(yocto, NEAR_DECIMALS, maxFraction);
export const usdcToUnits = (usdc: string) => toUnits(usdc, FT_DECIMALS);
export const unitsToUsdc = (units: string, maxFraction = 2) => fromUnits(units, FT_DECIMALS, maxFraction);

/** 긴 계정(암묵적 계정 64자 hex 등)은 앞뒤만 보여 준다. harry.near처럼 짧은 이름은 그대로. */
export function shortAccount(accountId: string, head = 6, tail = 4): string {
  return accountId.length <= 24 ? accountId : `${accountId.slice(0, head)}…${accountId.slice(-tail)}`;
}

/** maya.testnet → Maya */
export function displayName(accountId: string): string {
  const name = accountId.split(".")[0];
  return name.length > 16 ? shortAccount(accountId) : name.charAt(0).toUpperCase() + name.slice(1);
}

const ACCOUNT_ID_RE = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;

/** NEAR 계정 ID 형식 검사 (존재 여부는 api.accountExists) */
export const isValidAccountId = (accountId: string) =>
  accountId.length >= 2 && accountId.length <= 64 && ACCOUNT_ID_RE.test(accountId);

/** "Just now", "5m ago", "3h ago", "2d ago" */
export function timeAgo(ms: number, now: number): string {
  const minutes = Math.floor((now - ms) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}
