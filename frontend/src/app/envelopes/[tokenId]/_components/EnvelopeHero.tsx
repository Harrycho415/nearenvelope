// 상세 상단 카드: 봉투 이름, 레벨/희귀도, 소유자·생성자, 보내기 버튼
// 소유자: C

import Link from "next/link";

import { EnvelopeIllustration } from "@/components/envelope/EnvelopeIllustration";
import { Tilt, sheenForLevel } from "@/components/envelope/Tilt";
import { RARITY_LABEL, RARITY_TEXT } from "@/components/envelope/designs";
import { shortAccount, type EnvelopeView } from "@/lib/near";

import { BUTTON_PRIMARY, envelopeName } from "../../_components/shared";

export function EnvelopeHero({ envelope, isOwner }: { envelope: EnvelopeView; isOwner: boolean }) {
  return (
    <section className="rise flex flex-col gap-6 sheet p-6 sm:flex-row sm:items-center sm:gap-9 sm:p-7">
      <Tilt sheen={sheenForLevel(envelope.level)} className="w-full max-w-[250px] shrink-0">
        <EnvelopeIllustration design={envelope.design} rarity={envelope.rarity} className="w-full" />
      </Tilt>

      <div className="min-w-0 flex-1">
        <h1 className="text-3xl tracking-tight sm:text-4xl">
          {envelopeName(envelope)} #{envelope.token_id}
        </h1>
        <div className="mt-4 font-mono text-sm tracking-[0.1em] sm:mt-5">
          +{envelope.level}
          <span className="mx-3 text-ink-muted">/</span>
          <span className={RARITY_TEXT[envelope.rarity]}>{RARITY_LABEL[envelope.rarity].toUpperCase()}</span>
        </div>
        <p className="mt-4 text-[17px]" title={envelope.owner_id}>
          Current Owner: {shortAccount(envelope.owner_id)}
        </p>
        <p className="mt-3 text-[15px] text-ink-muted" title={envelope.creator_id}>
          Created by: {shortAccount(envelope.creator_id)}
        </p>
      </div>

      {isOwner && (
        <Link href={`/send/${envelope.token_id}`} className={`${BUTTON_PRIMARY} shrink-0 self-start sm:self-center`}>
          Send an Envelope
        </Link>
      )}
    </section>
  );
}
