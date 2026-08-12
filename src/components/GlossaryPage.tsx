import { ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { glossary } from "../content/curriculum";

export function GlossaryPage() {
  const [query, setQuery] = useState("");
  const normalized = query.toLocaleLowerCase().trim();
  const visible = glossary.filter((entry) =>
    `${entry.term} ${entry.definition}`.toLocaleLowerCase().includes(normalized),
  );

  return (
    <article className="reference-page glossary-page">
      <header className="reference-header">
        <p className="lesson-breadcrumb">Reference / glossary</p>
        <h1>Glossary and API index</h1>
        <p>
          Search the concepts, types, proof terms, and artifact boundaries used
          throughout the curriculum.
        </p>
      </header>
      <label className="glossary-search">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Filter glossary</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter terms"
        />
        <span>{visible.length} terms</span>
      </label>
      <div className="glossary-list">
        {visible.map((entry) => (
          <article key={entry.term}>
            <h2>{entry.term}</h2>
            <p>{entry.definition}</p>
            <Link to={`/lesson/${entry.lessonId}`}>
              Open lesson <ArrowRight size={14} />
            </Link>
          </article>
        ))}
      </div>
      {visible.length === 0 && <p className="empty-search">No matching terms.</p>}
    </article>
  );
}
