/**
 * Report which sign-in providers are live on the production Firebase project.
 *
 * Run after enabling Google in the console (docs/GOOGLE_SIGNIN.md):
 *   npx tsx scripts/check-google.ts
 */
const API_KEY = "AIzaSyBDFIkzp7WEJz7p7jhJe8KXY_SjHvE7N20";
const CONFIG_URL = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${API_KEY}`;

interface ProjectConfig {
  authorizedDomains?: string[];
  idpConfig?: Array<{ provider?: string; enabled?: boolean }>;
}

async function main() {
  const res = await fetch(CONFIG_URL);
  if (!res.ok) {
    console.error(`Could not read project config: ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const cfg = (await res.json()) as ProjectConfig;
  const idps = cfg.idpConfig ?? [];

  const google = idps.find((i) => i.provider === "google.com");
  console.log(`\n  google.com: ${google?.enabled ? "ENABLED ✅" : "NOT ENABLED ❌"}`);

  if (idps.length > 0) {
    console.log("\n  all providers:");
    for (const i of idps) {
      console.log(`    ${(i.provider ?? "?").padEnd(18)} ${i.enabled ? "enabled" : "disabled"}`);
    }
  }

  console.log("\n  authorised domains:");
  for (const d of cfg.authorizedDomains ?? []) console.log(`    ${d}`);

  if (!google?.enabled) {
    console.log(
      "\n  → Not enabled yet. Follow docs/GOOGLE_SIGNIN.md step 1:\n" +
        "    https://console.firebase.google.com/project/trademind-academy/authentication/providers\n",
    );
    process.exit(2);
  }
  console.log(
    "\n  → Ready. Run `npm run build && PORT=3001 npm run start`, then open http://localhost:3001\n",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
