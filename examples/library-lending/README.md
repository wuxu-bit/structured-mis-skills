# Synthetic Library-Lending Example

This example is fictional and contains no course artifact, real identity, production data, or private system detail.

## Purpose

It demonstrates the minimum traceability chain:

```text
R-001/R-002
→ B-001 Borrow a book
→ TFD borrowing workflow
→ P1/P2 DFD processes
→ D-001...D-005 data flows
→ F1 logical store
→ DS and I dictionary entries
→ loan physical table mapping
```

## Files

- `analysis-model.json`: machine-readable requirements, DFD semantics, dictionary closure, state codes, and mapping.
- `tfd-borrow.drawio`: a TFD using the no-edge-label academic profile.
- `dfd-context.drawio`: a context DFD with named data flows.

The example is intentionally small. It proves the repository workflow and validators, not full library-system coverage.

## Validate

```bash
npm run audit:example
```
