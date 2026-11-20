import { Files, ImagePlus, ImageDown, Braces, TextCursorInput, QrCode, Calculator, Archive, Youtube, ArrowLeftRight, Film, ShieldCheck, Database, Code2, Type, ImageIcon, Landmark, Home, Shield, Briefcase, Target, Scale } from "lucide-react";
import type { ToolCategory, ToolDefinition } from "@/lib/tools-registry";
const icons = { "pdf-merger": Files, "background-remover": ImagePlus, "heic-converter": ImageDown, "zip-tool": Archive, "json-formatter": Braces, "qr-generator": QrCode, "word-counter": TextCursorInput, "youtube-toolkit": Youtube, "percentage-calculator": Calculator, "unit-converter": ArrowLeftRight } as const;
const categoryIcons = {
  pdf: Files,
  image: ImageIcon,
  media: Film,
  dev: Code2,
  crypto: ShieldCheck,
  youtube: Youtube,
  text: Type,
  calculator: Calculator,
  data: Database,
  finance: Landmark,
  "real-estate": Home,
  insurance: Shield,
  business: Briefcase,
  marketing: Target,
  legal: Scale,
};
export function ToolIcon({ tool, size = 24 }: { tool: ToolDefinition; size?: number }) {
  const Icon = Object.hasOwn(icons, tool.componentKey) ? icons[tool.componentKey as keyof typeof icons] : categoryIcons[tool.category];
  return <Icon size={size} strokeWidth={1.7} aria-hidden="true" />;
}
export function CategoryIcon({ category, size = 19 }: { category: ToolCategory; size?: number }) { const Icon = categoryIcons[category]; return <Icon size={size} strokeWidth={1.7} aria-hidden="true" />; }
