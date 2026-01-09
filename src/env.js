import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    BETTER_AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    DATABASE_URL: z.string().url(),
    RESEND_API_KEY: z.string().optional(),
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    CRON_SECRET: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    // Kiwatt platform billing info
    KIWATT_COMPANY_NAME: z.string().default("Flathunters Sàrl"),
    KIWATT_ADDRESS: z.string().default("Rue Sainte-Beuve 4"),
    KIWATT_POSTAL_CODE: z.string().default("1005"),
    KIWATT_CITY: z.string().default("Lausanne"),
    KIWATT_EMAIL: z.string().default("info@kiwatt.ch"),
    KIWATT_IBAN: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_APP_URL:
      process.env.NODE_ENV === "production"
        ? z.string().url()
        : z.string().url().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    CRON_SECRET: process.env.CRON_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
    // Kiwatt platform billing
    KIWATT_COMPANY_NAME: process.env.KIWATT_COMPANY_NAME,
    KIWATT_ADDRESS: process.env.KIWATT_ADDRESS,
    KIWATT_POSTAL_CODE: process.env.KIWATT_POSTAL_CODE,
    KIWATT_CITY: process.env.KIWATT_CITY,
    KIWATT_EMAIL: process.env.KIWATT_EMAIL,
    KIWATT_IBAN: process.env.KIWATT_IBAN,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
