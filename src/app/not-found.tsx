import Link from "next/link";
export default function NotFound() { return <div className="page-container empty"><p className="eyebrow">404 · A SMALL DETOUR</p><h1>This page isn’t here.</h1><p>Let’s get you back to the toolkit.</p><Link href="/" className="button">Back to home →</Link></div>; }
