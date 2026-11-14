// Overview 탭: 레벨·희귀도·생성일·강화/선물 횟수·소유자, Vault 계정, 다음 행동 안내
// 소유자: C

import Link from "next/link";

import { RARITY_LABEL, RARITY_TEXT } from "@/components/envelope/designs";
import { EXPLORER_URL, shortAccount, type EnvelopeView } from "@/lib/near";

import { BUTTON_SECONDARY, formatDate } from "../../_components/shared";

export function OverviewTab({
  envelope,
  isOwner,
  onViewAssets,
}: {
  envelope: EnvelopeView;
  isOwner: boolean;
  onViewAssets: () => void;
}) {
  // MVP 강화는 실패해도 레벨이 내려가지 않으므로 성공 횟수 = 현재 레벨 (INTERFACE.md 강화)
  const stats = [
    { label: "Level", value: `+${envelope.level}` },
    { label: "Rarity", value: RARITY_LABEL[envelope.rarity], className: RARITY_TEXT[envelope.rarity] },
    { label: "Created", value: formatDate(envelope.created_at_ms) },
    { label: "Successful enhancements", value: String(envelope.level) },
    { label: "Times gifted", value: String(envelope.history.length) },
    { label: "Current owner", value: shortAccount(envelope.owner_id), title: envelope.owner_id },
  ];

  return (
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_424px]">
      <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7">
        <h2 className="text-2xl font-semibold">A gift that grows in meaning.</h2>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-muted">
          A keepsake passed between friends. Each gift and every enhancement adds another chapter, without changing
          the value of the assets inside.
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
          {stats.map(({ label, value, title, className }) => (
            <div key={label} className="min-w-0">
              <dt className="text-sm text-ink-muted">{label}</dt>
              <dd className={`mt-3 truncate text-xl font-semibold ${className ?? ""}`} title={title}>
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 rounded-3xl border border-line bg-seal/40 p-5">
          <div className="text-sm text-ink-muted">Envelope Account</div>
          <a
            href={`${EXPLORER_URL}/address/${envelope.vault_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex max-w-full items-center gap-3 text-lg font-medium hover:text-brand"
          >
            <span className="break-all">{envelope.vault_id}</span>
            <span aria-hidden>↗</span>
            <span className="sr-only">(opens in explorer)</span>
          </a>
          <p className="mt-3 text-sm text-ink-muted">A linked NEAR account holds this envelope’s assets.</p>
        </div>
      </section>

      <aside className="rounded-3xl border border-line bg-paper p-6 sm:p-7">
        <h2 className="text-2xl font-semibold">Keep the story going</h2>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-muted">
          Enhance its meaning or pass it on when you are ready.
        </p>
        <div className="mt-4 flex flex-col items-start gap-4">
          {isOwner && (
            <Link href={`/enhance/${envelope.token_id}`} className={BUTTON_SECONDARY}>
              Enhance Envelope
            </Link>
          )}
          <button onClick={onViewAssets} className={BUTTON_SECONDARY}>
            View Assets
          </button>
        </div>
        <p className="mt-4 text-sm text-ink-muted">Only the current owner can send, enhance, or withdraw.</p>
      </aside>
    </div>
  );
}
