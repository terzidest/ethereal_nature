import { z } from 'zod'

/**
 * Env-driven configuration mirroring the Kotlin application.conf: same
 * variable names, same dev fallbacks. Secrets have dev-only defaults so a
 * bare `pnpm dev` works; every real environment overrides them.
 */
const envSchema = z.object({
  PORT: z.coerce.number().int().default(8080),
  DATABASE_URL: z.string().optional(),
  DATABASE_USER: z.string().optional(),
  DATABASE_PASSWORD: z.string().optional(),
  JWT_SECRET: z.string().default('dev-only-secret-do-not-use-in-production'),
  ADMIN_EMAIL: z.string().default('admin@ethereal.dev'),
  ADMIN_PASSWORD: z.string().default('admin-dev-password'),
  VIEWER_EMAIL: z.string().default('viewer@ethereal.dev'),
  VIEWER_PASSWORD: z.string().default('viewer-dev-password'),
  DEMO_LOGIN_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  PAYMENTS_WEBHOOK_SECRET: z.string().default('dev-only-webhook-secret-do-not-use-in-production'),
  MOCK_PSP_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),
})

export interface AppConfig {
  port: number
  database: { url: string | undefined; user: string | undefined; password: string | undefined }
  jwt: { secret: string; issuer: string; audience: string; expiresInMinutes: number }
  admin: { email: string; password: string }
  demo: { viewerEmail: string; viewerPassword: string; loginEnabled: boolean }
  payments: { webhookSecret: string; mockPspEnabled: boolean }
  corsAllowedOrigins: string[]
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const e = envSchema.parse(env)
  return {
    port: e.PORT,
    database: { url: e.DATABASE_URL, user: e.DATABASE_USER, password: e.DATABASE_PASSWORD },
    // issuer/audience/expiry are fixed in application.conf too (no env override).
    jwt: { secret: e.JWT_SECRET, issuer: 'ethereal-nature', audience: 'ethereal-nature-web', expiresInMinutes: 1440 },
    admin: { email: e.ADMIN_EMAIL, password: e.ADMIN_PASSWORD },
    demo: { viewerEmail: e.VIEWER_EMAIL, viewerPassword: e.VIEWER_PASSWORD, loginEnabled: e.DEMO_LOGIN_ENABLED },
    payments: { webhookSecret: e.PAYMENTS_WEBHOOK_SECRET, mockPspEnabled: e.MOCK_PSP_ENABLED },
    corsAllowedOrigins: e.CORS_ALLOWED_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter((o) => o.length > 0),
  }
}
