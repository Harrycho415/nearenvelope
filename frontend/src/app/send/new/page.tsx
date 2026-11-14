"use client";

// 보내기 흐름에서 새 봉투 만들기. 완료 화면에서 바로 보내기(기본)나 봉투 보기를 고른다.
// 소유자: C

import { CreateEnvelope } from "../../envelopes/_components/CreateEnvelope";

export default function CreateEnvelopePage() {
  return <CreateEnvelope entry="send" />;
}
