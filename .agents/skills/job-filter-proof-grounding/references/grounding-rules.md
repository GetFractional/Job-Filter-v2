# Grounding Rules

## Allowed

- transform approved proof into profile-ready or asset-ready phrasing
- extract candidate story fragments or role-fit signals as suggestions
- rank or compare extraction candidates
- exclude unresolved proof from auto-use
- show uncertainty explicitly

## Disallowed

- invent company names
- invent role titles
- invent dates
- infer results that are not represented in source material
- silently convert weak suggestions into approved proof
- silently promote extracted story fragments into approved profile content
- imply application status, role fit, or asset readiness that is not supported by confirmed data
- collapse `used`, `missing`, and `excluded` into generic confidence language

## Required Behavior

- user approval remains the gating step for high-risk claims
- suggested story fragments remain visible and separable until approved
- rationale surfaces keep `used`, `missing`, and `excluded` explicit
- excluded items remain recoverable
- compare options must prefer structural clarity over count inflation
- downstream assets and application-tracking states retain lineage to approved proof
