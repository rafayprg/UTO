import Link from "next/link";
import { categories, tools, type ToolCategory } from "@/lib/tools-registry";
import { CategoryIcon } from "./ToolIcon";
import { LayoutGrid, ShieldCheck, ArrowUpRight } from "lucide-react";
export function CategoryNav({ active }: { active?: ToolCategory }) {
  return <aside className="suite-sidebar"><p className="eyebrow">YOUR APPS, ORGANIZED</p><nav aria-label="Tool suites"><Link href="/#directory" className={!active ? "selected" : ""}><LayoutGrid size={19}/><span>All apps</span><small>{tools.length}</small></Link>{(Object.keys(categories) as ToolCategory[]).map(category => <Link key={category} href={`/tools/${category}/`} className={active === category ? "selected" : ""} aria-current={active === category ? "page" : undefined}><CategoryIcon category={category}/><span>{categories[category]}</span><small>{tools.filter(tool => tool.category === category).length}</small></Link>)}</nav><div className="sidebar-note"><ShieldCheck size={24}/><h3>Your work stays yours.</h3><p>Files are processed on your device, never on our servers.</p><Link href="/privacy-policy/">Our privacy approach <ArrowUpRight size={13}/></Link></div></aside>;
}
