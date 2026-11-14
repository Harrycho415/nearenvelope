"use client";

// 강화 실행과 결과 URL. 미션 화면의 Enhance Envelope 버튼과 결과 화면의 Try Again이 함께 쓴다.
// 결과는 `/enhance/[tokenId]?result=success|fail&from=5&to=6&attempts=3`으로 넘긴다 (attempts = 강화 전 남은 기회).
// 소유자: D

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useNear, type EnhanceResult, type EnvelopeView, type Rarity } from "@/lib/near";

export interface EnhanceOutcome {
  success: boolean;
  from: number;
  to: number;
  /** 강화 전 남은 기회 */
  attempts: number;
}

export const rarityOf = (level: number): Rarity =>
  level <= 3 ? "Basic" : level <= 6 ? "Rare" : level <= 9 ? "Epic" : "Legendary";

export function resultHref(tokenId: string, o: EnhanceOutcome) {
  const q = new URLSearchParams({
    result: o.success ? "success" : "fail",
    from: String(o.from),
    to: String(o.to),
    attempts: String(o.attempts),
  });
  return `/enhance/${tokenId}?${q}`;
}

export function parseOutcome(params: URLSearchParams): EnhanceOutcome | null {
  const result = params.get("result");
  const [from, to, attempts] = ["from", "to", "attempts"].map((k) => Number(params.get(k)));
  if ((result !== "success" && result !== "fail") || ![from, to, attempts].every(Number.isInteger)) return null;
  return { success: result === "success", from, to, attempts };
}

const ERROR_TEXT: Record<string, string> = {
  ERR_NO_TICKET: "This Envelope has no Enhancement Attempts left. Complete missions to earn more.",
  ERR_MAX_LEVEL: "This Envelope is already at the highest level.",
  ERR_NOT_OWNER: "You no longer own this Envelope.",
};

function errorText(e: unknown) {
  const message = (e as Error)?.message ?? "";
  const code = Object.keys(ERROR_TEXT).find((c) => message.includes(c));
  return code ? ERROR_TEXT[code] : message || "Something went wrong. Please try again.";
}

/** 강화 후 결과 화면으로 이동한다. replace = 결과 화면에서 다시 시도할 때 */
export function useEnhance({ replace = false } = {}) {
  const { api } = useNear();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enhance(envelope: EnvelopeView) {
    setBusy(true);
    setError(null);
    try {
      let result: EnhanceResult | null = await api.enhance(envelope.token_id);
      if (!result) {
        // 결과를 바로 못 받는 지갑: 다시 조회해 레벨 변화로 판정
        const after = await api.envelopeInfo(envelope.token_id);
        if (!after) throw new Error("ERR_TOKEN_NOT_FOUND");
        result = {
          success: after.level > envelope.level,
          level_before: envelope.level,
          level_after: after.level,
          rarity: after.rarity,
        };
      }
      const href = resultHref(envelope.token_id, {
        success: result.success,
        from: result.level_before,
        to: result.level_after,
        attempts: envelope.enhance_tickets,
      });
      if (replace) router.replace(href, { scroll: false });
      else router.push(href);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return { enhance, busy, error };
}
