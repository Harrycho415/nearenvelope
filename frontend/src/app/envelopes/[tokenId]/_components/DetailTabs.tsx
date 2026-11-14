// 상세 탭: Overview / Assets / History는 페이지 안에서 전환, Enhance는 강화 화면(/enhance/[tokenId])으로 이동
// 소유자: C

import Link from "next/link";

export type Tab = "overview" | "assets" | "history";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "assets", label: "Assets" },
  { id: "history", label: "History" },
];

const BASE = "tab shrink-0";

export const tabPanelId = (tab: Tab) => `envelope-panel-${tab}`;

/** `?tab=assets` 같은 쿼리 값 → 탭. 모르는 값은 Overview */
export const parseTab = (value: string | null): Tab =>
  TABS.find((t) => t.id === value)?.id ?? "overview";

export function DetailTabs({
  tokenId,
  current,
  onChange,
}: {
  tokenId: string;
  current: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <div className="mt-8 flex gap-1.5 overflow-x-auto border-b border-line px-2 pt-1">
      <div role="tablist" aria-label="Envelope sections" className="flex gap-1.5">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={current === id}
            aria-controls={tabPanelId(id)}
            onClick={() => onChange(id)}
            className={BASE}
          >
            {label}
          </button>
        ))}
      </div>
      <Link href={`/enhance/${tokenId}`} className={`${BASE} tab-legendary ml-auto`}>
        Enhance →
      </Link>
    </div>
  );
}
