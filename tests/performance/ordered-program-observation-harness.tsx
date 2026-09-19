// Test harness only; this input must never be presented as a retained execution.
import { createRoot } from 'react-dom/client';
import { OrderedProgramObservation } from '../../src/components/OrderedProgramObservation';
import { syntheticProgramInput } from '../../scripts/tests/fixtures/ordered-program-observation-fixture.mjs';
import '../../src/styles.css';

void syntheticProgramInput().then(input => createRoot(document.getElementById('root')!).render(<main>
  <h1>Synthetic presentation test — not execution evidence</h1>
  <OrderedProgramObservation input={input} />
</main>));
