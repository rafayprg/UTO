import Link from "next/link";

type Props = { tone?: "ink" | "paper" };

/** Wordmark: an ink tile with a highlighter stroke under an "L". */
export function Logo({ tone = "ink" }: Props) {
  const tile = tone === "ink" ? "#15201b" : "#f5f6f2";
  const letter = tone === "ink" ? "#f5f6f2" : "#15201b";
  return (
    <Link href="/" className="lt-logo" aria-label="Localtools home">
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
        <rect width="30" height="30" rx="7" fill={tile} />
        <rect x="6" y="19" width="18" height="5" rx="1.5" fill="#f2e35b" />
        <path d="M10 6.5v14h10" fill="none" stroke={letter} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Localtools
    </Link>
  );
}
