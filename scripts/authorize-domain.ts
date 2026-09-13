/**
 * Adds a domain to Firebase Auth's authorised list, so Google sign-in works
 * from a deployment. Same thing as Authentication → Settings → Authorised
 * domains in the console, but from the terminal.
 *
 *   npx tsx scripts/authorize-domain.ts trademind-academy.vercel.app
 *
 * Needs serviceAccountKey.json in the project root (gitignored). It reads
 * the current list, appends the new domain if it isn't there, and writes
 * the list back through the Identity Toolkit admin API. Nothing else in
 * the project config is touched, because the update mask names only
 * authorizedDomains.
 */
import { readFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";

const domain = process.argv[2]?.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
if (!domain) {
  console.error("usage: npx tsx scripts/authorize-domain.ts <domain>");
  process.exit(2);
}

async function main() {
  const key = JSON.parse(readFileSync("serviceAccountKey.json", "utf8")) as {
    project_id: string;
  };
  // The admin SDK already knows how to turn the key into an access token,
  // so I borrow its credential rather than adding another dependency.
  const credential = cert(key as Parameters<typeof cert>[0]);
  const app = getApps()[0] ?? initializeApp({ credential, projectId: key.project_id });
  const token = (await app.options.credential!.getAccessToken()).access_token;
  const base = `https://identitytoolkit.googleapis.com/admin/v2/projects/${key.project_id}/config`;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const current = (await (await fetch(base, { headers })).json()) as {
    authorizedDomains?: string[];
    error?: { message?: string };
  };
  if (current.error) throw new Error(current.error.message);
  const domains = current.authorizedDomains ?? [];
  if (domains.includes(domain)) {
    console.log(`${domain} is already authorised.`);
    console.log(domains.join("\n"));
    return;
  }

  const res = await fetch(`${base}?updateMask=authorizedDomains`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ authorizedDomains: [...domains, domain] }),
  });
  const body = (await res.json()) as { authorizedDomains?: string[]; error?: { message?: string } };
  if (body.error) throw new Error(body.error.message);
  console.log(`Added ${domain}. Authorised domains are now:`);
  console.log((body.authorizedDomains ?? []).join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
