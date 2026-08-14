import { Menu, Moon, Search, Sun } from "lucide-react";
import { FE2O3_PIN } from "../content/model";
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
      <div className="brand-lockup">
        <span className="brand-mark">Fe</span>
        <div>
          <strong>fe2o3 kernels</strong>
          <span>proof-aware field guide</span>
        </div>
      </div>
      <div className="pin-summary" title={`Tree ${FE2O3_PIN.tree}`}>
        <span className="pin-dot" aria-hidden="true" />
        <span>lesson pin {FE2O3_PIN.shortCommit}</span>
        <span className="pin-target">gfx942</span>
      </div>
      <div className="topbar-actions">
        <button className="search-trigger" type="button" onClick={onSearch}>
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
