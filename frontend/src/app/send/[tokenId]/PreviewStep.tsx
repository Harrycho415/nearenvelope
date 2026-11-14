"use client";

// 보내기 4단계: 미리보기 → Seal & Send
// 소유자: C

import { EnvelopeIllustration } from "@/components/envelope/EnvelopeIllustration";
import { Tilt, sheenForLevel } from "@/components/envelope/Tilt";
import { RARITY_LABEL, RARITY_TEXT } from "@/components/envelope/designs";
import { displayName, type EnvelopeView } from "@/lib/near";

import { envelopeTitle, StepHeader } from "./shared";

export function PreviewStep({
  envelope,
  receiverId,
  message,
  totalText,
  sending,
  error,
  onBack,
  onSend,
}: {
  envelope: EnvelopeView;
  receiverId: string;
  message: string;
  totalText: string | null;
  sending: boolean;
  error: string | null;
  onBack: () => void;
  onSend: () => void;
}) {
  const shared = envelope.history.length;
  const items = [
    envelopeTitle(envelope),
    totalText,
    message && "Your message",
    shared > 0 && "The envelope’s existing history",
  ].filter(Boolean) as string[];

  return (
    <>
      <StepHeader title="Ready to send?" subtitle="A gift of value. A message that matters." />

      <div className="mt-9 grid items-start gap-10 lg:grid-cols-[570px_1fr]">
        <div className="sheet bg-paper p-10 text-center">
          <Tilt sheen={sheenForLevel(envelope.level)} className="rise">
            <EnvelopeIllustration design={envelope.design} rarity={envelope.rarity} className="w-full" />
          </Tilt>
          <h2 className="mt-8 text-3xl font-semibold">{envelopeTitle(envelope)}</h2>
          <div className={`mt-5 label ${RARITY_TEXT[envelope.rarity]}`}>
            {RARITY_LABEL[envelope.rarity]}
          </div>
          <p className="mt-6 text-left text-[15px] text-ink-muted">
            {shared > 0
              ? `A story shared ${shared} ${shared === 1 ? "time" : "times"}. Ready for its next chapter.`
              : "A brand-new story, ready for its first chapter."}
          </p>
        </div>

        <div className="sheet p-8">
          <div className="text-2xl font-semibold">To: {receiverId}</div>
          <div className="mt-5 text-3xl font-semibold">Inside: {totalText ?? "Nothing"}</div>

          {message && (
            <div className="mt-5 note p-6">
              <div className="label text-brand">Your message</div>
              <p className="mt-4 whitespace-pre-wrap break-words text-xl">&ldquo;{message}&rdquo;</p>
            </div>
          )}

          <div className="mt-6 text-lg font-semibold">You are sending</div>
          <ul className="mt-4 space-y-1 text-[17px]">
            {items.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <p className="mt-4 text-[15px] text-ink-muted">
            {displayName(receiverId)} becomes the owner and controls the assets inside.
          </p>

          <p className="mt-5 text-sm text-ink-muted">
            Estimated network fee: &lt; 0.01 NEAR
            <br />
            Your wallet will ask you to confirm.
          </p>

          <div className="mt-4 flex gap-4">
            <button
              onClick={onBack}
              disabled={sending}
              className="btn btn-secondary"
            >
              Back
            </button>
            <button
              onClick={onSend}
              disabled={sending}
              className="btn btn-primary"
            >
              {sending ? "Sending…" : "Seal & Send"}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        </div>
      </div>
    </>
  );
}
