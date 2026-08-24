# Contributing

Contributions should improve traceability, validation, portability, or safety without turning the Skills into framework-specific monoliths.

## Requirements

1. Do not submit copyrighted course handbooks, textbooks, student reports, screenshots, or private project artifacts.
2. Use synthetic examples with fictional identities and data.
3. Keep third-party attribution and licenses intact.
4. Add or update a failing fixture for every new validation rule.
5. Run `npm test`, `npm run audit:example`, and `npm run scan:portable`.
6. Explain whether a rule is universal, profile-specific, or project-specific.
7. Keep `SKILL.md` compliant with the open Agent Skills specification and run `npm run validate:discovery`.

## Pull Requests

Describe the problem, the evidence, the chosen boundary, and the verification result. Avoid claims such as “fully consistent” unless the underlying artifacts were machine-checked and semantically reviewed.
