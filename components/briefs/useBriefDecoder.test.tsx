import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, decodeBrief } from "../../lib/briefs/api";
import type { BriefDecodeResult, RunDTO } from "../../lib/briefs/types";
import { useBriefDecoder } from "./useBriefDecoder";

vi.mock("../../lib/briefs/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/briefs/api")>();
  return {
    ...actual,
    decodeBrief: vi.fn(),
  };
});

function makeResult(overrides?: Partial<BriefDecodeResult>): BriefDecodeResult {
  return {
    summary: "summary",
    goals: ["goal"],
    deliverables: ["deliverable"],
    constraints: [],
    risks: [],
    clarifying_questions: [],
    recommended_next_action: "next",
    ...overrides,
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

describe("useBriefDecoder", () => {
  beforeEach(() => {
    vi.mocked(decodeBrief).mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts in the idle state with an empty input", () => {
    const { result } = renderHook(() => useBriefDecoder());

    expect(result.current.state).toEqual({ status: "idle" });
    expect(result.current.input).toBe("");
  });

  it("transitions to loading while decoding", async () => {
    vi.mocked(decodeBrief).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(makeRunDTO()), 50))
    );

    const { result } = renderHook(() => useBriefDecoder());

    result.current.decode("Build a thing");

    await waitFor(() => expect(result.current.state).toEqual({ status: "loading" }));
  });

  it("transitions to success when decodeBrief resolves with structured_result", async () => {
    vi.mocked(decodeBrief).mockResolvedValue(makeRunDTO({ run_id: "run-ok" }));

    const { result } = renderHook(() => useBriefDecoder());

    await result.current.decode("Build a thing");

    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: "success",
        runId: "run-ok",
        result: makeResult(),
      })
    );
  });

  it("transitions to error when decodeBrief resolves with a failed run", async () => {
    vi.mocked(decodeBrief).mockResolvedValue(
      makeRunDTO({
        run_id: "run-fail",
        status: "failed",
        structured_result: null,
        error_message: "model refused",
      })
    );

    const { result } = renderHook(() => useBriefDecoder());

    await result.current.decode("Build a thing");

    await waitFor(() => expect(result.current.state.status).toBe("error"));
    expect(result.current.state).toMatchObject({
      status: "error",
      runId: "run-fail",
      error: new Error("model refused"),
    });
  });

  it("transitions to error with ApiError details when decodeBrief rejects", async () => {
    const apiError = new ApiError(422, {
      error_code: "SCHEMA_VALIDATION",
      message: "Invalid brief",
      run_id: "run-reject",
    });
    vi.mocked(decodeBrief).mockRejectedValue(apiError);

    const { result } = renderHook(() => useBriefDecoder());

    await result.current.decode("Build a thing");

    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: "error",
        runId: "run-reject",
        error: apiError,
      })
    );
  });

  it("transitions to error with a generic error for non-ApiError rejects", async () => {
    vi.mocked(decodeBrief).mockRejectedValue(new Error("Network failure"));

    const { result } = renderHook(() => useBriefDecoder());

    await result.current.decode("Build a thing");

    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: "error",
        runId: null,
        error: new Error("Network failure"),
      })
    );
  });

  it("aborts the in-flight request and ignores stale results on unmount", async () => {
    let resolveRun: (value: RunDTO) => void = () => {};
    vi.mocked(decodeBrief).mockImplementation(
      () => new Promise((resolve) => (resolveRun = resolve))
    );

    const { result, unmount } = renderHook(() => useBriefDecoder());

    const decodePromise = result.current.decode("Build a thing");
    await waitFor(() => expect(result.current.state).toEqual({ status: "loading" }));

    unmount();

    // Resolving after unmount should not throw or update state.
    resolveRun(makeRunDTO());
    await expect(decodePromise).resolves.toBeUndefined();
  });

  it("ignores a stale response when a newer decode is started", async () => {
    let resolveFirst: (value: RunDTO) => void = () => {};
    let resolveSecond: (value: RunDTO) => void = () => {};

    vi.mocked(decodeBrief)
      .mockImplementationOnce(
        () => new Promise((resolve) => (resolveFirst = resolve))
      )
      .mockImplementationOnce(
        () => new Promise((resolve) => (resolveSecond = resolve))
      );

    const { result } = renderHook(() => useBriefDecoder());

    const first = result.current.decode("first brief");
    await waitFor(() => expect(result.current.state).toEqual({ status: "loading" }));

    const second = result.current.decode("second brief");

    // Resolve the newer request first.
    resolveSecond(
      makeRunDTO({
        run_id: "run-second",
        structured_result: makeResult({ summary: "second" }),
      })
    );

    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: "success",
        runId: "run-second",
        result: makeResult({ summary: "second" }),
      })
    );

    // Resolve the older request afterwards.
    resolveFirst(
      makeRunDTO({
        run_id: "run-first",
        structured_result: makeResult({ summary: "first" }),
      })
    );

    await Promise.all([first, second]);

    // State must still reflect the newer request.
    expect(result.current.state).toEqual({
      status: "success",
      runId: "run-second",
      result: makeResult({ summary: "second" }),
    });
  });

  it("aborts the previous request when a new decode is started", async () => {
    const controllerSignals: AbortSignal[] = [];
    vi.mocked(decodeBrief).mockImplementation((_text, options) => {
      if (options?.signal) {
        controllerSignals.push(options.signal);
      }
      return new Promise(() => {});
    });

    const { result } = renderHook(() => useBriefDecoder());

    result.current.decode("first brief");
    await waitFor(() => expect(controllerSignals.length).toBe(1));

    result.current.decode("second brief");
    await waitFor(() => expect(controllerSignals.length).toBe(2));

    expect(controllerSignals[0].aborted).toBe(true);
    expect(controllerSignals[1].aborted).toBe(false);
  });
});
