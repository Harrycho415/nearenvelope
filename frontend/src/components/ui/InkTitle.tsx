// 글자가 한 자씩 찍히듯 나타나는 제목 (홈 히어로 전용). 화면 낭독기는 aria-label로 문장 전체를 읽는다.
// 소유자: C

import type { CSSProperties } from "react";

export function InkTitle({ text, className = "" }: { text: string; className?: string }) {
  let i = 0;
  return (
    <h1 aria-label={text} className={className}>
      {text.split(" ").map((word, w) => (
        <span key={w} aria-hidden className="inline-block whitespace-nowrap">
          {[...word].map((ch) => (
            <span key={i} className="ink-letter" style={{ "--i": i++ } as CSSProperties}>
              {ch}
            </span>
          ))}
          <span className="ink-letter">&nbsp;</span>
        </span>
      ))}
    </h1>
  );
}
