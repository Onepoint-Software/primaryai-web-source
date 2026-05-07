#!/usr/bin/env node
/**
 * Reads .env.local and pushes every variable to Cloudflare Pages (production) via API.
 *
 * Requires either:
 *   CLOUDFLARE_API_TOKEN  — a token with "Cloudflare Pages:Edit" permission, OR
 *   CLOUDFLARE_API_KEY + CLOUDFLARE_EMAIL  — your global API key from
 *     dash.cloudflare.com → My Profile → API Tokens → Global API Key
 *
 * Also requires:
 *   CLOUDFLARE_ACCOUNT_ID  — visible in the Cloudflare dashboard right sidebar
 *
 * Usage:
 *   CLOUDFLARE_ACCOUNT_ID=xxx CLOUDFLARE_API_KEY=yyy CLOUDFLARE_EMAIL=zzz \
 *     node scripts/sync-env-to-cloudflare.mjs
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");

function parseEnvFile(content) {
  const vars = {};
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key) vars[key] = val;
  }
  return vars;
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken  = process.env.CLOUDFLARE_API_TOKEN;
const apiKey    = process.env.CLOUDFLARE_API_KEY;
const email     = process.env.CLOUDFLARE_EMAIL;

if (!accountId) {
  console.error("Set CLOUDFLARE_ACCOUNT_ID (find it in the Cloudflare dashboard right sidebar).");
  process.exit(1);
}
if (!apiToken && !(apiKey && email)) {
  console.error(
    "Set either CLOUDFLARE_API_TOKEN (Pages:Edit permission)\n" +
    "or CLOUDFLARE_API_KEY + CLOUDFLARE_EMAIL (global API key from My Profile)."
  );
  process.exit(1);
}

let envContent;
try {
  envContent = readFileSync(envPath, "utf8");
} catch {
  console.error("Could not read .env.local");
  process.exit(1);
}

const vars = parseEnvFile(envContent);
const count = Object.keys(vars).length;
if (count === 0) {
  console.error(".env.local has no parseable KEY=VALUE lines.");
  process.exit(1);
}

const envVarsPayload = {};
for (const [key, value] of Object.entries(vars)) {
  envVarsPayload[key] = { value };
}

const headers = { "Content-Type": "application/json" };
if (apiToken) {
  headers["Authorization"] = `Bearer ${apiToken}`;
} else {
  headers["X-Auth-Key"]   = apiKey;
  headers["X-Auth-Email"] = email;
}

console.log(`Pushing ${count} variables to Cloudflare Pages project "primaryai-web-source" (production)…`);

const res = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/primaryai-web-source`,
  {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      deployment_configs: {
        production: { env_vars: envVarsPayload },
      },
    }),
  }
);

const data = await res.json();
if (!res.ok || !data.success) {
  console.error("Cloudflare API error:", JSON.stringify(data.errors ?? data, null, 2));
  process.exit(1);
}

console.log(`✓ ${count} variables synced. Trigger a new deployment for them to take effect.`);
