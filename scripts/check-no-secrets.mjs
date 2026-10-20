/**
 * Fail if secret-looking files are tracked or staged.
 * Does not print file contents.
 */

import { execSync } from "node:child_process";

const forbiddenName =
  /(^|\/)(\.env($|\.)|\.env\.local$|google-refresh\.json$|local-store\.json$|local-accounts\.json$|credentials\.json$|service-account.*\.json$|.*\.(pem|p12)$)/i;

const allow = new Set([".env.example"]);

function lines(command) {
  try {
    const out = execSync(command, { encoding: "utf8" }).trim();
    return out ? out.split(/\r?\n/) : [];
  } catch {
    return [];
  }
}

const tracked = lines("git ls-files");
const staged = lines("git diff --cached --name-only");
const bad = [...new Set([...tracked, ...staged])].filter(
  (file) => !allow.has(file) && forbiddenName.test(file.replace(/\\/g, "/")),
);

if (bad.length > 0) {
  console.error("Sensitive files must stay out of git:");
  for (const file of bad) console.error(`  - ${file}`);
  console.error("Fix: remove them from the commit. Keep secrets in .env.local (gitignored).");
  process.exit(1);
}

console.log("Secret check passed. No sensitive files tracked or staged.");
