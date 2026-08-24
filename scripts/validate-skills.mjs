#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] || ".");
const skillsRoot = path.join(root, "skills");
const errors = [];
const skills = [];

for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = path.join(skillsRoot, entry.name, "SKILL.md");
  if (!fs.existsSync(file)) {
    errors.push(`Missing SKILL.md in ${entry.name}`);
    continue;
  }
  const content = fs.readFileSync(file, "utf8");
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatter) {
    errors.push(`Missing frontmatter in ${file}`);
    continue;
  }
  const name = frontmatter[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = frontmatter[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (name !== entry.name) errors.push(`Skill name ${name} does not match directory ${entry.name}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name || "")) errors.push(`Invalid skill name: ${name}`);
  if (!description || description.length < 40) errors.push(`Description is too short in ${file}`);
  skills.push({ name, file: path.relative(root, file), descriptionLength: description?.length || 0 });
}

console.log(JSON.stringify({ skills, errors }, null, 2));
process.exit(errors.length ? 1 : 0);
