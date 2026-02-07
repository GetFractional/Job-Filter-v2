# Template System

## Overview

This directory contains versioned prompt templates used to generate outreach assets, research prompts, and strategic documents for the job filtering and application pipeline.

Each template is a Markdown file with YAML frontmatter metadata and a body containing variable placeholders.

## Template Structure

Every template file follows this structure:

```
---
id: <unique-identifier>
type: <template-type>
version: <semver or integer version>
default_model_tier: <model tier to use by default>
tone: <writing tone/style>
variables:
  - variable_one
  - variable_two
---

Template body with {{variable_one}} and {{variable_two}} placeholders.
```

### Frontmatter Fields

| Field               | Description                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| `id`                | Unique identifier for the template (e.g., `outreach-email-v1`).            |
| `type`              | Category of output the template produces (e.g., `email`, `memo`, `prompt`). |
| `version`           | Version number. Increment when the template is modified.                    |
| `default_model_tier`| The default LLM model tier to use when rendering (e.g., `tier-1`, `tier-2`). |
| `tone`              | Description of the writing tone and style guidelines.                       |
| `variables`         | List of placeholder variable names used in the template body.               |

### Variables

Variables appear in the template body as `{{variable_name}}`. At render time, each variable is replaced with context-specific content pulled from the claim ledger, company research, or user input.

## Versioning

Templates are versioned explicitly in their `id` and `version` fields. When a template is modified:

1. Create a new file with the incremented version suffix (e.g., `outreach-email-v2.md`).
2. Update the `id` and `version` fields in the frontmatter.
3. Keep the previous version in the directory for rollback and comparison.

This allows side-by-side A/B testing and experimentation tracking. Metrics on open rates, response rates, or qualitative feedback can be logged against specific template versions to inform iteration.

## Templates Index

| File                          | Type            | Purpose                                      |
|-------------------------------|-----------------|----------------------------------------------|
| `outreach-email-v1.md`       | Email           | Cold outreach email, proof-led               |
| `linkedin-connect-v1.md`     | LinkedIn Note   | 300-char connection request note              |
| `cover-letter-v1.md`         | Cover Letter    | Application cover letter with open loop       |
| `growth-memo-v1.md`          | Strategic Memo  | Annual Growth Plan executive memo             |
| `perplexity-research-v1.md`  | Prompt Pack     | Perplexity research prompts for company intel |
| `followup-email-v1.md`       | Email           | Follow-up email after initial outreach        |

## Experimentation

To run an experiment between template versions:

1. Render both versions with the same input variables.
2. Track which version was sent to which contact.
3. Log outcomes (reply, no reply, meeting booked, etc.) against the template version.
4. Compare results to decide which version to promote or iterate on.
