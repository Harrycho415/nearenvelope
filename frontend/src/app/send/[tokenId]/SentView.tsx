// 보내기 완료 화면
// 소유자: C

import Link from "next/link";

import { EnvelopeIllustration } from "@/components/envelope/EnvelopeIllustration";
import { Tilt, sheenForLevel } from "@/components/envelope/Tilt";
import { RARITY_LABEL, RARITY_TEXT } from "@/components/envelope/designs";
import { displayName, EXPLORER_URL, type EnvelopeView } from "@/lib/near";

import { envelopeTitle } from "./shared";

export function SentView({
  envelope,
  from,
  to,
  totalText,
  txHash,
}: {
  envelope: EnvelopeView;
  from: string;
  to: string;
  totalText: string | null;
  txHash: string | null;
}) {
  return (
    <section className="mx-auto max-w-[1000px] sheet px-6 py-14 text-center">
      <p className="postmark thunk">Sent</p>
      <h1 className="mt-6 text-4xl sm:text-[44px]">Your Envelope is on its way.</h1>
      <p className="mt-6 text-lg text-ink-muted">A new chapter starts with {displayName(to)}.</p>

      <Tilt sheen={sheenForLevel(envelope.level)} className="settle mx-auto mt-2 w-full max-w-[360px]">
        <EnvelopeIllustration design={envelope.design} rarity={envelope.rarity} className="w-full" />
      </Tilt>
      <h2 className="mt-6 text-3xl">{envelopeTitle(envelope)}</h2>
      <div className={`mt-5 label ${RARITY_TEXT[envelope.rarity]}`}>
        {RARITY_LABEL[envelope.rarity]}
      </div>
      <p className="mt-5 text-2xl">
        {displayName(from)} → {displayName(to)}
      </p>
      {totalText && <p className="mt-5 text-4xl font-semibold">{totalText}</p>}
      <p className="mt-6 text-[17px] text-ink-muted">
        {displayName(to)} now owns this envelope{totalText ? " and the assets inside" : ""}.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <Link
          href="/send"
          className="btn btn-primary"
        >
          Send Another Envelope
        </Link>
        <Link
          href="/"
          className="btn btn-secondary"
        >
          Back Home
        </Link>
      </div>

      <p className="mt-6 text-sm text-ink-muted">
        Delivery confirmed
        {txHash && (
          <>
            {" · "}
            <a
              href={`${EXPLORER_URL}/txns/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-ink hover:underline"
            >
              View transaction details ↗
            </a>
          </>
        )}
      </p>
    </section>
  );
}
