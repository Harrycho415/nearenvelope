"use client";

// 새 봉투 만들기: 디자인 선택 → mint → /send/[tokenId] (자산 넣기)
// 소유자: C

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DESIGN_NAMES } from "@/components/envelope/designs";
import { EnvelopeIllustration } from "@/components/envelope/EnvelopeIllustration";
import { useNear } from "@/lib/near";

export default function CreateEnvelopePage() {
  const router = useRouter();
  const { accountId, api, signIn, ready } = useNear();
  const [design, setDesign] = useState(0);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setMinting(true);
    setError(null);
    try {
      const tokenId = await api.mint(design);
      // null = 리다이렉트형 지갑이라 결과를 바로 모름 → 목록에서 다시 고르게 한다.
      router.push(tokenId ? `/send/${tokenId}` : "/send");
    } catch (e) {
      setError((e as Error).message || "Failed to create envelope");
      setMinting(false);
    }
  }

  return (
    <div className="pt-14">
      <nav className="text-sm text-ink-muted">
        <Link href="/send" className="hover:text-ink">
          Send
        </Link>
        {" / "}
        <Link href="/send" className="hover:text-ink">
          Choose Envelope
        </Link>
        {" / "}
        <span className="text-ink">Create New</span>
      </nav>

      <h1 className="mt-10 text-4xl font-bold tracking-tight sm:text-[42px]">Create Envelope</h1>
      <p className="mt-10 text-lg text-ink-muted">Start a personal keepsake. You can put assets inside next.</p>

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
            A linked account is created for the envelope&apos;s assets. You remain in control until you send the
            envelope.
          </p>
          <p className="mt-4 text-sm text-ink-muted">Creation &amp; network cost: shown in wallet before confirmation.</p>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Link
              href="/send"
              className="rounded-lg border border-line bg-surface px-6 py-3.5 font-semibold text-ink transition hover:border-sketch"
            >
              Cancel
            </Link>
            {accountId ? (
              <button
                onClick={create}
                disabled={minting}
                className="rounded-lg bg-brand px-6 py-3.5 font-semibold text-white transition hover:bg-brand-hover disabled:opacity-50"
              >
                {minting ? "Creating…" : "Create Envelope"}
              </button>
            ) : (
              <button
                onClick={() => signIn()}
                disabled={!ready}
                className="rounded-lg bg-brand px-6 py-3.5 font-semibold text-white transition hover:bg-brand-hover disabled:opacity-50"
              >
                Connect Wallet
              </button>
            )}
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <p className="mt-6 text-[15px] font-medium text-brand">Next: Put something inside →</p>
        </div>
      </div>
    </div>
  );
}
