// Synthetic browser layout control only; never imported into retained content.
import { createRoot } from 'react-dom/client';
import { AuthoringNavigation } from '../../src/components/AuthoringNavigation';
import { syntheticNavigationInput } from '../../scripts/tests/fixtures/authoring-navigation-fixture.mjs';
import '../../src/styles.css';

void syntheticNavigationInput().then(input => createRoot(document.getElementById('root')!).render(<main>
  <h1>Synthetic navigation layout control — not execution evidence</h1>
  <AuthoringNavigation input={input} />
</main>));
