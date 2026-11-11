// 받은 봉투를 "열어 봤는지" 기록. 온체인 필드가 없어 이 브라우저의 localStorage에만 저장한다.
// 키 = token_id:history.length → 같은 봉투가 다른 사람을 거쳐 다시 돌아오면 새 선물로 본다.
// 소유자: C

import type { EnvelopeView } from "@/lib/near";

const storageKey = (accountId: string) => `nearenvelope:opened:${accountId}`;
const giftKey = (e: EnvelopeView) => `${e.token_id}:${e.history.length}`;

function read(accountId: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(storageKey(accountId)) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

/** 마지막 전달의 수신자가 나이고 지금도 내가 소유 중인 봉투 */
export const isReceivedBy = (e: EnvelopeView, accountId: string) =>
  e.owner_id === accountId && e.history.at(-1)?.to === accountId;

export const isOpened = (e: EnvelopeView, accountId: string) => read(accountId).has(giftKey(e));

export function markOpened(e: EnvelopeView, accountId: string) {
  try {
    const opened = read(accountId);
    opened.add(giftKey(e));
    localStorage.setItem(storageKey(accountId), JSON.stringify([...opened]));
  } catch {
    // 저장소를 못 쓰면 다음 방문에 다시 새 선물로 보일 뿐이다.
  }
}
