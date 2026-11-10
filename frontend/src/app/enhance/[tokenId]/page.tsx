"use client";

// 강화: 미션 진행, check-in, 확률표, 강화 버튼 + 성공/실패 연출
// 소유자: D

import { useParams } from "next/navigation";

export default function EnhancePage() {
  const { tokenId } = useParams<{ tokenId: string }>();
  return <h1 className="text-2xl font-bold">Enhance Envelope #{tokenId} — TODO(D)</h1>;
}
