// Replays the OIDC handshake `npm publish` performs, because npm's own helper
// is contractually silent: it "is intended to never throw", so every reason it
// gives up is logged at verbose level and turned into a bare `return undefined`.
// `changeset publish` then discards npm's stderr as soon as it can parse the
// --json output, leaving ENEEDAUTH as the only symptom. Replaying the exchange
// is the only way to see what the registry actually objected to.
import { readFileSync } from "node:fs";

const registry = "https://registry.npmjs.org";
const audience = `npm:${new URL(registry).hostname}`;
const claimsToShow = [
  "repository",
  "repository_owner",
  "workflow_ref",
  "job_workflow_ref",
  "environment",
  "repository_visibility",
];

const { name } = JSON.parse(readFileSync("package.json", "utf8"));
// Mirrors npm-package-arg's escapedName: only the scope separator is escaped.
const escapedName = name.replace("/", "%2f");

const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
if (!requestUrl || !requestToken) {
  console.log("::error::No OIDC request credentials — the job lacks `id-token: write`.");
  process.exit(0);
}

const tokenUrl = new URL(requestUrl);
tokenUrl.searchParams.append("audience", audience);
const minted = await fetch(tokenUrl, {
  headers: { Accept: "application/json", Authorization: `Bearer ${requestToken}` },
});
if (!minted.ok) {
  console.log(`::error::GitHub refused to mint an ID token (${minted.status}).`);
  process.exit(0);
}
const { value: idToken } = await minted.json();

// Only the claims are printed, never the token: it authenticates as this run.
const payload = JSON.parse(Buffer.from(idToken.split(".")[1], "base64").toString("utf8"));
console.log(`Claims npm matches against the trusted publisher entry for ${name}:`);
for (const claim of claimsToShow) {
  console.log(`  ${claim}: ${payload[claim] ?? "<absent>"}`);
}

const exchanged = await fetch(`${registry}/-/npm/v1/oidc/token/exchange/package/${escapedName}`, {
  method: "POST",
  headers: { Accept: "application/json", Authorization: `Bearer ${idToken}` },
});
// The success body carries a live publish token, so it is never printed.
if (exchanged.ok) {
  console.log(`\nThe registry accepted the exchange (${exchanged.status}).`);
  console.log(
    "Trusted publishing is configured correctly — the publish failed for another reason.",
  );
  process.exit(0);
}

const body = await exchanged.text();
let message = body;
try {
  message = JSON.parse(body).message ?? body;
} catch {
  // Not JSON — the raw body is the most informative thing available.
}
console.log(`\n::error::The registry rejected the exchange (${exchanged.status}): ${message}`);
