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
