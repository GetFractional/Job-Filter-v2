# Scoring Decision Contract (A2)

## Score Labels
- `0-39`: Pass
- `40-69`: Maybe
- `70-100`: Pursue

Labels are derived from score bands in a single utility and reused across scoring, workspace, pipeline, and dashboard calculations.

## Rule Types
- Hard disqualifier:
  - User-controlled hard filter mismatch.
  - Forces score to `0` and label `Pass`.
- Risk warning:
  - Advisory signal that should not block scoring.
  - Appears in "Risks to consider".
- Unknown:
  - Insufficient information to verify a hard filter.
  - Defaults to warning, not disqualification.

## Seed-stage Policy
User controlled via profile scoring policy:
- `warn` (default): seed-stage creates a risk warning.
- `disqualify`: seed-stage becomes a hard disqualifier.
- `ignore`: no seed-stage penalty.

## Benefits Policy
- Required benefits are only hard disqualifiers when benefits are clearly present in job text and required benefits are missing.
- If benefits are not clearly stated, treat as unknown and show warning.

## Must-have Gating
The scorer computes:
- total must-haves
- met
- partial
- missing
- blocker flag (`missing > 0`)

The UI exposes these counts and actionable gap suggestions.
