import { Logo } from "./Logo";
import { NavLinks } from "./NavLinks";
import { SearchTrigger } from "./SearchDialog";
import { publishedTools } from "@/lib/published";

export function Header() {
  return (
    <header className="lt-header">
      <div className="lt-wrap lt-header__row">
        <Logo />
        <NavLinks />
        <SearchTrigger className="lt-search-trigger" count={publishedTools.length}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </SearchTrigger>
      </div>
    </header>
  );
}
