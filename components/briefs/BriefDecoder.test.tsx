import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, decodeBrief } from "../../lib/briefs/api";
import type { RunDTO } from "../../lib/briefs/types";
import { BriefDecoder } from "./BriefDecoder";

vi.mock("../../lib/briefs/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/briefs/api")>();
  return {
    ...actual,
    decodeBrief: vi.fn(),
  };
});

function makeResult() {
  return {
    summary: "Decoded summary",
    goals: ["goal 1"],
    deliverables: ["deliverable 1"],
    constraints: ["constraint 1"],
    risks: [{ risk: "risk 1", severity: "medium" as const, reason: "reason 1" }],
    clarifying_questions: ["question 1"],
    recommended_next_action: "next action",
  };
}

function makeRunDTO(overrides?: Partial<RunDTO>): RunDTO {
  return {
    run_id: "run-1",
    status: "succeeded",
    input_text: "input",
    structured_result: makeResult(),
    raw_provider_output: null,
    error_code: null,
    error_message: null,
    created_at: "2026-06-24T00:00:00Z",
    updated_at: "2026-06-24T00:00:00Z",
    ...overrides,
  };
}

describe("BriefDecoder", () => {
  beforeEach(() => {
    vi.mocked(decodeBrief).mockReset();
    process.env.VITE_API_BASE_URL = "http://test.local";
  });

  it("renders an empty textarea and a disabled Run button", () => {
    render(<BriefDecoder />);

    expect(screen.getByLabelText(/Paste a brief/i)).toHaveValue("");
    expect(screen.getByRole("button", { name: /Run/i })).toBeDisabled();
  });

  it("enables the Run button once the user types non-whitespace text", () => {
    render(<BriefDecoder />);

    const textarea = screen.getByLabelText(/Paste a brief/i);
    fireEvent.change(textarea, { target: { value: "Build a thing" } });

    expect(screen.getByRole("button", { name: /Run/i })).toBeEnabled();
  });

  it("calls decodeBrief and shows a loading state when Run is clicked", async () => {
    vi.mocked(decodeBrief).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(makeRunDTO()), 30))
    );

    render(<BriefDecoder />);

    const textarea = screen.getByLabelText(/Paste a brief/i);
    fireEvent.change(textarea, { target: { value: "Build a thing" } });

    fireEvent.click(screen.getByRole("button", { name: /Run/i }));

    expect(vi.mocked(decodeBrief)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(decodeBrief)).toHaveBeenCalledWith(
      "Build a thing",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );

    expect(await screen.findByRole("button", { name: /Decoding/i })).toBeDisabled();
    expect(textarea).toBeDisabled();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Run/i })).toBeEnabled()
    );
  });

  it("renders the decoded result after a successful run", async () => {
    vi.mocked(decodeBrief).mockResolvedValue(makeRunDTO({ run_id: "run-ok" }));

    render(<BriefDecoder />);

    fireEvent.change(screen.getByLabelText(/Paste a brief/i), {
      target: { value: "Build a thing" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Run/i }));

    expect(await screen.findByText(/Decoded summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Run: run-ok/i)).toBeInTheDocument();
    expect(screen.getByText("goal 1")).toBeInTheDocument();
    expect(screen.getByText("deliverable 1")).toBeInTheDocument();
    expect(screen.getByText("constraint 1")).toBeInTheDocument();
    expect(screen.getByText("question 1")).toBeInTheDocument();
    expect(screen.getByText("next action")).toBeInTheDocument();
    expect(screen.getByText("medium")).toBeInTheDocument();
  });

  it("renders a validation error when decodeBrief throws ApiError", async () => {
    vi.mocked(decodeBrief).mockRejectedValue(
      new ApiError(422, {
        error_code: "SCHEMA_VALIDATION",
        message: "Invalid brief",
        run_id: "run-bad",
      })
    );

    render(<BriefDecoder />);

    fireEvent.change(screen.getByLabelText(/Paste a brief/i), {
      target: { value: "Bad brief" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Run/i }));

    expect(await screen.findByRole("alert")).toHaveClass("error-validation");
    expect(screen.getByText(/Validation failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Invalid brief/i)).toBeInTheDocument();
    expect(screen.getByText(/Run: run-bad/i)).toBeInTheDocument();
  });

  it("renders a network error for non-ApiError rejects", async () => {
    vi.mocked(decodeBrief).mockRejectedValue(new Error("fetch failed"));

    render(<BriefDecoder />);

    fireEvent.change(screen.getByLabelText(/Paste a brief/i), {
      target: { value: "Brief" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Run/i }));

    expect(await screen.findByRole("alert")).toHaveClass("error-network");
    expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    expect(screen.getByText(/fetch failed/i)).toBeInTheDocument();
  });

  it("trims input before calling decodeBrief", async () => {
    vi.mocked(decodeBrief).mockResolvedValue(makeRunDTO());

    render(<BriefDecoder />);

    fireEvent.change(screen.getByLabelText(/Paste a brief/i), {
      target: { value: "  Build a thing  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /Run/i }));

    await waitFor(() =>
      expect(vi.mocked(decodeBrief)).toHaveBeenCalledWith(
        "Build a thing",
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      )
    );
  });
});
