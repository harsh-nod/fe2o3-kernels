import { BookOpen, Check, GitBranch, Network, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { curriculum, lessons } from "../content/curriculum";

interface SidebarProps {
  completed: Set<string>;
  mobile?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
}

export function Sidebar({
  completed,
  mobile = false,
  onNavigate,
  onClose,
}: SidebarProps) {
  const progress = Math.round((completed.size / lessons.length) * 100);

  return (
    <aside
      className={mobile ? "sidebar sidebar-mobile" : "sidebar"}
      aria-label="Curriculum"
    >
      {mobile && (
        <div className="sidebar-mobile-head">
          <span>Curriculum</span>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close curriculum"
            title="Close curriculum"
          >
            <X size={18} />
          </button>
        </div>
      )}
      <div className="progress-block" aria-label={`${progress}% complete`}>
        <div className="progress-label">
          <span>Course progress</span>
          <strong>{completed.size}/{lessons.length}</strong>
        </div>
        <div className="progress-track" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <nav className="curriculum-tree" aria-label="Lessons">
        {curriculum.map((module) => (
          <section className="tree-module" key={module.number}>
            <div className="tree-module-title">
              <span className="module-number">{module.number}</span>
              <span>{module.title}</span>
            </div>
            <div className="tree-lessons">
              {module.lessons.map((lesson) => (
                <NavLink
                  className={({ isActive }) =>
                    `tree-link${isActive ? " active" : ""}`
                  }
                  key={lesson.id}
                  onClick={onNavigate}
                  to={`/lesson/${lesson.id}`}
                >
                  <span className="tree-status" aria-hidden="true">
                    {completed.has(lesson.id) ? <Check size={12} /> : null}
                  </span>
                  <span>{lesson.title}</span>
                </NavLink>
              ))}
            </div>
          </section>
        ))}
      </nav>

      <nav className="reference-nav" aria-label="Reference">
        <NavLink onClick={onNavigate} to="/architecture">
          <Network size={16} /> Architecture
        </NavLink>
        <NavLink onClick={onNavigate} to="/glossary">
          <BookOpen size={16} /> Glossary & API
        </NavLink>
        <a
          href="https://github.com/harsh-nod/fe2o3"
          target="_blank"
          rel="noreferrer"
        >
          <GitBranch size={16} /> fe2o3 source
        </a>
      </nav>
    </aside>
  );
}
