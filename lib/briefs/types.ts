/**
 * Domain models for the `/v1/briefs` API.
 *
 * These mirror the shared backend contract consumed by the extension.
 */

export const SEVERITIES = ["low", "medium", "high"] as const;
export type Severity = (typeof SEVERITIES)[number];

export interface Risk {
  risk: string;
  severity: Severity;
  reason: string;
}

export interface BriefDecodeResult {
  summary: string;
  goals: string[];
  deliverables: string[];
  constraints: string[];
  risks: Risk[];
  clarifying_questions: string[];
  recommended_next_action: string;
}

export interface BriefDecodeRequest {
  brief_text: string;
}

export const RUN_STATUSES = ["succeeded", "failed"] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

export const ERROR_CODES = [
  "MALFORMED_OUTPUT",
  "SCHEMA_VALIDATION",
  "PROVIDER_ERROR",
  "RUN_NOT_FOUND",
  "RUN_PENDING",
  "UNEXPECTED_ERROR",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export interface RunDTO {
  run_id: string;
  status: RunStatus;
  input_text: string;
  structured_result: BriefDecodeResult | null;
  raw_provider_output: string | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ErrorEnvelope {
  error_code: ErrorCode;
  message: string;
  run_id: string | null;
}
