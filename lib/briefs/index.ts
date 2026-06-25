/**
 * Public surface of the Brief Decoder typed API client.
 */
export { getApiBaseUrl, getApiKey } from "./config.ts";
export { ApiError, decodeBrief, getRun, type RequestOptions } from "./api.ts";
export {
  ERROR_CODES,
  RUN_STATUSES,
  SEVERITIES,
  type BriefDecodeRequest,
  type BriefDecodeResult,
  type ErrorCode,
  type ErrorEnvelope,
  type Risk,
  type RunDTO,
  type RunStatus,
  type Severity,
} from "./types.ts";
