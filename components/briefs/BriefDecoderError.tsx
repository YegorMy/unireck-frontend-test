import { ApiError } from "../../lib/briefs/api";

interface BriefDecoderErrorProps {
  error: unknown;
  runId: string | null;
}

function getErrorDetails(error: unknown): {
  title: string;
  className: string;
  message: string;
} {
  if (error instanceof ApiError) {
    const isValidation =
      error.status === 422 ||
      error.errorCode === "SCHEMA_VALIDATION" ||
      error.errorCode === "MALFORMED_OUTPUT";
    const isProvider = error.status === 502 || error.errorCode === "PROVIDER_ERROR";

    if (isValidation) {
      return {
        title: "Validation failed",
        className: "error-validation",
        message: error.message,
      };
    }

    if (isProvider) {
      return {
        title: "Provider error",
        className: "error-provider",
        message: error.message,
      };
    }

    return {
      title: "Request failed",
      className: "error-network",
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      title: "Network error",
      className: "error-network",
      message: error.message,
    };
  }

  return {
    title: "Something went wrong",
    className: "error-network",
    message: "An unexpected error occurred while decoding the brief.",
  };
}

export function BriefDecoderError({ error, runId }: BriefDecoderErrorProps) {
  const details = getErrorDetails(error);

  return (
    <div className={`error-banner ${details.className}`} role="alert">
      <h2>{details.title}</h2>
      <p>{details.message}</p>
      {runId && <p className="run-id">Run: {runId}</p>}
    </div>
  );
}
