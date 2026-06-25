import { afterEach, describe, expect, it, vi } from "vitest";

describe("getApiBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers import.meta.env.VITE_API_BASE_URL when set", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://from-meta.env");
    vi.resetModules();

    const { getApiBaseUrl } = await import("./config.ts");

    expect(getApiBaseUrl()).toBe("http://from-meta.env");
  });

  it("falls back to process.env.VITE_API_BASE_URL", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://from-process.env");
    vi.resetModules();

    const { getApiBaseUrl } = await import("./config.ts");

    expect(getApiBaseUrl()).toBe("http://from-process.env");
  });

  it("defaults to http://localhost:8000 when no env value is set", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    vi.resetModules();

    const { getApiBaseUrl } = await import("./config.ts");

    expect(getApiBaseUrl()).toBe("http://localhost:8000");
  });
});

describe("getApiKey", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers VITE_API_KEY when set", async () => {
    vi.stubEnv("VITE_API_KEY", "from-env-key");
    vi.resetModules();

    const { getApiKey } = await import("./config.ts");

    expect(getApiKey()).toBe("from-env-key");
  });

  it("defaults to dev-secret-change-me when no env value is set", async () => {
    vi.stubEnv("VITE_API_KEY", "");
    vi.resetModules();

    const { getApiKey } = await import("./config.ts");

    expect(getApiKey()).toBe("dev-secret-change-me");
  });
});
