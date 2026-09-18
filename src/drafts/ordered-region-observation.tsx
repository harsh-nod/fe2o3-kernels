import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { OrderedRegionObservation } from "../components/OrderedRegionObservation";
import { ORDERED_REGION_RETAINED_INPUT } from "../content/ordered-region-retained-input";
import "../styles.css";

createRoot(document.getElementById("root")!).render(<StrictMode>
  <main className="ordered-region-draft">
    <h1>Draft: authored roles and CPU logical observations</h1>
    <p>This standalone development preview is not a published curriculum lesson or a qualified compiler release.</p>
    <OrderedRegionObservation input={ORDERED_REGION_RETAINED_INPUT} />
  </main>
</StrictMode>);
