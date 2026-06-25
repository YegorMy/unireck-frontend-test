import { describe, expect, it, vi } from "vitest";

// Provide the backend URL and API key for the test runner before the API
// module loads (config caches both on first access).
process.env.VITE_API_BASE_URL = "http://test.local";
process.env.VITE_API_KEY = "test-key";

const { ApiError, decodeBrief, getRun } = await import("./api.ts");
import type { RunDTO } from "./types.ts";

function makeRunDTO(overrides?: Partial<RunDTO>): RunDTO {
  return {
    run_id: "run-123",
    status: "succeeded",
    input_text: "Build a thing",
    structured_result: {
      summary: "A brief summary",
      goals: ["goal 1"],
      deliverables: ["deliverable 1"],
      constraints: [],
      risks: [{ risk: "risk 1", severity: "medium", reason: "reason 1" }],
      clarifying_questions: [],
      recommended_next_action: "next",
    },
    raw_provider_output: null,
    error_code: null,
    error_message: null,
    created_at: "2026-06-24T00:00:00Z",
    updated_at: "2026-06-24T00:00:00Z",
    ...overrides,
  };
}

describe("decodeBrief", () => {
  it("sends the expected request and returns a valid RunDTO", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(makeRunDTO()), { status: 200 })
    );
    globalThis.fetch = fetchSpy;

    const result = await decodeBrief("Build a thing");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const request = new Request(fetchSpy.mock.calls[0][0], fetchSpy.mock.calls[0][1]);
    expect(request.url).toBe("http://test.local/v1/briefs/decode");
    expect(request.method).toBe("POST");
    expect(request.headers.get("Content-Type")).toBe("application/json");
    expect(request.headers.get("X-API-Key")).toBe("test-key");
    expect(await request.json()).toEqual({ brief_text: "Build a thing" });
    expect(result.run_id).toBe("run-123");
    expect(result.status).toBe("succeeded");
  });

  it("accepts a null updated_at", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(makeRunDTO({ updated_at: null })), { status: 200 })
    );

    const result = await decodeBrief("Build a thing");
    expect(result.updated_at).toBeNull();
  });

  it("rejects a non-string, non-null updated_at", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ ...makeRunDTO(), updated_at: 123 }),
        { status: 200 }
      )
    );

    await expect(decodeBrief("Build a thing")).rejects.toThrow(
      /invalid success response/
    );
  });

  it("throws for a malformed success body", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ not_a_run: true }), { status: 200 })
    );

    await expect(decodeBrief("Build a thing")).rejects.toThrow(
      /invalid success response/
    );
  });

  it("throws ApiError with status for a valid error envelope", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error_code: "SCHEMA_VALIDATION",
          message: "Invalid brief",
          run_id: "run-123",
        }),
        { status: 422 }
      )
    );

    const rejected = expect(decodeBrief("Build a thing")).rejects;
    await rejected.toBeInstanceOf(ApiError);
    await rejected.toMatchObject({
      status: 422,
      errorCode: "SCHEMA_VALIDATION",
      message: "Invalid brief",
      runId: "run-123",
    });
  });

  it.each([
    ["RUN_NOT_FOUND", 404],
    ["RUN_PENDING", 409],
    ["UNEXPECTED_ERROR", 500],
  ] as const)("throws ApiError for %s envelopes", async (errorCode, status) => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error_code: errorCode,
          message: `Error: ${errorCode}`,
          run_id: "run-123",
        }),
        { status }
      )
    );

    const rejected = expect(decodeBrief("Build a thing")).rejects;
    await rejected.toBeInstanceOf(ApiError);
    await rejected.toMatchObject({
      status,
      errorCode,
      message: `Error: ${errorCode}`,
      runId: "run-123",
    });
  });

  it("throws for a malformed error envelope", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ error_code: "BOGUS_CODE", message: "Bad" }),
        { status: 500 }
      )
    );

    await expect(decodeBrief("Build a thing")).rejects.toThrow(
      /API request failed/
    );
  });

  it("throws for a non-JSON error body", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("Internal Server Error", { status: 502 })
    );

    await expect(decodeBrief("Build a thing")).rejects.toThrow(
      /API request failed/
    );
  });
});

describe("getRun", () => {
  it("sends the expected GET request and returns a valid RunDTO", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(makeRunDTO()), { status: 200 })
    );
    globalThis.fetch = fetchSpy;

    const result = await getRun("run/with+id");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const request = new Request(fetchSpy.mock.calls[0][0], fetchSpy.mock.calls[0][1]);
    expect(request.url).toBe("http://test.local/v1/briefs/runs/run%2Fwith%2Bid");
    expect(request.method).toBe("GET");
    expect(request.headers.get("X-API-Key")).toBe("test-key");
    expect(result.run_id).toBe("run-123");
  });
});
