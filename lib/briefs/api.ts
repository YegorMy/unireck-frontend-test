import { getApiBaseUrl, getApiKey } from "./config.ts";
import {
  ERROR_CODES,
  RUN_STATUSES,
  SEVERITIES,
  type BriefDecodeRequest,
  type BriefDecodeResult,
  type ErrorCode,
  type ErrorEnvelope,
  type RunDTO,
  type RunStatus,
  type Severity,
} from "./types.ts";

/**
 * Error thrown when the API responds with an error envelope.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly errorCode: ErrorCode;
  readonly runId: string | null;

  constructor(status: number, envelope: ErrorEnvelope) {
    super(envelope.message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = envelope.error_code;
    this.runId = envelope.run_id;
  }
}

/**
 * POST /v1/briefs/decode
 *
 * Submit a raw brief and receive a `RunDTO` with the decoded result.
 */
export type RequestOptions = Pick<RequestInit, "signal">;

export async function decodeBrief(
  briefText: string,
  options?: RequestOptions
): Promise<RunDTO> {
  const body: BriefDecodeRequest = { brief_text: briefText };

  const response = await fetch(`${getApiBaseUrl()}/v1/briefs/decode`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": getApiKey(),
    },
    body: JSON.stringify(body),
    signal: options?.signal,
  });

  return handleResponse(response);
}

/**
 * GET /v1/briefs/runs/{run_id}
 *
 * Retrieve a previously created decode run by ID.
 */
export async function getRun(
  runId: string,
  options?: RequestOptions
): Promise<RunDTO> {
  const response = await fetch(
    `${getApiBaseUrl()}/v1/briefs/runs/${encodeURIComponent(runId)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-Key": getApiKey(),
      },
      signal: options?.signal,
    }
  );

  return handleResponse(response);
}

async function handleResponse(response: Response): Promise<RunDTO> {
  if (!response.ok) {
    const envelope = await parseErrorEnvelope(response);
    if (envelope) {
      throw new ApiError(response.status, envelope);
    }
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as unknown;
  if (!isRunDTO(data)) {
    throw new Error("API returned an invalid success response body");
  }
  return data;
}

async function parseErrorEnvelope(
  response: Response
): Promise<ErrorEnvelope | null> {
  try {
    const data = (await response.json()) as unknown;
    if (isErrorEnvelope(data)) {
      return data;
    }
  } catch {
    // Not a JSON error body.
  }
  return null;
}

function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.error_code === "string" &&
    ERROR_CODES.includes(candidate.error_code as ErrorCode) &&
    typeof candidate.message === "string" &&
    (candidate.run_id === null || typeof candidate.run_id === "string")
  );
}

function isRunDTO(value: unknown): value is RunDTO {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.run_id === "string" &&
    RUN_STATUSES.includes(candidate.status as RunStatus) &&
    typeof candidate.input_text === "string" &&
    (candidate.structured_result === null ||
      isBriefDecodeResult(candidate.structured_result)) &&
    (candidate.raw_provider_output === null ||
      typeof candidate.raw_provider_output === "string") &&
    (candidate.error_code === null ||
      typeof candidate.error_code === "string") &&
    (candidate.error_message === null ||
      typeof candidate.error_message === "string") &&
    typeof candidate.created_at === "string" &&
    (candidate.updated_at === null || typeof candidate.updated_at === "string")
  );
}

function isBriefDecodeResult(value: unknown): value is BriefDecodeResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.summary === "string" &&
    isStringArray(candidate.goals) &&
    isStringArray(candidate.deliverables) &&
    isStringArray(candidate.constraints) &&
    isRiskArray(candidate.risks) &&
    isStringArray(candidate.clarifying_questions) &&
    typeof candidate.recommended_next_action === "string"
  );
}

function isRiskArray(value: unknown): value is { risk: string; severity: Severity; reason: string }[] {
  return Array.isArray(value) && value.every((item) => isRisk(item));
}

function isRisk(value: unknown): value is { risk: string; severity: Severity; reason: string } {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.risk === "string" &&
    SEVERITIES.includes(candidate.severity as Severity) &&
    typeof candidate.reason === "string"
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
