# Security Policy

## Supported Versions

Security fixes are applied to the latest released version.

## Secrets

Never submit:

- model API keys or provider tokens;
- database passwords or real DSNs;
- JWT secrets, cookies, session data, or cloud credentials;
- private deployment URLs or signed URLs;
- machine-specific absolute paths containing personal names.

Use environment-variable names and invalid placeholders in documentation. Do not ask users to paste a secret into an issue, prompt transcript, tracked configuration, screenshot, or test fixture.

## Diagram Tools

This repository does not require or distribute a model API key. Optional draw.io MCP tooling receives diagram XML from the Agent runtime. Review the selected upstream tool before use, especially if diagrams contain confidential information or use a hosted diagrams.net renderer.

## Database Tools

DBHub must be configured with defense in depth:

1. a database-enforced read-only account;
2. DBHub read-only mode;
3. bounded rows and query timeout;
4. a test or staging database where possible;
5. a DSN loaded from a local secret source, never a tracked file.

Do not fall back from a missing read-only DSN to an application write account.

## State-Changing Operations

Migration application, seed, reset, DDL, DML, Git push, repository visibility changes, tags, and releases require explicit user confirmation. A successful validation report is not authorization to perform these operations.

## Reporting

Report security issues through a private GitHub Security Advisory:

https://github.com/wuxu-bit/structured-mis-skills/security/advisories/new

Do not include a working secret in a public issue. If a secret has been committed, revoke it first; deleting the visible file is not sufficient because Git history retains it.
