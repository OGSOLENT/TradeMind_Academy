/**
 * Reports whether Google sign-in is live on the production Firebase project.
 *
 *   npx tsx scripts/check-google.ts
 *
 * It asks createAuthUri for a Google OAuth URL, which is exactly what the
 * popup handler does. If the provider is off, Identity Toolkit answers
 * OPERATION_NOT_ALLOWED. The older getProjectConfig.idpConfig field this
 * script used to read isn't returned any more, and it was giving me a false
 * negative.
 */
import { readFileSync } from "node:fs";

function readEnv(name: string): string {
  const line = readFileSync(".env.production.local", "utf8")
    .split("\n")
    .find((l) => l.startsWith(`${name}=`));
  if (!line) throw new Error(`${name} missing from .env.production.local`);
  return line.slice(name.length + 1).trim();
}

async function main() {
  const key = readEnv("NEXT_PUBLIC_FIREBASE_API_KEY");
  const project = readEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId: "google.com",
        continueUri: "http://localhost:3000/__/auth/handler",
      }),
    },
  );
  const body = (await res.json()) as { authUri?: string; error?: { message?: string } };

  const cfg = (await (
    await fetch(
      `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${key}`,
    )
  ).json()) as { authorizedDomains?: string[] };

  console.log(`\n  project: ${project}`);
  console.log("  authorised domains:");
  for (const d of cfg.authorizedDomains ?? []) console.log(`    ${d}`);

  if (body.authUri) {
    const clientId = /client_id=([^&]+)/.exec(body.authUri)?.[1] ?? "?";
    console.log(`\n  google.com: ENABLED ✅  (OAuth client ${clientId.slice(0, 24)}…)`);
    console.log("\n  → Ready. Run `npm run dev` and open http://localhost:3000/sign-in\n");
    return;
  }
  console.log(`\n  google.com: NOT ENABLED ❌  (${body.error?.message ?? res.status})`);
  console.log(
    "\n  → Enable it in the console (docs/GOOGLE_SIGNIN.md step 1):\n" +
      `    https://console.firebase.google.com/project/${project}/authentication/providers\n`,
  );
  process.exit(2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
