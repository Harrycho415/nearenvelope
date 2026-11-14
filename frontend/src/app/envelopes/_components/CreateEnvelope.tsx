"use client";

// 새 봉투 만들기: 디자인 선택 → mint → 완료 화면에서 다음 행동(봉투 보기 / 자산 넣기 / 보내기)을 고른다.
// My Envelopes(/envelopes/new)와 Send(/send/new)가 함께 쓴다. 만든 뒤 바로 보내도록 강제하지 않는다.
// 소유자: C

import Link from "next/link";
import { useState } from "react";

import { DESIGN_NAMES } from "@/components/envelope/designs";
import { EnvelopeIllustration } from "@/components/envelope/EnvelopeIllustration";
import { useNear } from "@/lib/near";

import { BUTTON_PRIMARY, BUTTON_SECONDARY } from "./shared";

/** 어디서 들어왔는지: 브레드크럼·취소 링크·완료 후 기본 행동이 달라진다 */
export type CreateEntry = "envelopes" | "send";

const ENTRY = {
  envelopes: { crumbs: [{ href: "/envelopes", label: "My Envelopes" }], cancelHref: "/envelopes" },
  send: {
    crumbs: [
      { href: "/send", label: "Send" },
      { href: "/send", label: "Choose Envelope" },
    ],
    cancelHref: "/send",
  },
} as const;

export function CreateEnvelope({ entry }: { entry: CreateEntry }) {
  const { accountId, api, signIn, ready } = useNear();
  const [design, setDesign] = useState(0);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 만든 봉투. "" = 리다이렉트형 지갑이라 token_id를 바로 모름 */
  const [created, setCreated] = useState<string | null>(null);
  const { crumbs, cancelHref } = ENTRY[entry];

  async function create() {
    setMinting(true);
    setError(null);
    try {
      setCreated((await api.mint(design)) ?? "");
    } catch (e) {
      setError((e as Error).message || "Failed to create envelope");
    } finally {
      setMinting(false);
    }
  }

  return (
    <div className="pt-10 sm:pt-14">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        {crumbs.map((c) => (
          <span key={c.label}>
            <Link href={c.href} className="hover:text-ink">
              {c.label}
            </Link>
            {" / "}
          </span>
        ))}
        <span className="text-ink">Create New</span>
      </nav>

      {created !== null ? (
        <Created tokenId={created} design={design} entry={entry} />
      ) : (
        <>
          <h1 className="mt-10 text-4xl font-bold tracking-tight sm:text-[42px]">Create Envelope</h1>
          <p className="mt-6 text-lg text-ink-muted sm:mt-10">
            Start a personal keepsake. Keep it, fill it, or send it whenever you like.
          </p>

          <div className="mt-8 grid items-start gap-10 lg:grid-cols-[480px_1fr]">
            <div className="rounded-2xl border border-line bg-paper p-8">
              <EnvelopeIllustration className="w-full" />
              <div className="mt-5 truncate text-[26px] font-semibold">{DESIGN_NAMES[design]} Envelope +0</div>
              <div className="mt-4 text-sm font-medium text-brand">COMMON · A new story</div>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-8">
              <div className="text-lg font-medium">Choose a cover</div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                {DESIGN_NAMES.map((cover, i) => (
                  <button
                    key={cover}
                    onClick={() => setDesign(i)}
                    aria-pressed={design === i}
                    disabled={minting}
                    className={`rounded-2xl border p-4 text-left transition ${
                      design === i ? "border-sketch bg-seal/40" : "border-line bg-surface hover:border-sketch"
                    }`}
                  >
                    <EnvelopeIllustration className="w-full" />
                    <div className="mt-4 text-[17px]">{cover}</div>
                  </button>
                ))}
              </div>

              <p className="mt-5 text-[15px] text-ink-muted">Starts at +0 · Common · No gifting history</p>
              <p className="mt-5 leading-relaxed text-ink-muted">
                A linked account is created for the envelope&apos;s assets. It stays in My Envelopes until you send
                it.
              </p>
              <p className="mt-4 text-sm text-ink-muted">
                Creation &amp; network cost: shown in wallet before confirmation.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-4">
                <Link href={cancelHref} className={BUTTON_SECONDARY}>
                  Cancel
                </Link>
                {accountId ? (
                  <button onClick={create} disabled={minting} className={`${BUTTON_PRIMARY} disabled:opacity-50`}>
                    {minting ? "Creating…" : "Create Envelope"}
                  </button>
                ) : (
                  <button onClick={() => signIn()} disabled={!ready} className={`${BUTTON_PRIMARY} disabled:opacity-50`}>
                    Connect Wallet
                  </button>
                )}
              </div>
              {error && (
                <p role="alert" className="mt-3 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** 완료 화면: 다음 행동 선택. 보내기에서 들어왔으면 보내기가 기본 버튼 */
function Created({ tokenId, design, entry }: { tokenId: string; design: number; entry: CreateEntry }) {
  if (!tokenId) {
    return (
      <section className="mx-auto mt-10 max-w-[760px] rounded-2xl border border-line bg-surface px-6 py-12 text-center">
        <h1 className="text-3xl font-semibold">Your envelope is being created.</h1>
        <p className="mt-4 text-ink-muted">It will appear in My Envelopes once the transaction is confirmed.</p>
        <Link href="/envelopes" className={`${BUTTON_PRIMARY} mt-8 inline-block`}>
          Go to My Envelopes
        </Link>
      </section>
    );
  }

  const send = { href: `/send/${tokenId}`, label: "Send It Now" };
  const view = { href: `/envelopes/${tokenId}`, label: "View Envelope" };
  const [primary, secondary] = entry === "send" ? [send, view] : [view, send];

  return (
    <section className="mx-auto mt-10 max-w-[1020px] rounded-2xl border border-line bg-surface px-6 py-12 text-center sm:px-16">
      <div className="text-sm font-semibold uppercase tracking-wide text-brand">Envelope created</div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-[38px]">A new story starts here.</h1>
      <EnvelopeIllustration className="mx-auto mt-6 w-[260px] sm:w-[340px]" />
      <div className="mt-6 text-2xl">
        {DESIGN_NAMES[design]} Envelope #{tokenId}
      </div>
      <p className="mt-3 text-lg text-ink-muted">+0 · Common · Saved in My Envelopes</p>

      <div className="mx-auto mt-6 max-w-[760px] rounded-2xl border border-line bg-seal/40 px-6 py-5 text-[17px]">
        Welcome mission complete: <span className="font-semibold text-brand">+1 Enhancement Attempt</span>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <Link href={primary.href} className={BUTTON_PRIMARY}>
          {primary.label}
        </Link>
        <Link href={`/envelopes/${tokenId}/add`} className={BUTTON_SECONDARY}>
          Add Assets
        </Link>
        <Link href={secondary.href} className={BUTTON_SECONDARY}>
          {secondary.label}
        </Link>
      </div>
      <p className="mt-6 text-sm text-ink-muted">You can send it any time from My Envelopes or Send.</p>
    </section>
  );
}
