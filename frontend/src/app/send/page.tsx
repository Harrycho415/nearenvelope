"use client";

// 보내기 1단계: 봉투 카드의 Send → /send/[tokenId], 새 봉투는 /send/new
// 소유자: C

import Link from "next/link";
import { useEffect, useState } from "react";

import { ChooseEnvelopeCard } from "@/components/envelope/ChooseEnvelopeCard";
import { SendSteps } from "@/components/ui/SendSteps";
import { useNear, type EnvelopeView } from "@/lib/near";

export default function ChooseEnvelopePage() {
  const { accountId, api, signIn, ready } = useNear();
  const [envelopes, setEnvelopes] = useState<EnvelopeView[] | null>(null);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;

    api
      .envelopesForOwner(accountId)
      .then((owned) => owned.sort((a, b) => Number(a.token_id) - Number(b.token_id)))
      .catch(() => [])
      .then((list) => !cancelled && setEnvelopes(list));

    return () => {
      cancelled = true;
    };
  }, [accountId, api]);

  return (
    <div className="pt-14">
      <SendSteps current={1} />

      <h1 className="mt-10 text-4xl sm:text-[44px]">Choose an Envelope</h1>
      <p className="mt-3 text-lg text-ink-muted">Pick a piece of your story to pass along, or start a new one.</p>

      <div className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {!accountId ? (
          <Notice>
            Connect your wallet to see your envelopes.{" "}
            <button onClick={() => signIn()} disabled={!ready} className="link">
              Connect Wallet
            </button>
          </Notice>
        ) : envelopes === null ? (
          Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-[488px] animate-pulse sheet" />
          ))
        ) : envelopes.length === 0 ? (
          <Notice>You don&apos;t have any envelopes yet. Create one below to get started.</Notice>
        ) : (
          envelopes.map((envelope) => (
            <ChooseEnvelopeCard key={envelope.token_id} envelope={envelope} />
          ))
        )}
      </div>

      {accountId && <CreateEnvelopeBox />}

      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="btn btn-secondary"
        >
          Back Home
        </Link>
      </div>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="note p-6 text-sm text-ink-muted md:col-span-2 lg:col-span-3">
      {children}
    </div>
  );
}

/** "A new story starts here" 박스 → /send/new */
function CreateEnvelopeBox() {
  return (
    <section className="mt-8 flex flex-wrap items-center justify-between gap-4 sheet p-6">
      <div>
        <h2 className="text-xl">A new story starts here</h2>
        <p className="mt-3 text-[15px] text-ink-muted">Create a fresh envelope with no gifting history.</p>
      </div>
      <Link
        href="/send/new"
        className="btn btn-secondary"
      >
        Create New Envelope
      </Link>
    </section>
  );
}
