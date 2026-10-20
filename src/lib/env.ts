import "server-only";

import { z } from "zod";

const schema = z
  .object({
    NODE_ENV: z.string().optional().default("development"),
    DATA_BACKEND: z.enum(["local", "supabase"]).default("local"),
    SESSION_SECRET: z.string().min(16),
    LOCAL_DEMO_EMAIL: z.string().email().default("yash@studio.test"),
    LOCAL_DEMO_PASSWORD: z.string().min(8).default("studio-demo"),
    NEXT_PUBLIC_SUPABASE_URL: z.union([z.string().url(), z.literal("")]).optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().default(""),
    GEMINI_API_KEY: z.string().optional().default(""),
    UPSTASH_REDIS_REST_URL: z.union([z.string().url(), z.literal("")]).optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional().default(""),
    GOOGLE_SHEETS_ID: z.string().optional().default(""),
    GOOGLE_SHEETS_API_KEY: z.string().optional().default(""),
    GOOGLE_SHEETS_RANGE: z.string().optional().default("Sheet1!A1:H500"),
    GOOGLE_OAUTH_CLIENT_ID: z.string().optional().default(""),
    GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional().default(""),
    GOOGLE_OAUTH_REDIRECT_URI: z.string().optional().default(""),
  })
  .superRefine((value, ctx) => {
    const production = value.NODE_ENV === "production";

    if (production && value.DATA_BACKEND === "local") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATA_BACKEND"],
        message: "Production must use DATA_BACKEND=supabase, not local.",
      });
    }

    if (production && value.SESSION_SECRET === "local-dev-only-change-before-any-real-deploy") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SESSION_SECRET"],
        message: "Set a unique SESSION_SECRET on Vercel. Do not use the local example value.",
      });
    }

    if (value.DATA_BACKEND !== "supabase") return;
    if (!value.NEXT_PUBLIC_SUPABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NEXT_PUBLIC_SUPABASE_URL"],
        message: "Add the Supabase project URL.",
      });
    }
    if (!value.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
        message: "Add the Supabase anon key.",
      });
    }
  });

function loadEnv() {
  const parsed = schema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    DATA_BACKEND: process.env.DATA_BACKEND,
    SESSION_SECRET: process.env.SESSION_SECRET,
    LOCAL_DEMO_EMAIL: process.env.LOCAL_DEMO_EMAIL,
    LOCAL_DEMO_PASSWORD: process.env.LOCAL_DEMO_PASSWORD,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID,
    GOOGLE_SHEETS_API_KEY: process.env.GOOGLE_SHEETS_API_KEY,
    GOOGLE_SHEETS_RANGE: process.env.GOOGLE_SHEETS_RANGE,
    GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    GOOGLE_OAUTH_REDIRECT_URI: process.env.GOOGLE_OAUTH_REDIRECT_URI,
  });

  if (!parsed.success) {
    const why = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join(" ");
    console.error(
      JSON.stringify({
        what: "The app could not start.",
        why,
        file: "src/lib/env.ts",
        connectedTo: ".env",
        fix: "Copy .env.example to .env and fill the missing values.",
      }),
    );
    throw new Error("The app could not start. Check .env.");
  }

  return parsed.data;
}

const raw = loadEnv();

/**
 * Server configuration. SUPABASE_SERVICE_ROLE_KEY is intentionally unread.
 * v1 does not build a client with the service role.
 */
const localDemo = raw.DATA_BACKEND === "local" && raw.NODE_ENV !== "production";

export const env = {
  isProduction: raw.NODE_ENV === "production",
  dataBackend: raw.DATA_BACKEND,
  sessionSecret: raw.SESSION_SECRET,
  /** Only for local offline demo. Empty on production / Supabase. */
  demoEmail: localDemo ? raw.LOCAL_DEMO_EMAIL : "",
  demoPassword: localDemo ? raw.LOCAL_DEMO_PASSWORD : "",
  supabaseUrl: raw.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: raw.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  geminiApiKey: raw.GEMINI_API_KEY,
  upstashUrl: raw.UPSTASH_REDIS_REST_URL ?? "",
  upstashToken: raw.UPSTASH_REDIS_REST_TOKEN,
  googleSheetsId: raw.GOOGLE_SHEETS_ID,
  googleSheetsApiKey: raw.GOOGLE_SHEETS_API_KEY,
  googleSheetsRange: raw.GOOGLE_SHEETS_RANGE || "Sheet1!A1:H500",
  googleOauthClientId: raw.GOOGLE_OAUTH_CLIENT_ID,
  googleOauthClientSecret: raw.GOOGLE_OAUTH_CLIENT_SECRET,
  googleOauthRedirectUri: raw.GOOGLE_OAUTH_REDIRECT_URI,
};
