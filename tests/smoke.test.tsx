import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HashRouter, MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import { currentSourceUrl, currentState } from "../src/content/current-state";
import "../src/components/ArchitecturePage";
import "../src/components/LessonPage";
import "../src/components/OperatorCookbookPage";
import "../src/components/OverviewPage";
import "../src/components/ProgressPage";
import "../src/components/SearchDialog";

function renderApp(path = "/lesson/read-the-evidence") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

function renderHashApp(hash: string) {
  window.location.hash = hash;
  return render(
    <HashRouter>
      <App />
    </HashRouter>,
  );
}

describe("application shell", () => {
  beforeEach(() => window.localStorage.clear());

  it("makes the launch learning paths the primary overview action", async () => {
    renderApp("/");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "fe2o3 kernels",
      }, { timeout: 15_000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Start tutorial/ })).toHaveAttribute(
      "href",
      "/getting-started",
    );
    expect(screen.getByRole("link", { name: /Run today/ })).toHaveAttribute(
      "href",
      "/#run-today",
    );
    expect(
      screen.getAllByRole("link", { name: /Operator cookbook/ })
        .some((link) => link.getAttribute("href") === "/operators"),
    ).toBe(true);
    const runTodayTable = screen.getByRole("table", {
      name: "What can I run today",
    });
    expect(runTodayTable).toBeInTheDocument();
    const kdaRunLink = screen.getAllByRole("link", {
        name: "gfx950 Kimi Delta Attention decode and chunkwise prefill",
      }).find((link) => runTodayTable.contains(link));
    expect(kdaRunLink).toHaveAttribute(
      "href",
      "/lesson/gfx950-kda-gdn-linear-attention",
    );
    expect(screen.getByText(/current CPU-first workflows/)).toBeInTheDocument();
    expect(screen.getByText("Compiler baseline")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "What the evidence pin enforces" }),
    ).toBeInTheDocument();
    expect(screen.getByText(`evidence pin ${currentState.compilerShortCommit}`))
      .toBeInTheDocument();
    expect(screen.queryByText(/compiler main/u)).not.toBeInTheDocument();
    expect(screen.getByText("Run something first")).toBeInTheDocument();
  }, 20_000);

  it("keeps the current HashRouter lesson when the skip link receives keyboard focus", async () => {
    const user = userEvent.setup();
    renderHashApp("#/lesson/read-the-evidence?view=source");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "How to read this guide",
      }, { timeout: 15_000 }),
    ).toBeInTheDocument();

    const main = document.getElementById("main-content");
    expect(main).not.toBeNull();
    await waitFor(() => expect(main).toHaveFocus());
    const skipLink = screen.getByRole("link", { name: "Skip to content" });
    expect(skipLink).toHaveAttribute(
      "href",
      "#/lesson/read-the-evidence?view=source#main-content",
    );

    skipLink.focus();
    expect(skipLink).toHaveFocus();
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(window.location.hash).toBe(
        "#/lesson/read-the-evidence?view=source#main-content",
      );
      expect(main).toHaveFocus();
    });
    expect(
      screen.getByRole("heading", { level: 1, name: "How to read this guide" }),
    ).toBeInTheDocument();
  }, 20_000);

  it("preserves the overview route while focusing the run-today section", async () => {
    const user = userEvent.setup();
    renderHashApp("#/start?audience=operator");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "fe2o3 kernels",
      }, { timeout: 15_000 }),
    ).toBeInTheDocument();

    const runTodayLink = screen.getByRole("link", { name: /Run today/ });
    expect(runTodayLink).toHaveAttribute(
      "href",
      "#/start?audience=operator#run-today",
    );
    runTodayLink.focus();
    await user.keyboard("{Enter}");

    const runToday = document.getElementById("run-today");
    expect(runToday).not.toBeNull();
    await waitFor(() => {
      expect(window.location.hash).toBe(
        "#/start?audience=operator#run-today",
      );
      expect(runToday).toHaveFocus();
    });
    expect(
      screen.getByRole("heading", { level: 1, name: "fe2o3 kernels" }),
    ).toBeInTheDocument();
  }, 20_000);

  it("preserves the cookbook route while focusing an indexed operator", async () => {
    const user = userEvent.setup();
    renderHashApp("#/operators?status=current");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Operator cookbook",
      }, { timeout: 15_000 }),
    ).toBeInTheDocument();

    const index = document.querySelector(".operator-index");
    expect(index).not.toBeNull();
    const fillLink = within(index as HTMLElement).getByRole("link", {
      name: /^Fill/u,
    });
    expect(fillLink).toHaveAttribute(
      "href",
      "#/operators?status=current#fill",
    );
    fillLink.focus();
    await user.keyboard("{Enter}");

    const fill = document.getElementById("fill");
    expect(fill).not.toBeNull();
    await waitFor(() => {
      expect(window.location.hash).toBe("#/operators?status=current#fill");
      expect(fill).toHaveFocus();
    });
    expect(
      screen.getByRole("heading", { level: 1, name: "Operator cookbook" }),
    ).toBeInTheDocument();
  }, 20_000);

  it("renders the operator cookbook route", async () => {
    renderApp("/operators");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Operator cookbook",
      }, { timeout: 15_000 }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Kimi Delta Attention Decode/Prefill").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Sparse Attention").length).toBeGreaterThan(0);
    expect(screen.getAllByText("DeepSeek sparse attention").length).toBeGreaterThan(0);
    expect(screen.getAllByText("GPT-OSS-120B Layer-Tile Megakernel").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Functional reference gate").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Runtime CPU oracle").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Runner paths").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Evidence paths").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/safe CPU reference fails the MI350X runner/u).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/No full Kimi K3 layer/u)).toBeInTheDocument();
    const fill = screen
      .getByRole("heading", { level: 3, name: "Fill" })
      .closest("article");
    expect(fill).not.toBeNull();
    expect(within(fill!).getByRole("link", { name: "examples/fill/src/lib.rs" }))
      .toHaveAttribute("href", currentSourceUrl("examples/fill/src/lib.rs"));
    expect(within(fill!).getByText("bash scripts/quickstart.sh no-gpu"))
      .toBeInTheDocument();

    const vecadd = screen
      .getByRole("heading", { level: 3, name: "Vecadd" })
      .closest("article");
    expect(vecadd).not.toBeNull();
    expect(within(vecadd!).getByText(
      "bash scripts/quickstart.sh source-check examples/vecadd/Cargo.toml",
    )).toBeInTheDocument();
    expect(within(vecadd!).getByText(/remains fail closed/u)).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /Open compiler evidence pin/ }),
    ).toHaveAttribute(
      "href",
      `https://github.com/harsh-nod/fe2o3/tree/${currentState.compilerCommit}`,
    );
  }, 20_000);

  it("routes to the no-GPU community quick start", async () => {
    renderApp("/getting-started");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Run a Rust kernel without a GPU",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("bash scripts/quickstart.sh no-gpu", { exact: false }))
      .toBeInTheDocument();
    expect(screen.getByText("git checkout --detach", { exact: false }))
      .toBeInTheDocument();
    expect(screen.getByLabelText("Debugger hierarchy and semantic state"))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open the interactive simulator debugger/ }))
      .toHaveAttribute("href", "/lesson/cpu-semantic-simulation");
  });

  it("renders the tutorial app as its first screen", async () => {
    renderApp();
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "How to read this guide",
      }, { timeout: 15_000 }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Curriculum")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Kernel" })).toBeInTheDocument();
  }, 20_000);

  it("routes to the agent-native source/ISA inspection reference", async () => {
    renderApp("/debugger/source-isa-agent");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Agent-native source/ISA inspection",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Exact authority-free archive")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Capability" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Intervals" })).toBeInTheDocument();
  });

  it("routes to the in-process profiler import reference", async () => {
    renderApp("/debugger/profiler-import");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "In-process profiler import",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Synthetic import, bounded checkpoint qualified")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Installed JSON" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "query capability" })).toBeInTheDocument();
  });

  it("persists completed lesson progress", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(await screen.findByRole("button", { name: "Mark complete" }, { timeout: 15_000 }));
    expect(screen.getByRole("button", { name: "Completed" })).toBeInTheDocument();
    expect(window.localStorage.getItem("fe2o3-kernels-progress-v2")).toContain(
      "read-the-evidence",
    );
  }, 20_000);

  it("searches lessons and navigates to the result", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: /Search/ }));
    const input = await screen.findByRole("combobox", {
      name: "Search all lesson content",
    }, { timeout: 15_000 });
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
  }, 30_000);

  it("renders the gfx950 FP4 attention production Rust evidence", async () => {
    const user = userEvent.setup();
    renderApp("/lesson/gfx950-fp4-attention");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "gfx950 FP4 flash attention",
      }, { timeout: 15_000 }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("GPU observed").length).toBeGreaterThan(0);
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "gfx950_fp4_attention_rust",
    );

    await user.click(screen.getByRole("tab", { name: "Safe CPU reference" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("attention_reference");
    await user.click(screen.getByRole("tab", { name: "Equivalent HIP" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("gfx950_fp4_flash_attention");
    await user.click(screen.getByRole("tab", { name: "Run and inspect" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "ds_read_b64_tr_b4",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "v_mfma_f32_16x16x128_f8f6f4",
    );

    await user.click(screen.getByRole("tab", { name: "Evidence record" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "Portable namespace: a9a878f0e2fc3a42ad17edf0a326a89695398bb6d7460eaf278ea3e8c53f4cf5",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "Rust-produced HSACO SHA-256: 90d8f5e0b1b058c96a0b855893f20d3c4a3adc86fe72fe4b9a0de9652eef122b",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "Rust numerical result: max_absolute_error=2.235174179e-8",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "SEPARATE COMPARISON-ONLY HIP LANE",
    );
  }, 30_000);

  it("renders exact Muon source with bounded two-device evidence", async () => {
    const user = userEvent.setup();
    renderApp("/lesson/gfx950-muon-optimizer");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "gfx950 Muon polar update",
      }, { timeout: 15_000 }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/^(?:Source example|GPU observed)$/u).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "gfx950_stage_gradient_shard_v1",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent("gfx950_muon_update_4x4_v1");
    expect(screen.getByText("Fixed-shape teaching boundary")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Evidence record" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "FE2O3 PRODUCTION RUST -> GFX950 EVIDENCE",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "run-stage-gradient-shard-gfx950.sh",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "run-muon-update-gfx950.sh",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "Evidence status: observed",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "output max_absolute_error=7.450580597e-9",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "two shard launches; output outputs=16 max_absolute_error=0.000000000e0",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "Performance result: not claimed",
    );
  }, 30_000);

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
      "https://github.com/harsh-nod/fe2o3/blob/31825eb9ec15f69608a7c37f34046ed643826bd4/examples/row_softmax_general_v1/src/kernel.rs",
    );

    expect(
      screen.queryByRole("tab", { name: "Verus proof" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Show proof details" }),
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
  }, 20_000);

  it("shows public and candidate kernel delivery states separately", async () => {
    renderApp("/status");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Kernel delivery and verification progress",
      }, { timeout: 15_000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Kernel implementation status" })).toBeInTheDocument();
    expect(screen.getByText("Historical audited baseline")).toBeInTheDocument();
    expect(screen.getByText("Publication-gated baseline")).toBeInTheDocument();
    expect(document.querySelector(".pin-summary")).toHaveTextContent("31825eb9ec");
    expect(
      screen.getByText(/This site build is valid only after/),
    ).toHaveTextContent(
      "publication workflow verifies that harsh-nod/fe2o3 and powderluv/fe2o3 refs/heads/main both contain",
    );
    expect(screen.getByText(/This site build is valid only after/)).toHaveTextContent(
      "The ancestry, commit, and tree are all required",
    );
    expect(screen.getByText(/This site build is valid only after/)).toHaveTextContent(
      "f7881be788317d61904e532eb7da998d38dcfe64",
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
  }, 20_000);

  it("renders the published compiler baseline separately from history", async () => {
    renderApp("/architecture");
    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Compiler baseline at 31825eb9ec",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Generic pre-lowering safety")).toBeInTheDocument();
    const productionRoute = screen.getByText("Unified production route").closest(
      ".architecture-row",
    );
    expect(productionRoute).toHaveTextContent(
      "standalone AMDGCN/PLIRON-to-LLVM and KIR/PLIRON bridge packages have been deleted",
    );
    expect(productionRoute).toHaveTextContent(
      "derived from live collective and LDS-transpose operations",
    );
    expect(productionRoute).toHaveTextContent(
      "nonzero power-of-two tile width through 64",
    );
    expect(screen.getByText("#109")).toBeInTheDocument();
    expect(screen.getByText("#109").closest("a")).toHaveTextContent("closed");
    expect(screen.getByText("#140").closest("a")).toHaveTextContent("open");
    expect(screen.getByText("Historical lesson evidence")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Open pinned compiler source/ }),
    ).toHaveAttribute(
      "href",
      "https://github.com/harsh-nod/fe2o3/tree/31825eb9ec15f69608a7c37f34046ed643826bd4",
    );
  }, 30_000);
});
