import { describe, expect, it } from "vitest";

import { trustedAppOrigin } from "@/lib/security/app-origin";
import { sameSecret } from "@/lib/security/compare-secret";
import { securityHeaders } from "@/lib/security/headers";

describe("securityHeaders", () => {
  it("blocks other sites from framing the desk and sniffing files", () => {
    const headers = securityHeaders(true);
    const policy = headers.find((header) => header.key === "Content-Security-Policy")?.value ?? "";
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).not.toContain("unsafe-eval");
    expect(headers.find((header) => header.key === "Strict-Transport-Security")?.value).toContain("max-age=63072000");
  });

  it("keeps local pages on http by skipping the https-only rule", () => {
    const headers = securityHeaders(false);
    expect(headers.some((header) => header.key === "Strict-Transport-Security")).toBe(false);
    expect(headers.find((header) => header.key === "Content-Security-Policy")?.value).toContain("unsafe-eval");
  });
});

describe("trustedAppOrigin", () => {
  it("ignores an origin we do not own", () => {
    expect(trustedAppOrigin("https://evil.example", true)).toBe("https://campaign-desk-khaki.vercel.app");
    expect(trustedAppOrigin("http://localhost:3000", true)).toBe("https://campaign-desk-khaki.vercel.app");
  });

  it("keeps the live site and the local desk", () => {
    expect(trustedAppOrigin("https://campaign-desk-khaki.vercel.app", true)).toBe(
      "https://campaign-desk-khaki.vercel.app",
    );
    expect(trustedAppOrigin("http://127.0.0.1:3000", false)).toBe("http://127.0.0.1:3000");
  });
});

describe("sameSecret", () => {
  it("matches equal secrets and rejects a different length", () => {
    expect(sameSecret("abc123", "abc123")).toBe(true);
    expect(sameSecret("abc123", "abc124")).toBe(false);
    expect(sameSecret("short", "longer-value")).toBe(false);
    expect(sameSecret("", "")).toBe(false);
  });
});
