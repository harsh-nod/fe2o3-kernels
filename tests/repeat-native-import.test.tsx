import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RepeatNativeImport } from "../src/components/RepeatNativeImport";
import * as reader from "../src/content/repeat-native-file";
import * as comparison from "../src/content/repeat-native-comparison.mjs";

afterEach(() => vi.restoreAllMocks());
const pin = "1".repeat(64);
const file = (name: string) => new File(["{}"], name, { type: "application/json" });

describe("local repeat-native import state", () => {
  it("passes the raw file string and caller pin, not a capsule-advertised digest", async () => {
    const text = '{"advertised_digest":"' + "9".repeat(64) + '"}';
    vi.spyOn(reader, "readRepeatNativeFile").mockResolvedValue(text);
    const project = vi.spyOn(comparison, "projectRepeatNativeComparison")
      .mockResolvedValue({ status: "invalid", detail: "Wrong selected join." });
    const user = userEvent.setup(); render(<RepeatNativeImport expectedJoinSha256={pin} />);
    await user.upload(screen.getByLabelText("Repeat-native capsule (local JSON)"), file("one.json"));
    await screen.findByText(/Wrong selected join/u);
    expect(project).toHaveBeenCalledWith(text, pin);
    expect(screen.getByText(/not a signature or producer authentication/u)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
  it("aborts and ignores a late earlier file read", async () => {
    let finish!: (value: string) => void; let oldSignal!: AbortSignal;
    vi.spyOn(reader, "readRepeatNativeFile")
      .mockImplementationOnce((_file, signal) => { oldSignal = signal; return new Promise(resolve => { finish = resolve; }); })
      .mockResolvedValueOnce("new raw capsule");
    const project = vi.spyOn(comparison, "projectRepeatNativeComparison")
      .mockResolvedValue({ status: "invalid", detail: "New selected capsule." });
    const user = userEvent.setup(); render(<RepeatNativeImport expectedJoinSha256={pin} />);
    const input = screen.getByLabelText("Repeat-native capsule (local JSON)");
    await user.upload(input, file("old.json")); await user.upload(input, file("new.json"));
    await screen.findByText(/New selected capsule/u);
    await act(async () => { finish("old raw capsule"); });
    expect(oldSignal.aborted).toBe(true);
    expect(project).toHaveBeenCalledTimes(1);
    expect(project).toHaveBeenLastCalledWith("new raw capsule", pin);
  });
  it("clear aborts the actual pending read and discards its completion", async () => {
    let finish!: (value: string) => void; let signal!: AbortSignal;
    vi.spyOn(reader, "readRepeatNativeFile").mockImplementationOnce((_file, supplied) => {
      signal = supplied; return new Promise(resolve => { finish = resolve; });
    });
    const project = vi.spyOn(comparison, "projectRepeatNativeComparison");
    const user = userEvent.setup(); render(<RepeatNativeImport expectedJoinSha256={pin} />);
    await user.upload(screen.getByLabelText("Repeat-native capsule (local JSON)"), file("one.json"));
    await user.click(screen.getByRole("button", { name: "Clear repeat-native import" }));
    await act(async () => { finish("late"); });
    expect(signal.aborted).toBe(true); expect(project).not.toHaveBeenCalled();
    expect(screen.getByText("No local repeat-native capsule selected.")).toBeInTheDocument();
  });
  it("pin changes unmount the selected import and abort the old read", async () => {
    let signal!: AbortSignal;
    vi.spyOn(reader, "readRepeatNativeFile").mockImplementationOnce((_file, supplied) => {
      signal = supplied; return new Promise(() => {});
    });
    const user = userEvent.setup();
    const { rerender } = render(<RepeatNativeImport expectedJoinSha256={pin} />);
    await user.upload(screen.getByLabelText("Repeat-native capsule (local JSON)"), file("one.json"));
    rerender(<RepeatNativeImport expectedJoinSha256={"2".repeat(64)} />);
    expect(signal.aborted).toBe(true);
    expect(screen.getByText("No local repeat-native capsule selected.")).toBeInTheDocument();
  });
  it("refuses a failed read without displaying its exception or old evidence", async () => {
    vi.spyOn(reader, "readRepeatNativeFile").mockRejectedValue(new Error("private file path"));
    const user = userEvent.setup(); render(<RepeatNativeImport expectedJoinSha256={pin} />);
    await user.upload(screen.getByLabelText("Repeat-native capsule (local JSON)"), file("one.json"));
    await screen.findByText(/Local file refused/u);
    expect(screen.queryByText("private file path")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Bounded repeat-native comparison" })).not.toBeInTheDocument();
  });
});
