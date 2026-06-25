import { useCallback, useEffect, useRef, useState } from "react";

import type { BriefDecodeResult, Risk } from "../../lib/briefs/types";

interface BriefDecoderResultProps {
  result: BriefDecodeResult;
  runId: string;
}

function RiskItem({ risk }: { risk: Risk }) {
  return (
    <li className="risk-item">
      <span className={`severity-badge severity-${risk.severity}`}>
        {risk.severity}
      </span>
      <strong>{risk.risk}</strong>
      <p>{risk.reason}</p>
    </li>
  );
}

function StringList({ items, title }: { items: string[]; title: string }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="section">
      <h3>{title}</h3>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function BriefDecoderResult({ result, runId }: BriefDecoderResultProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCopyTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearCopyTimeout();
    };
  }, [clearCopyTimeout]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopyFailed(false);
      setCopied(true);
      clearCopyTimeout();
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, 2000);
    } catch {
      setCopied(false);
      setCopyFailed(true);
      clearCopyTimeout();
      timeoutRef.current = setTimeout(() => {
        setCopyFailed(false);
        timeoutRef.current = null;
      }, 1000);
    }
  }, [result, clearCopyTimeout]);

  return (
    <article className="success-view">
      <header className="success-header">
        <h2>Decoded brief</h2>
        <button
          type="button"
          className="copy-button"
          onClick={handleCopy}
          aria-label="Copy decoded result as JSON"
        >
          {copied ? "Copied" : copyFailed ? "Copy failed" : "Copy"}
        </button>
      </header>

      <section className="section">
        <h3>Summary</h3>
        <p>{result.summary}</p>
      </section>

      <StringList items={result.goals} title="Goals" />
      <StringList items={result.deliverables} title="Deliverables" />
      <StringList items={result.constraints} title="Constraints" />

      {result.risks.length > 0 && (
        <section className="section">
          <h3>Risks</h3>
          <ul className="risk-list">
            {result.risks.map((risk, index) => (
              <RiskItem key={index} risk={risk} />
            ))}
          </ul>
        </section>
      )}

      <StringList items={result.clarifying_questions} title="Clarifying questions" />

      {result.recommended_next_action && (
        <section className="section">
          <h3>Recommended next action</h3>
          <p>{result.recommended_next_action}</p>
        </section>
      )}

      <footer className="run-id">Run: {runId}</footer>
    </article>
  );
}
