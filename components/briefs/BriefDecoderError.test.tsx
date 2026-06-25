import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApiError } from "../../lib/briefs/api";
import { BriefDecoderError } from "./BriefDecoderError";

describe("BriefDecoderError", () => {
  it("renders validation error styling for 422 ApiError", () => {
    render(
      <BriefDecoderError
        error={new ApiError(422, {
          error_code: "SCHEMA_VALIDATION",
          message: "Invalid brief",
          run_id: "run-val",
        })}
        runId="run-val"
      />
    );

    expect(screen.getByRole("alert")).toHaveClass("error-validation");
    expect(screen.getByText(/Validation failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Invalid brief/i)).toBeInTheDocument();
    expect(screen.getByText(/Run: run-val/i)).toBeInTheDocument();
  });

  it("renders provider error styling for 502 ApiError", () => {
    render(
      <BriefDecoderError
        error={new ApiError(502, {
          error_code: "PROVIDER_ERROR",
          message: "Provider unavailable",
          run_id: null,
        })}
        runId={null}
      />
    );

    expect(screen.getByRole("alert")).toHaveClass("error-provider");
    expect(screen.getByText(/Provider error/i)).toBeInTheDocument();
    expect(screen.getByText(/Provider unavailable/i)).toBeInTheDocument();
  });

  it("renders validation styling for MALFORMED_OUTPUT ApiError", () => {
    render(
      <BriefDecoderError
        error={new ApiError(500, {
          error_code: "MALFORMED_OUTPUT",
          message: "Model produced malformed output",
          run_id: "run-500",
        })}
        runId="run-500"
      />
    );

    expect(screen.getByRole("alert")).toHaveClass("error-validation");
    expect(screen.getByText(/Validation failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Model produced malformed output/i)).toBeInTheDocument();
    expect(screen.getByText(/Run: run-500/i)).toBeInTheDocument();
  });

  it("renders network error styling for a generic Error", () => {
    render(<BriefDecoderError error={new Error("Network failure")} runId={null} />);

    expect(screen.getByRole("alert")).toHaveClass("error-network");
    expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    expect(screen.getByText(/Network failure/i)).toBeInTheDocument();
  });

  it("renders fallback text for non-Error values", () => {
    render(<BriefDecoderError error="weird" runId={null} />);

    expect(screen.getByRole("alert")).toHaveClass("error-network");
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(
      screen.getByText(/An unexpected error occurred while decoding the brief/i)
    ).toBeInTheDocument();
  });
});
