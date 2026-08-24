#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] || ".");
const self = path.resolve(process.argv[1]);
const findings = [];
const ignoredDirectories = new Set([".git", "node_modules", "dist", "coverage"]);
const binaryExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".zip", ".tgz", ".gz", ".woff", ".woff2"]);
const patterns = [
  ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["bearer token", /Bearer\s+[A-Za-z0-9._~+\/-]{20,}/],
  ["model-style secret", /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
  ["AWS access key", /\bAKIA[A-Z0-9]{16}\b/],
  ["credential-bearing DSN", /(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s:@]+:[^\s@]+@/],
  ["secret assignment", /(?:API_KEY|TOKEN|PASSWORD|SECRET)\s*=\s*["']?(?!YOUR_|CHANGE_ME|\$\{)[A-Za-z0-9_./+=-]{16,}/i],
  ["macOS personal path", /\/Users\/[A-Za-z0-9._-]+\//],
  ["Linux personal path", /\/home\/[A-Za-z0-9._-]+\//],
  ["Windows personal path", /[A-Za-z]:\\Users\\[A-Za-z0-9._-]+\\/]
];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (path.resolve(full) === self || binaryExtensions.has(path.extname(entry.name).toLowerCase())) continue;
    const content = fs.readFileSync(full, "utf8");
    for (const [name, pattern] of patterns) {
      const match = content.match(pattern);
      if (match) findings.push({ file: path.relative(root, full), rule: name, match: "redacted" });
    }
  }
}

walk(root);
const relativeRoot = path.relative(process.cwd(), root);
const displayRoot = !relativeRoot ? "." : relativeRoot.startsWith("..") ? path.basename(root) : relativeRoot;
console.log(JSON.stringify({ root: displayRoot, findings }, null, 2));
process.exit(findings.length ? 1 : 0);
