import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../src/App";

function renderApp(path = "/lesson/read-the-evidence") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("application shell", () => {
  beforeEach(() => window.localStorage.clear());

  it("renders the tutorial app as its first screen", async () => {
    renderApp();
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Read the evidence before the code",
      }, { timeout: 5_000 }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Curriculum")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Kernel" })).toBeInTheDocument();
  });

  it("persists completed lesson progress", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(await screen.findByRole("button", { name: "Mark complete" }, { timeout: 5_000 }));
    expect(screen.getByRole("button", { name: "Completed" })).toBeInTheDocument();
    expect(window.localStorage.getItem("fe2o3-kernels-progress-v2")).toContain(
      "read-the-evidence",
    );
  });

  it("searches lessons and navigates to the result", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: /Search/ }));
    const input = await screen.findByRole("combobox", {
      name: "Search all lesson content",
    }, { timeout: 5_000 });
    await user.type(input, "flash attention");
    await user.click(
      screen.getByRole("option", {
        name: /^Dynamic FlashAttention with MFMAModule 5/u,
      }),
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Dynamic FlashAttention with MFMA",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("GPU observed").length).toBeGreaterThan(0);
  });

  it("renders real row-softmax source without upgrading its evidence", async () => {
    const user = userEvent.setup();
    renderApp("/lesson/softmax-invariant");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Dynamic row softmax",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "pub fn row_softmax_general_v1",
    );
    expect(screen.queryByText(/Explanatory source/u)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Source" })).toHaveAttribute(
      "href",
      "https://github.com/harsh-nod/fe2o3/blob/97abdba6ab9e1337f55d6ffccd8b1f5feeb69aed/examples/row_softmax_general_v1/src/kernel.rs",
    );

    await user.click(screen.getByRole("tab", { name: "Verus proof" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "exact_hierarchy_writes_refine_safe_cpu_reference_v1",
    );
    await user.click(screen.getByRole("tab", { name: "Host" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "name: \"single-column\"",
    );
    await user.click(screen.getByRole("tab", { name: "Expected result" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "lane shuffles and no MFMA",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "not a proof for every input or a performance claim",
    );
  });

  it("shows public and candidate kernel delivery states separately", async () => {
    renderApp("/status");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Kernel delivery and verification progress",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Kernel implementation status" })).toBeInTheDocument();
    expect(screen.getByText("Historical audited baseline")).toBeInTheDocument();
    expect(screen.getByText("Publication-gated snapshot")).toBeInTheDocument();
    expect(screen.getByText("97abdba6ab9e")).toBeInTheDocument();
    expect(
      screen.getByText(/This site build is valid only after/),
    ).toHaveTextContent(
      "publication workflow verifies that harsh-nod/fe2o3 and powderluv/fe2o3 refs/heads/main both resolve exactly",
    );
    expect(screen.getByText(/This site build is valid only after/)).toHaveTextContent(
      "Both the commit and tree are required",
    );
    expect(screen.getByText(/This site build is valid only after/)).toHaveTextContent(
      "910e70ccdb06510708cc73ffd0da7c6a4ae64ab5",
    );
    expect(
      screen.getByText("Published implementation snapshot (publication gated)"),
    ).toBeInTheDocument();
    const compilerRefactor = screen
      .getByText("Pliron ownership and device identity at 2f7c4fd1d")
      .closest("article");
    expect(compilerRefactor).toHaveTextContent("2610651306ea3ba670f68d5d8b1e1159bcd521ed");
    expect(compilerRefactor).toHaveTextContent("PassPlan is bounded and non-executing");
    expect(compilerRefactor).toHaveTextContent("Issues #134, #135, and #140 remain open");
    expect(compilerRefactor).toHaveTextContent("run/verify/evidence gate");
    expect(compilerRefactor).toHaveTextContent("opaque KIR bridge preserves canonical V1-V5 bytes");
    expect(compilerRefactor).toHaveTextContent("not a second KIR serialization or semantic lowering");
    expect(compilerRefactor).toHaveTextContent("detached context-bound services");
    expect(compilerRefactor).toHaveTextContent("typed terminal errors");
    expect(compilerRefactor).toHaveTextContent("no fallback and no result after failure");
    expect(compilerRefactor).toHaveTextContent("no COMGR or pliron-llvm path");
    expect(compilerRefactor).toHaveTextContent("checked MI300X identity");
    expect(compilerRefactor).toHaveTextContent("does not detect GPU reset");
    expect(screen.getByText("Worker V2 ACK harness isolation").closest("article")).toHaveTextContent(
      "test-harness determinism repair only",
    );
    expect(screen.getByText("Row-softmax ordinary attributed source").closest("article")).toHaveTextContent(
      "Complete syn AST structural admission",
    );
    expect(screen.getByText("Durable broker prepared-session foundation").closest("article")).toHaveTextContent(
      "AUTHORITY=none",
    );
    expect(screen.getByText("Deterministic generic CI sharding").closest("article")).toHaveTextContent(
      "the complete powderluv/fe2o3 GitHub-hosted generic run",
    );
    const w0Heading = screen.getByText(
      "Accepted W0/G1 static host-link boundary",
    );
    const w0Card = w0Heading.closest("article");
    expect(w0Card).toHaveTextContent("85,597,472-byte tool");
    expect(w0Card).toHaveTextContent("measured/no-authority");
    expect(w0Card).toHaveTextContent(
      "7c1a7429e93896393eb743ed54ead78ec6d492e3ed887183e67737b3872d7bf9",
    );
    const brokerHeading = screen.getByText(
      "Inert Broker V4 protocol foundation",
    );
    const brokerCard = brokerHeading.closest("article");
    expect(brokerCard).toHaveTextContent("AUTHORITY=none");
    expect(brokerCard).toHaveTextContent("durable registry");
    expect(brokerCard).toHaveTextContent("unforgeable move-only capability");
    const wave64Heading = screen.getByText(
      "gfx942 Wave64 bounded source-model/KIR correspondence",
    );
    const wave64Card = wave64Heading.closest("article");
    expect(wave64Card).toHaveTextContent("4,359 deterministic mask observations");
    expect(wave64Card).toHaveTextContent("38 tests with one existing hardware test ignored");
    expect(wave64Card).toHaveTextContent("22 positive obligations");
    expect(wave64Card).toHaveTextContent("no source-to-model correspondence");
    expect(wave64Card).toHaveTextContent("parity authority");
    const sourceCorrespondenceHeading = screen.getByText(
      "Wave64 reviewed attributed-source structural correspondence",
    );
    const sourceCorrespondenceCard = sourceCorrespondenceHeading.closest("article");
    expect(sourceCorrespondenceCard).toHaveTextContent("exact syn AST gate");
    expect(sourceCorrespondenceCard).toHaveTextContent("17,436 observations");
    expect(sourceCorrespondenceCard).toHaveTextContent("13 positive obligations");
    expect(sourceCorrespondenceCard).toHaveTextContent(
      "proves_source_to_model_refinement=false",
    );
    expect(sourceCorrespondenceCard).toHaveTextContent("model-internal/definitional");
    expect(sourceCorrespondenceCard).toHaveTextContent("parity authority");
    const serviceHeading = screen.getByText(
      "Inert protected-service descriptor admission",
    );
    const serviceCard = serviceHeading.closest("article");
    expect(serviceCard).toHaveTextContent("AUTHORITY=none");
    expect(serviceCard).toHaveTextContent("27 unit tests and two compile-fail doctests");
    expect(serviceCard).toHaveTextContent("two privileged/root-only positive tests remain ignored");
    expect(serviceCard).toHaveTextContent("no client liveness");
    expect(serviceCard).toHaveTextContent("no storage or anti-rollback");
    expect(serviceCard).toHaveTextContent("changes no parity status");
    const preexecHeading = screen.getByText(
      "Accepted static pre-exec containment foundation",
    );
    const preexecCard = preexecHeading.closest("article");
    expect(preexecCard).toHaveTextContent("AUTHORITY=none");
    expect(preexecCard).toHaveTextContent("syscall-only _start");
    expect(preexecCard).toHaveTextContent("empty target environment");
    expect(preexecCard).toHaveTextContent("PDEATHSIG(SIGKILL)");
    expect(preexecCard).toHaveTextContent("17,488-byte executable");
    expect(preexecCard).toHaveTextContent(
      "db65ee057a8a9d10f8c8e54087e46c4d34c7040b5b34e1732c42da2872b91c52",
    );
    expect(preexecCard).toHaveTextContent("preattached ptrace tracer");
    expect(preexecCard).toHaveTextContent("inherited seccomp user notification");
    expect(preexecCard).toHaveTextContent("ordinary target exec resets dumpability");
    expect(preexecCard).toHaveTextContent("parity authority");
    const rejectedHeading = screen.getByText(
      "Rejected W0-B static host-link candidate",
    );
    const rejectedCard = rejectedHeading.closest("article");
    expect(rejectedCard).toBeInTheDocument();
    expect(rejectedCard).toHaveTextContent("rejected");
    expect(rejectedCard).toHaveTextContent("executed zero Workers");
    expect(rejectedCard).toHaveTextContent("descriptor-backed HostLinkClosureV1");
    expect(rejectedCard).toHaveTextContent("W1 is authenticated broker cargo-fe2o3 executable identity");
    expect(rejectedCard).toHaveTextContent("in-process host LLD is deferred");
    expect(screen.getByText("Formal evidence isolation V11")).toBeInTheDocument();
    const candidateHeading = screen.getByText(
      "MoE expert bounded V2 integrated checkpoint",
    );
    const candidateCard = candidateHeading.closest("article");
    expect(candidateCard).toBeInTheDocument();
    expect(candidateCard).toHaveTextContent("public");
    expect(candidateCard).toHaveTextContent("19 verified obligations");
    expect(candidateCard).toHaveTextContent("all 625 count vectors");
    expect(candidateCard).toHaveTextContent(
      "upload/readback test is no kernel dispatch",
    );
  });

  it("renders current compiler architecture separately from history", async () => {
    renderApp("/architecture");
    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Compiler main at 97abdba6ab",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Generic pre-lowering safety")).toBeInTheDocument();
    expect(screen.getByText("#109")).toBeInTheDocument();
    expect(screen.getByText("#109").closest("a")).toHaveTextContent("closed");
    expect(screen.getByText("#140").closest("a")).toHaveTextContent("open");
    expect(screen.getByText("Historical lesson evidence")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Open current compiler source/ }),
    ).toHaveAttribute(
      "href",
      "https://github.com/harsh-nod/fe2o3/tree/97abdba6ab9e1337f55d6ffccd8b1f5feeb69aed",
    );
  });
});
