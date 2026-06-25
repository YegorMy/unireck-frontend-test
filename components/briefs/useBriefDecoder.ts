import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError, decodeBrief } from "../../lib/briefs/api";
import type { BriefDecodeResult } from "../../lib/briefs/types";

type BriefDecoderState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; runId: string; result: BriefDecodeResult }
  | { status: "error"; runId: string | null; error: unknown };

export interface UseBriefDecoderResult {
  state: BriefDecoderState;
  input: string;
  setInput: (value: string) => void;
  decode: (briefText: string) => Promise<void>;
}

export function useBriefDecoder(): UseBriefDecoderResult {
  const [state, setState] = useState<BriefDecoderState>({ status: "idle" });
  const [input, setInput] = useState("");

  // Track the latest in-flight request so stale responses cannot clobber newer state.
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const decode = useCallback(async (briefText: string) => {
    // Abort any previous in-flight request and increment the request id.
    abortControllerRef.current?.abort();
    const requestId = (requestIdRef.current += 1);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState({ status: "loading" });

    const isLatest = () => requestId === requestIdRef.current;

    try {
      const run = await decodeBrief(briefText, { signal: controller.signal });

      if (!isLatest()) {
        return;
      }

      if (run.status === "succeeded" && run.structured_result !== null) {
        setState({
          status: "success",
          runId: run.run_id,
          result: run.structured_result,
        });
      } else {
        setState({
          status: "error",
          runId: run.run_id,
          error: new Error(run.error_message ?? "Decode run failed"),
        });
      }
    } catch (error) {
      if (!isLatest() || controller.signal.aborted) {
        return;
      }

      const runId = error instanceof ApiError ? error.runId : null;
      setState({ status: "error", runId, error });
    } finally {
      if (isLatest()) {
        abortControllerRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return { state, input, setInput, decode };
}
