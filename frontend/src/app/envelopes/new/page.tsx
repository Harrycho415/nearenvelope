"use client";

// My Envelopes에서 새 봉투 만들기. 만든 봉투는 목록에 남고, 보내기는 나중에 해도 된다.
// 소유자: C

import { CreateEnvelope } from "../_components/CreateEnvelope";

export default function NewEnvelopePage() {
  return <CreateEnvelope entry="envelopes" />;
}
