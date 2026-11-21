"use client";

import Link from "next/link";

export default function ErrorPage() {
  return (
    <div className="page-container empty">
      <p className="eyebrow">500 · SYSTEM NOTICE</p>
      <h1>Something went wrong.</h1>
      <p>An unexpected client-side error occurred. Let’s get you back to the toolkit.</p>
      <Link href="/" className="button">
        Back to home &rarr;
      </Link>
    </div>
  );
}
