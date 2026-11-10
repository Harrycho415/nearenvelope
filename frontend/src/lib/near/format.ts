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
