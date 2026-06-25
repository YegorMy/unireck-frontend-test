import { BriefDecoderError } from "./BriefDecoderError";
import { BriefDecoderResult } from "./BriefDecoderResult";
import { useBriefDecoder } from "./useBriefDecoder";

export function BriefDecoder() {
  const { state, input, setInput, decode } = useBriefDecoder();

  const canRun = input.trim().length > 0 && state.status !== "loading";

  return (
    <section className="brief-decoder">
      <label htmlFor="brief-text" className="brief-label">
        Paste a brief
      </label>
      <textarea
        id="brief-text"
        className="brief-textarea"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Describe what you want to build..."
        rows={6}
        disabled={state.status === "loading"}
      />
      <button
        type="button"
        className="run-button"
        onClick={() => decode(input.trim())}
        disabled={!canRun}
      >
        {state.status === "loading" ? "Decoding..." : "Run"}
      </button>

      {state.status === "error" && (
        <BriefDecoderError error={state.error} runId={state.runId} />
      )}

      {state.status === "success" && (
        <BriefDecoderResult result={state.result} runId={state.runId} />
      )}
    </section>
  );
}
