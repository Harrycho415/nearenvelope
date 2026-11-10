"use client";

// My Envelopes. TODO(C): 민트 버튼, 빈 상태, 잔액 표시
// 소유자: C

import Link from "next/link";
import { useEffect, useState } from "react";

import { EnvelopeCard } from "@/components/envelope/EnvelopeCard";
import { useNear, type EnvelopeView } from "@/lib/near";

export default function Home() {
  const { accountId, api } = useNear();
  const [envelopes, setEnvelopes] = useState<EnvelopeView[]>([]);

  useEffect(() => {
    if (accountId) api.envelopesForOwner(accountId).then(setEnvelopes);
  }, [accountId, api]);

  if (!accountId) return <p className="mt-12 text-center">지갑을 연결하세요.</p>;

  return (
    <section className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">My Envelopes</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {envelopes.map((e) => (
          <Link key={e.token_id} href={`/envelopes/${e.token_id}`}>
            <EnvelopeCard envelope={e} />
          </Link>
        ))}
      </div>
    </section>
  );
}
