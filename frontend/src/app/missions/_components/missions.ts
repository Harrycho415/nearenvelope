// 미션 정의와 진행도 계산. 조건·보상은 docs/INTERFACE.md §미션과 맞춘다.
// 소유자: D

import type { EnvelopeView, MissionId } from "@/lib/near";

export interface Progress {
  current: number;
  target: number;
  unit?: string;
}

export interface MissionDef {
  id: MissionId;
  title: string;
  description: string;
  reward: number;
  /** 아직 달성 전일 때 보여 줄 진행도. 없으면 0/1 */
  progress?: (e: EnvelopeView) => Progress;
  /** 달성 전 행동 버튼 */
  action?: (e: EnvelopeView) => { label: string; href: string };
}

/** 민트한 사람 + 받은 사람들 (컨트랙트 판정과 동일) */
export const distinctOwners = (e: EnvelopeView) => new Set([e.creator_id, ...e.history.map((r) => r.to)]).size;

const send = (e: EnvelopeView) => ({ label: "Send this Envelope", href: `/send/${e.token_id}` });
const owners = (target: number) => (e: EnvelopeView) => ({ current: distinctOwners(e), target, unit: "owners" });

export const MISSION_GROUPS: { title: string; description: string; missions: MissionDef[] }[] = [
  {
    title: "Getting Started",
    description: "The first steps every Envelope takes.",
    missions: [
      { id: "Welcome", title: "Welcome", description: "Create this Envelope.", reward: 1 },
      {
        id: "FirstFill",
        title: "First Fill",
        description: "Put NEAR or USDC inside this Envelope.",
        reward: 1,
        action: (e) => ({ label: "View Assets", href: `/envelopes/${e.token_id}?tab=assets` }),
      },
      { id: "FirstGift", title: "First Gift", description: "Send this Envelope to someone.", reward: 1, action: send },
      {
        id: "Regift",
        title: "Pass It On",
        description: "Send this Envelope again after it was given to someone.",
        reward: 2,
        action: send,
      },
    ],
  },
  {
    title: "Journey",
    description: "The more hands an Envelope passes through, the stronger it can grow.",
    missions: [
      {
        id: "Journey3",
        title: "Traveler",
        description: "Let this Envelope travel through 3 different owners.",
        reward: 1,
        progress: owners(3),
        action: send,
      },
      {
        id: "Journey5",
        title: "Wanderer",
        description: "Let this Envelope travel through 5 different owners.",
        reward: 2,
        progress: owners(5),
        action: send,
      },
      {
        id: "Journey10",
        title: "World Traveler",
        description: "Let this Envelope travel through 10 different owners.",
        reward: 3,
        progress: owners(10),
        action: send,
      },
    ],
  },
  {
    title: "Bring Someone New",
    description: "Help someone take their first step on NEAR.",
    missions: [
      {
        id: "NewConnection",
        title: "New Connection",
        description: "Send this Envelope to someone who has never held a NEAR Envelope.",
        reward: 2,
        action: send,
      },
    ],
  },
];

/** 컨트랙트·목업 에러 코드 → 사용자 문구 */
const ERROR_TEXT: Record<string, string> = {
  ERR_NOT_OWNER: "You no longer own this envelope.",
  ERR_CHECK_IN_COOLDOWN: "Check-in is cooling down. Try again a little later.",
  ERR_EVENT_NOT_FOUND: "This event doesn't exist.",
  ERR_EVENT_ENDED: "This event has ended.",
  ERR_INVALID_CODE: "That code isn't right. Check it and try again.",
  ERR_ALREADY_REDEEMED: "You've already used this event's code.",
};

export function errorText(e: unknown) {
  const message = (e as Error)?.message ?? "";
  const code = Object.keys(ERROR_TEXT).find((c) => message.includes(c));
  return code ? ERROR_TEXT[code] : message || "Something went wrong. Please try again.";
}

export const attemptsText = (n: number) => `${n} Enhancement Attempt${n === 1 ? "" : "s"}`;
