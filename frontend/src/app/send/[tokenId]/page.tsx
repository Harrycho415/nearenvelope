"use client";

// 보내기: 수신자 계정 + 메시지 입력 → api.sendEnvelope
// 소유자: C

import { useParams } from "next/navigation";

export default function SendPage() {
  const { tokenId } = useParams<{ tokenId: string }>();
  return <h1 className="text-2xl font-bold">Send Envelope #{tokenId} — TODO(C)</h1>;
}
