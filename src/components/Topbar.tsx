import { Menu, Moon, Search, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { currentState } from "../content/current-state";
import type { Theme } from "../hooks/useTheme";

interface TopbarProps {
  theme: Theme;
  onMenu: () => void;
  onSearch: () => void;
  onTheme: () => void;
}

export function Topbar({ theme, onMenu, onSearch, onTheme }: TopbarProps) {
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  return (
    <header className="topbar">
      <button
        className="icon-button mobile-only"
        type="button"
        onClick={onMenu}
        aria-label="Open curriculum"
        title="Open curriculum"
      >
        <Menu size={20} />
      </button>
      <Link className="brand-lockup" to="/" aria-label="fe2o3 kernels overview">
        <span className="brand-mark">Fe</span>
        <div>
          <strong>fe2o3 kernels</strong>
          <span>Rust GPU field guide</span>
        </div>
      </Link>
      <div className="pin-summary" title={`Tree ${currentState.compilerTree}`}>
        <span className="pin-dot" aria-hidden="true" />
        <span>evidence pin {currentState.compilerShortCommit}</span>
        <span className="pin-target">gfx942 / gfx950</span>
      </div>
      <div className="topbar-actions">
        <button
          className="search-trigger"
          type="button"
          onClick={onSearch}
          aria-label="Search curriculum"
          title="Search curriculum"
        >
          <Search size={17} aria-hidden="true" />
          <span>Search</span>
          <kbd>⌘ K</kbd>
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={onTheme}
          aria-label={`Use ${theme === "dark" ? "light" : "dark"} theme`}
          title={`Use ${theme === "dark" ? "light" : "dark"} theme`}
        >
          <ThemeIcon size={18} />
        </button>
      </div>
    </header>
  );
}
