import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock3,
  ListChecks,
} from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { curriculum, lessonById, lessons } from "../content/curriculum";
import { LessonDiagram } from "../diagrams/LessonDiagram";
import { ClaimList } from "./ClaimList";
import { CodeTabs } from "./CodeTabs";
import { EvidenceBadge } from "./EvidenceBadge";
import { FunctionalCorrectnessPanel } from "./FunctionalCorrectnessPanel";
import { LessonSections } from "./LessonSections";

interface LessonPageProps {
  completed: Set<string>;
  onToggleComplete: (lessonId: string) => void;
}

export function LessonPage({ completed, onToggleComplete }: LessonPageProps) {
  const { lessonId } = useParams();
  const lesson = lessonId ? lessonById.get(lessonId) : undefined;
  if (!lesson) return <Navigate to={`/lesson/${lessons[0].id}`} replace />;

  const module = curriculum.find((entry) => entry.number === lesson.module)!;
  const lessonIndex = lessons.findIndex((entry) => entry.id === lesson.id);
  const previous = lessons[lessonIndex - 1];
  const next = lessons[lessonIndex + 1];
  const isComplete = completed.has(lesson.id);

  return (
    <article className="lesson-page">
      <header className="lesson-header">
        <p className="lesson-breadcrumb">
          Module {lesson.module} <span>/</span> {module.title}
        </p>
        <div className="lesson-title-row">
          <div>
            <h1>{lesson.title}</h1>
            <p className="lesson-summary">{lesson.summary}</p>
          </div>
          <button
            className={`completion-button${isComplete ? " complete" : ""}`}
            type="button"
            onClick={() => onToggleComplete(lesson.id)}
          >
            {isComplete ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            {isComplete ? "Completed" : "Mark complete"}
          </button>
        </div>
        <div className="lesson-meta">
          <span><Clock3 size={15} /> {lesson.duration}</span>
          <span><ListChecks size={15} /> {lesson.objectives.length} objectives</span>
          <div className="lesson-statuses">
            {[...new Set(lesson.claims.map((claim) => claim.kind))].map((kind) => (
              <EvidenceBadge kind={kind} key={kind} />
            ))}
          </div>
        </div>
      </header>

      <section className="lesson-intro-band">
        <div>
          <p className="section-kicker">Prerequisites</p>
          <ul className="compact-list">
            {lesson.prerequisites.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div>
          <p className="section-kicker">You will be able to</p>
          <ul className="objective-list">
            {lesson.objectives.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </section>

      {lesson.diagram && <LessonDiagram kind={lesson.diagram} />}
      <ClaimList claims={lesson.claims} />
      <LessonSections lessonId={lesson.id} sections={lesson.sections} />
      <FunctionalCorrectnessPanel lessonId={lesson.id} />

      <section className="code-section">
        <p className="section-kicker">Workbench</p>
        <h2>Source, proof, host, and result</h2>
        <p>
          Tabs are separate on purpose. Read the evidence label before using a
          snippet as executable source.
        </p>
        <CodeTabs key={lesson.id} tabs={lesson.tabs} />
      </section>

      <section className="assurance-summary" aria-labelledby="assurance-heading">
        <p className="section-kicker">Boundary check</p>
        <h2 id="assurance-heading">Trust boundaries</h2>
        <div className="assurance-columns">
          <div>
            <strong>Trusted in this lesson</strong>
            <ul>
              <li>The pinned toolchain and commands execute as documented.</li>
              <li>Model premises and runtime observations are supplied at their named boundaries.</li>
            </ul>
          </div>
          <div>
            <strong>Not proved by implication</strong>
            <ul>
              <li>No label upgrades another evidence class automatically.</li>
              <li>Source-to-machine refinement requires its own authenticated evidence.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="exercise-section" aria-labelledby="exercise-heading">
        <p className="section-kicker">Practice</p>
        <h2 id="exercise-heading">Exercises</h2>
        {lesson.exercises.map((exercise, index) => (
          <article className="exercise-row" key={exercise.prompt}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3>{exercise.prompt}</h3>
              <details>
                <summary>Show hint</summary>
                <p>{exercise.hint}</p>
              </details>
              <p className="acceptance"><strong>Acceptance:</strong> {exercise.acceptance}</p>
            </div>
          </article>
        ))}
      </section>

      <nav className="lesson-pagination" aria-label="Lesson pagination">
        {previous ? (
          <Link to={`/lesson/${previous.id}`}>
            <ArrowLeft size={17} />
            <span><small>Previous</small>{previous.title}</span>
          </Link>
        ) : <span />}
        {next && (
          <Link className="next" to={`/lesson/${next.id}`}>
            <span><small>Next</small>{next.title}</span>
            <ArrowRight size={17} />
          </Link>
        )}
      </nav>
    </article>
  );
}
