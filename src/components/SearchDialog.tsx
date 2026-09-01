import {
  BookOpen,
  Braces,
  FileText,
  Search,
  Rows3,
  TextSelect,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { glossary, lessons } from "../content/curriculum";
import { useModalDialog } from "../hooks/useModalDialog";
import { searchCatalog, type SearchResult } from "../lib/search";

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

const resultIcons = {
  page: FileText,
  operator: Rows3,
  lesson: FileText,
  section: TextSelect,
  diagnostic: Braces,
  glossary: BookOpen,
} satisfies Record<SearchResult["kind"], typeof FileText>;

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const results = useMemo(
    () => searchCatalog(query, lessons, glossary),
    [query],
  );
  const selectedIndex = Math.min(activeIndex, Math.max(0, results.length - 1));
  useModalDialog(open, dialogRef, onClose, inputRef);

  useEffect(() => {
    const activeOption = document.getElementById(
      results[selectedIndex]?.id ?? "",
    );
    activeOption?.scrollIntoView?.({ block: "nearest" });
  }, [results, selectedIndex]);

  if (!open) return null;

  const select = (result: SearchResult) => {
    navigate(result.href);
    setQuery("");
    onClose();
  };

  const move = (offset: number) => {
    if (results.length === 0) return;
    setActiveIndex((current) =>
      (current + offset + results.length) % results.length
    );
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className="search-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="search-input-row">
          <Search size={19} aria-hidden="true" />
          <label className="sr-only" htmlFor="curriculum-search" id="search-title">
            Search all lesson content
          </label>
          <input
            id="curriculum-search"
            ref={inputRef}
            role="combobox"
            aria-autocomplete="list"
            aria-controls="search-results"
            aria-expanded="true"
            aria-activedescendant={results[selectedIndex]?.id}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                move(1);
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                move(-1);
              } else if (event.key === "Enter" && results[selectedIndex]) {
                event.preventDefault();
                select(results[selectedIndex]);
              }
            }}
            placeholder="Search diagnostics, concepts, code, or lessons"
            autoComplete="off"
          />
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close search"
            title="Close search"
          >
            <X size={18} />
          </button>
        </div>
        <div className="search-results" id="search-results" role="listbox">
          {results.length > 0 ? (
            results.map((result, index) => {
              const Icon = resultIcons[result.kind];
              return (
                <button
                  id={result.id}
                  type="button"
                  role="option"
                  aria-selected={index === selectedIndex}
                  className={index === selectedIndex ? "active" : undefined}
                  key={result.id}
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={() => select(result)}
                >
                  <Icon size={17} aria-hidden="true" />
                  <span>
                    <strong>{result.title}</strong>
                    <small>{result.context}</small>
                  </span>
                  <span className="result-kind">{result.kind}</span>
                </button>
              );
            })
          ) : (
            <p className="empty-search">No matching lesson content.</p>
          )}
        </div>
        <footer className="search-footer">
          <span><kbd>Up</kbd><kbd>Down</kbd> navigate</span>
          <span><kbd>Enter</kbd> open</span>
          <span><kbd>Esc</kbd> close</span>
        </footer>
      </section>
    </div>
  );
}
