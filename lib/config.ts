import { z } from "zod";

const configSchema = z.object({
  GRANTRAIL_MODE: z.enum(["demo", "production"]).default("demo"),
  GRANTRAIL_ADMIN_TOKEN: z.string().min(32).optional(),
  GRANTRAIL_ALLOWED_ORIGIN: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().default("file:./data/grantrail.db"),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  KARMA_API_BASE_URL: z.string().url().default("https://gapapi.karmahq.xyz"),
  KARMA_PROJECT_SLUG: z.string().optional(),
  KEEPERHUB_API_BASE_URL: z.string().url().default("https://app.keeperhub.com/api"),
  KEEPERHUB_API_KEY: z.string().min(10).optional(),
  KEEPERHUB_WORKFLOW_ID: z.string().optional(),
  ALLOWED_CHAIN_IDS: z.string().default("10"),
  ALLOWED_TOKEN_ADDRESSES: z.string().default("0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"),
  MAX_PAYOUT_USDC: z.coerce.number().positive().max(100000).default(10),
  PUBLIC_MAX_SUPPORT_USDC: z.coerce.number().positive().max(100).default(1),
  CONFIRMATION_TIMEOUT_MS: z.coerce.number().int().min(5000).max(600000).default(180000)
});

export type AppConfig = ReturnType<typeof getConfig>;

export function getConfig() {
  const parsed = configSchema.parse(process.env);
  if (parsed.GRANTRAIL_MODE === "production") {
    if (!parsed.GRANTRAIL_ADMIN_TOKEN || !parsed.KEEPERHUB_API_KEY) {
      throw new Error("Production mode requires GRANTRAIL_ADMIN_TOKEN and KEEPERHUB_API_KEY");
    }
  }
  return {
    ...parsed,
    demo: parsed.GRANTRAIL_MODE === "demo",
    allowedChainIds: new Set(parsed.ALLOWED_CHAIN_IDS.split(",").map(Number)),
    allowedTokenAddresses: new Set(parsed.ALLOWED_TOKEN_ADDRESSES.split(",").map((value) => value.trim().toLowerCase()))
  };
}
