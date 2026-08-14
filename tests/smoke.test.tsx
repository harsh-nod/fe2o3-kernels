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
    expect(screen.getAllByText("Design only").length).toBeGreaterThan(0);
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
    expect(screen.getByText("Audited public")).toBeInTheDocument();
    expect(screen.getByText("Eventual public target")).toBeInTheDocument();
    expect(screen.getByText("e2e9725f0708")).toBeInTheDocument();
    expect(
      screen.getByText(/The eventual target is not current remote state/),
    ).toHaveTextContent(
      "must not be published until both harsh-nod/fe2o3 and powderluv/fe2o3 refs/heads/main resolve exactly",
    );
    expect(
      screen.getByText("Eventual public main (publication gated)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Formal evidence isolation V11")).toBeInTheDocument();
  });
});
