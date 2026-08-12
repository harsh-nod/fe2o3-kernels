import { BookOpen, FileText, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { glossary, lessons } from "../content/curriculum";
import { searchCatalog } from "../lib/search";

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const results = searchCatalog(query, lessons, glossary);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  if (!open) return null;

  const select = (lessonId: string) => {
    navigate(`/lesson/${lessonId}`);
    setQuery("");
    onClose();
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="search-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="search-input-row">
          <Search size={19} aria-hidden="true" />
          <label className="sr-only" htmlFor="curriculum-search" id="search-title">
            Search lessons and glossary
          </label>
          <input
            id="curriculum-search"
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") onClose();
              if (event.key === "Enter" && results[0]) {
                select(results[0].lessonId);
              }
            }}
            placeholder="Search concepts, APIs, or lessons"
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
        <div className="search-results" role="listbox">
          {results.length > 0 ? (
            results.map((result) => {
              const Icon = result.kind === "lesson" ? FileText : BookOpen;
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected="false"
                  key={result.id}
                  onClick={() => select(result.lessonId)}
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
            <p className="empty-search">No lesson or glossary entry matches.</p>
          )}
        </div>
        <footer className="search-footer">
          <span><kbd>Enter</kbd> open first result</span>
          <span><kbd>Esc</kbd> close</span>
        </footer>
      </section>
    </div>
  );
}
