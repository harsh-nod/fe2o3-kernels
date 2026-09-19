import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthoringNavigation } from '../components/AuthoringNavigation';
import { AUTHORING_NAVIGATION_RETAINED_INPUT } from '../content/authoring-navigation-retained-input';
import '../styles.css';

createRoot(document.getElementById('root')!).render(<StrictMode><main>
  <h1>Draft: ordinary source and KIR navigation</h1>
  <p>Development preview of retained ordinary-source observations. No editing or release qualification is added.</p>
  <AuthoringNavigation input={AUTHORING_NAVIGATION_RETAINED_INPUT} />
</main></StrictMode>);
