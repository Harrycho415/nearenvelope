"use client";

// 봉투 상세: 잔액, 채우기(fill / register_ft + fillFt), 열기(claim), 전달 기록 타임라인
// 소유자: C

import { useParams } from "next/navigation";

export default function EnvelopeDetailPage() {
  const { tokenId } = useParams<{ tokenId: string }>();
  return <h1 className="text-2xl font-bold">Envelope #{tokenId} — TODO(C)</h1>;
}
