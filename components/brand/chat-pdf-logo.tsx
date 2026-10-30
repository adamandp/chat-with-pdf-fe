import type { CSSProperties } from "react";

/** Two stacked documents, drawn with native SVG for crisp rendering at every size. */
export function ChatPdfLogo({ size = 40, className, style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg data-chat-pdf-logo aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} style={{ flexShrink: 0, ...style }}>
      <rect x="10" y="23" width="40" height="37" rx="7" fill="#111" />
      <rect x="5" y="17" width="40" height="37" rx="7" fill="#FFE665" stroke="#101010" strokeWidth="3.5" />
      <path d="M12 38h22M12 45h19" stroke="#101010" strokeWidth="3.5" strokeLinecap="round" />
      <rect x="27" y="10" width="31" height="41" rx="6" fill="#101010" />
      <rect x="22" y="5" width="31" height="41" rx="6" fill="#FF7C96" stroke="#101010" strokeWidth="3.5" />
      <path d="M29 16h8l7 7v14" stroke="#101010" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M37 16v7h7M29 30h15M29 36h12" stroke="#101010" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
