import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ArchitecturePage } from "./components/ArchitecturePage";
import { GlossaryPage } from "./components/GlossaryPage";
import { LessonPage } from "./components/LessonPage";
import { SearchDialog } from "./components/SearchDialog";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { lessons } from "./content/curriculum";
import { useProgress } from "./hooks/useProgress";
import { useTheme } from "./hooks/useTheme";

export function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { completed, toggle } = useProgress();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to lesson</a>
      <Topbar
        theme={theme}
        onMenu={() => setDrawerOpen(true)}
        onSearch={() => setSearchOpen(true)}
        onTheme={toggleTheme}
      />
      <Sidebar completed={completed} />
      <main id="main-content" className="main-content" tabIndex={-1}>
        <Routes>
          <Route
            path="/"
            element={<Navigate to={`/lesson/${lessons[0].id}`} replace />}
          />
          <Route
            path="/lesson/:lessonId"
            element={
              <LessonPage completed={completed} onToggleComplete={toggle} />
            }
          />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {drawerOpen && (
        <div
          className="drawer-backdrop"
          role="presentation"
          onMouseDown={() => setDrawerOpen(false)}
        >
          <div
            className="drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Curriculum navigation"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <Sidebar
              completed={completed}
              mobile
              onClose={() => setDrawerOpen(false)}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
