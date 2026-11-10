// 상세 탭: Overview / Assets / History는 페이지 안에서 전환, Enhance는 강화 화면(/enhance/[tokenId])으로 이동
// 소유자: C

import Link from "next/link";

export type Tab = "overview" | "assets" | "history";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "assets", label: "Assets" },
  { id: "history", label: "History" },
];

const BASE = "shrink-0 whitespace-nowrap rounded-xl border px-3 py-2.5 text-lg transition sm:px-3.5";
const ACTIVE = "border-line bg-seal/40 font-semibold text-brand";
const INACTIVE = "border-transparent text-ink-muted hover:text-ink";

export const tabPanelId = (tab: Tab) => `envelope-panel-${tab}`;

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
    <div className="mt-8 flex gap-2 overflow-x-auto sm:gap-10">
      <div role="tablist" aria-label="Envelope sections" className="flex gap-2 sm:gap-10">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={current === id}
            aria-controls={tabPanelId(id)}
            onClick={() => onChange(id)}
            className={`${BASE} ${current === id ? ACTIVE : INACTIVE}`}
          >
            {label}
          </button>
        ))}
      </div>
      <Link href={`/enhance/${tokenId}`} className={`${BASE} ${INACTIVE}`}>
        Enhance
      </Link>
    </div>
  );
}
