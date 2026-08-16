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

  it("renders the tutorial app as its first screen", () => {
    renderApp();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Read the evidence before the code",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Curriculum")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Kernel" })).toBeInTheDocument();
  });

  it("persists completed lesson progress", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "Mark complete" }));
    expect(screen.getByRole("button", { name: "Completed" })).toBeInTheDocument();
    expect(window.localStorage.getItem("fe2o3-kernels-progress-v1")).toContain(
      "read-the-evidence",
    );
  });

  it("searches lessons and navigates to the result", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: /Search/ }));
    const input = screen.getByRole("textbox", {
      name: "Search lessons and glossary",
    });
    await user.type(input, "flash attention");
    await user.click(
      screen.getByRole("option", { name: /Flash attention: online invariant/ }),
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Flash attention: online invariant",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Source tested").length).toBeGreaterThan(0);
  });

  it("renders real row-softmax source without upgrading its evidence", async () => {
    const user = userEvent.setup();
    renderApp("/lesson/softmax-invariant");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Softmax: one fixed row, six evidence layers",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "pub fn row_softmax_v1",
    );
    expect(screen.queryByText(/Explanatory source/u)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Source" })).toHaveAttribute(
      "href",
      "https://github.com/harsh-nod/fe2o3/blob/07446dc820d457ab895a3b01bcf6290613b47e66/crates/rustc-codegen-fe2o3/tests/fixtures/collected-row-softmax-v1/src/lib.rs",
    );

    await user.click(screen.getByRole("tab", { name: "Verus proof" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "separate_input_and_output_accesses_do_not_alias_v1",
    );
    await user.click(screen.getByRole("tab", { name: "Host" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "JoinedProtectedRowSoftmaxV1",
    );
    await user.click(screen.getByRole("tab", { name: "Expected result" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "no protected dispatch and no numerical GPU result",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "does not justify a cuda-oxide parity promotion",
    );
  });

  it("shows public and candidate kernel delivery states separately", () => {
    renderApp("/status");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Kernel delivery and verification progress",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Kernel implementation status" })).toBeInTheDocument();
    expect(screen.getByText("Historical audited baseline")).toBeInTheDocument();
    expect(screen.getByText("Publication-gated snapshot")).toBeInTheDocument();
    expect(screen.getByText("2042382cb072")).toBeInTheDocument();
    expect(
      screen.getByText(/This site build is valid only after/),
    ).toHaveTextContent(
      "publication workflow verifies that harsh-nod/fe2o3 and powderluv/fe2o3 refs/heads/main both resolve exactly",
    );
    expect(screen.getByText(/This site build is valid only after/)).toHaveTextContent(
      "Both the commit and tree are required",
    );
    expect(screen.getByText(/This site build is valid only after/)).toHaveTextContent(
      "e4a964c61dd43e1ac5e54adc2562f6e77f2e6654",
    );
    expect(
      screen.getByText("Published implementation snapshot (publication gated)"),
    ).toBeInTheDocument();
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
});
