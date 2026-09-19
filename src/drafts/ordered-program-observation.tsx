import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OrderedProgramObservation } from '../components/OrderedProgramObservation';
import { ORDERED_PROGRAM_RETAINED_INPUT } from '../content/ordered-program-retained-input';
import '../styles.css';

createRoot(document.getElementById('root')!).render(<StrictMode><main>
  <h1>Draft: recorded ordered-program observations</h1>
  <p>Development-only preview of retained V17 diagnostic CPU observations from 36 public debugger sessions. This page is not a published curriculum lesson.</p>
  <OrderedProgramObservation input={ORDERED_PROGRAM_RETAINED_INPUT} />
</main></StrictMode>);
