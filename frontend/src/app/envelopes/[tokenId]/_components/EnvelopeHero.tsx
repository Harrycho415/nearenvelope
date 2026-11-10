// 상세 상단 카드: 봉투 이름, 레벨/희귀도, 소유자·생성자, 보내기 버튼
// 소유자: C

import Link from "next/link";

import { EnvelopeIllustration } from "@/components/envelope/EnvelopeIllustration";
import { RARITY_LABEL } from "@/components/envelope/designs";
import { shortAccount, type EnvelopeView } from "@/lib/near";

import { BUTTON_PRIMARY, envelopeName } from "../../_components/shared";

export function EnvelopeHero({ envelope, isOwner }: { envelope: EnvelopeView; isOwner: boolean }) {
  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center sm:gap-9 sm:p-7">
      <EnvelopeIllustration className="w-full max-w-[250px] shrink-0" />

      <div className="min-w-0 flex-1">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {envelopeName(envelope)} #{envelope.token_id}
        </h1>
        <div className="mt-4 text-lg font-medium text-brand sm:mt-5">
          +{envelope.level}
          <span className="mx-3">/</span>
          {RARITY_LABEL[envelope.rarity].toUpperCase()}
        </div>
        <p className="mt-4 text-[17px]" title={envelope.owner_id}>
          Current Owner: {shortAccount(envelope.owner_id)}
        </p>
        <p className="mt-3 text-[15px] text-ink-muted" title={envelope.creator_id}>
          Created by: {shortAccount(envelope.creator_id)}
        </p>
      </div>

      {isOwner && (
        <Link href={`/send/${envelope.token_id}`} className={`${BUTTON_PRIMARY} shrink-0 sm:mr-12 lg:mr-20`}>
          Send an Envelope
        </Link>
      )}
    </section>
  );
}
