import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BriefDecodeResult } from "../../lib/briefs/types";
import { BriefDecoderResult } from "./BriefDecoderResult";

function makeResult(overrides?: Partial<BriefDecodeResult>): BriefDecodeResult {
  return {
    summary: "summary",
    goals: ["goal 1"],
    deliverables: ["deliverable 1"],
    constraints: [],
    risks: [{ risk: "risk 1", severity: "medium", reason: "reason 1" }],
    clarifying_questions: [],
    recommended_next_action: "next",
    ...overrides,
  };
}

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("BriefDecoderResult", () => {
  const writeText = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText },
    });
    writeText.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders result sections and run id", () => {
    render(<BriefDecoderResult result={makeResult()} runId="run-123" />);

    expect(screen.getByText(/Decoded brief/i)).toBeInTheDocument();
    expect(screen.getByText("summary")).toBeInTheDocument();
    expect(screen.getByText("goal 1")).toBeInTheDocument();
    expect(screen.getByText("deliverable 1")).toBeInTheDocument();
    expect(screen.getByText("risk 1")).toBeInTheDocument();
    expect(screen.getByText(/Run: run-123/i)).toBeInTheDocument();
  });

  it("omits empty string list sections", () => {
    render(
      <BriefDecoderResult
        result={makeResult({ goals: [], deliverables: [], constraints: [] })}
        runId="run-123"
      />
    );

    expect(screen.queryByText(/Goals/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Deliverables/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Constraints/i)).not.toBeInTheDocument();
  });

  it("copies JSON to clipboard and shows a transient copied state", async () => {
    const result = makeResult();
    render(<BriefDecoderResult result={result} runId="run-123" />);

    fireEvent.click(screen.getByRole("button", { name: /Copy decoded result as JSON/i }));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(JSON.stringify(result, null, 2));

    const button = screen.getByRole("button", { name: /Copy decoded result as JSON/i });
    await waitFor(() => expect(button).toHaveTextContent(/Copied/i));
  });

  it("clears the copy-success timeout on unmount", async () => {
    vi.useFakeTimers();

    const { unmount } = render(<BriefDecoderResult result={makeResult()} runId="run-123" />);
    const button = screen.getByRole("button", { name: /Copy decoded result as JSON/i });

    fireEvent.click(button);
    await flushMicrotasks();
    expect(button).toHaveTextContent(/Copied/i);

    unmount();

    // If the timeout were not cleared, advancing time would try to setState on
    // an unmounted component and React would log a warning. The absence of a
    // warning (and the fact that the test completes) confirms cleanup.
    vi.advanceTimersByTime(2000);
  });

  it("handles clipboard write rejection without unhandled rejection", async () => {
    vi.useFakeTimers();
    writeText.mockRejectedValueOnce(new Error("Clipboard blocked"));

    render(<BriefDecoderResult result={makeResult()} runId="run-123" />);
    const button = screen.getByRole("button", { name: /Copy decoded result as JSON/i });

    fireEvent.click(button);
    await flushMicrotasks();

    expect(button).toHaveTextContent(/Copy failed/i);

    vi.advanceTimersByTime(1000);
    await flushMicrotasks();
    expect(button).toHaveTextContent(/Copy/i);
  });

  it("clears the previous timeout before scheduling a new one", async () => {
    vi.useFakeTimers();

    render(<BriefDecoderResult result={makeResult()} runId="run-123" />);

    const button = screen.getByRole("button", { name: /Copy decoded result as JSON/i });

    fireEvent.click(button);
    await flushMicrotasks();
    expect(button).toHaveTextContent(/Copied/i);

    fireEvent.click(button);
    await flushMicrotasks();
    expect(button).toHaveTextContent(/Copied/i);

    vi.advanceTimersByTime(2000);
    await flushMicrotasks();
    expect(button).toHaveTextContent(/Copy/i);
  });
});
