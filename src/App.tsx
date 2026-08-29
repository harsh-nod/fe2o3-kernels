import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Topbar } from "./components/Topbar";
import { useModalDialog } from "./hooks/useModalDialog";
import { useProgress } from "./hooks/useProgress";
import { useTheme } from "./hooks/useTheme";

const ArchitecturePage = lazy(() =>
  import("./components/ArchitecturePage").then((module) => ({
    default: module.ArchitecturePage,
  })),
);
const GlossaryPage = lazy(() =>
  import("./components/GlossaryPage").then((module) => ({
    default: module.GlossaryPage,
  })),
);
const LessonPage = lazy(() =>
  import("./components/LessonPage").then((module) => ({
    default: module.LessonPage,
  })),
);
const LiveKfdDebuggerPage = lazy(() =>
  import("./components/LiveKfdDebuggerPage").then((module) => ({
    default: module.LiveKfdDebuggerPage,
  })),
);
const OverviewPage = lazy(() =>
  import("./components/OverviewPage").then((module) => ({
    default: module.OverviewPage,
  })),
);
const ProgressPage = lazy(() =>
  import("./components/ProgressPage").then((module) => ({
    default: module.ProgressPage,
  })),
);
const SearchDialog = lazy(() =>
  import("./components/SearchDialog").then((module) => ({
    default: module.SearchDialog,
  })),
);
const Sidebar = lazy(() =>
  import("./components/Sidebar").then((module) => ({
    default: module.Sidebar,
  })),
);

interface DrawerProps {
  completed: Set<string>;
  onClose: () => void;
  onPrune: (validLessonIds: ReadonlySet<string>) => void;
}

function Drawer({ completed, onClose, onPrune }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useModalDialog(true, panelRef, onClose);

  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        ref={panelRef}
        className="drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Curriculum navigation"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <Sidebar
          completed={completed}
          mobile
          onClose={onClose}
          onNavigate={onClose}
          onPrune={onPrune}
        />
      </div>
    </div>
  );
}

function pageTitle(pathname: string): string {
  if (pathname === "/") return "Overview | fe2o3 kernels";
  if (pathname === "/architecture") return "Architecture | fe2o3 kernels";
  if (pathname === "/status") return "Implementation status | fe2o3 kernels";
  if (pathname === "/glossary") return "Glossary | fe2o3 kernels";
  if (pathname === "/debugger/live-kfd") return "Live KFD debugger | fe2o3 kernels";
  return "Lesson | fe2o3 kernels";
}

export function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { completed, toggle, prune } = useProgress();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const routeAnnouncement = pageTitle(location.pathname).replace(" | ", ", ");

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const title = pageTitle(location.pathname);
    document.title = title;

    const frame = window.requestAnimationFrame(() => {
      if (location.hash) {
        const target = document.getElementById(location.hash.slice(1));
        if (target) {
          target.tabIndex = -1;
          target.scrollIntoView({ block: "start" });
          target.focus({ preventScroll: true });
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: "instant" });
      document.getElementById("main-content")?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.pathname]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setDrawerOpen(false);
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <span className="sr-only" role="status" aria-live="polite">
        {routeAnnouncement}
      </span>
      <Topbar
        theme={theme}
        onMenu={() => {
          setSearchOpen(false);
          setDrawerOpen(true);
        }}
        onSearch={() => {
          setDrawerOpen(false);
          setSearchOpen(true);
        }}
        onTheme={toggleTheme}
      />
      <Suspense fallback={null}>
        <Sidebar completed={completed} onPrune={prune} />
      </Suspense>
      <main id="main-content" className="main-content" tabIndex={-1}>
        <Suspense fallback={<p className="route-loading" role="status">Loading content...</p>}>
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route
              path="/lesson/:lessonId"
              element={
                <LessonPage completed={completed} onToggleComplete={toggle} />
              }
            />
            <Route path="/architecture" element={<ArchitecturePage />} />
            <Route path="/status" element={<ProgressPage />} />
            <Route path="/glossary" element={<GlossaryPage />} />
            <Route path="/debugger/live-kfd" element={<LiveKfdDebuggerPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {drawerOpen && (
        <Suspense fallback={null}>
          <Drawer completed={completed} onClose={closeDrawer} onPrune={prune} />
        </Suspense>
      )}
      {searchOpen && (
        <Suspense fallback={null}>
          <SearchDialog open onClose={closeSearch} />
        </Suspense>
      )}
    </div>
  );
}
